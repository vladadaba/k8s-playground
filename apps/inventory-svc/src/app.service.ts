import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis/redis.service';
import { Prisma } from 'generated/prisma-client';

@Injectable()
export class AppService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(RedisService) private readonly redisService: RedisService,
  ) {}

  async getProducts() {
    // TODO: add filtering and sorting
    const products = await this.prismaService.$queryRaw<{ id: string }[]>`
  select
    item.id,
    details.name,
    details.cost
  from
    inventory_item item
  left join inventory_item_details details on
    item.id = details.product_id
  where
    details.created_at = (
    select
      MAX(created_at)
    from
      inventory_item_details iid
    where
      iid.product_id = item.id)`;

    if (!products.length) {
      return [];
    }

    const quantities = await this.redisService.getProductsQuantity(
      products.map((p) => p.id),
    );

    return products.map((p, i) => ({ ...p, quantity: quantities[i] }));
  }

  updateProduct({ id, cost, name }) {
    return this.prismaService.$transaction(async (prisma) => {
      if (cost === undefined || name === undefined) {
        const previous = await prisma.inventoryItemDetails.findFirst({
          where: { productId: id },
          orderBy: { createdAt: Prisma.SortOrder.desc },
        });

        cost = cost || previous.cost;
        name = name || previous.name;
      }

      const retval = await prisma.inventoryItemDetails.create({
        data: {
          productId: id,
          cost,
          name,
        },
      });

      await prisma.outbox.create({
        data: {
          aggregateId: retval.productId,
          aggregateType: 'product',
          operation: 'details_updated',
          payload: {
            id: retval.productId,
            name: retval.name,
            cost: retval.cost,
          },
        },
      });

      return retval;
    });
  }

  async createProduct({ name, cost, quantity }) {
    await this.prismaService.$transaction(async (prisma) => {
      const product = await prisma.inventoryItem.create({
        data: {
          item: {
            create: {
              cost,
              name,
            },
          },
          InventoryItemQuantityChange: {
            create: {
              quantityChange: quantity,
              type: 'RESTOCK',
            },
          },
        },
        include: { item: true },
      });

      // TODO: this is dual write, how to do this in write-through way?
      const newQuantity = await this.redisService.updateProductQuantity(
        product.id,
        quantity,
      );

      product.item.sort(
        (b, a) => a.createdAt.getTime() - b.createdAt.getTime(),
      );

      await prisma.outbox.create({
        data: {
          aggregateId: product.id,
          aggregateType: 'product',
          operation: 'create',
          payload: {
            id: product.id,
            name: product.item[0].name,
            cost: product.item[0].cost,
            quantity: newQuantity,
          },
        },
      });

      return product;
    });
  }

  async updateProductStock({ productId, stockAdded }) {
    await this.prismaService.$transaction(async (prisma) => {
      const itemQuantityChange =
        await prisma.inventoryItemQuantityChange.create({
          data: {
            productId,
            quantityChange: stockAdded,
            type: 'RESTOCK',
          },
        });

      // TODO: this is dual write, how to do this in write-through way?
      const newQuantity = await this.redisService.updateProductQuantity(
        productId,
        stockAdded,
      );

      await prisma.outbox.create({
        data: {
          aggregateId: itemQuantityChange.productId,
          aggregateType: 'product',
          operation: 'stock_updated',
          payload: {
            id: itemQuantityChange.productId,
            quantity: newQuantity,
          },
        },
      });
    });
  }
}
