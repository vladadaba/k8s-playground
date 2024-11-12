import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis/redis.service';

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
    *
  from
    "InventoryItem" item
  left join "InventoryItemDetails" details on
    item.id = details."productId"
  where
    details."createdAt" = (
    select
      MAX("createdAt")
    from
      "InventoryItemDetails"
    where
      id = item.id)`;

    const quantities = await this.redisService.getProductsQuantity(
      products.map((p) => p.id),
    );

    return products.map((p, i) => ({ ...p, quantity: quantities[i] }));
  }

  updateProduct({ id, cost, name }) {
    return this.prismaService.inventoryItemDetails.create({
      data: {
        productId: id,
        cost,
        name,
      },
    });
  }

  createProduct({ name, cost, quantity }) {
    return this.prismaService.inventoryItem.create({
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
    });
  }

  async updateProductStock({ productId, stockAdded }) {
    await this.prismaService.inventoryItemQuantityChange.create({
      data: {
        productId,
        quantityChange: stockAdded,
        type: 'RESTOCK',
      },
    });

    // TODO: this is dual write, how to do this in write-through way?
    await this.redisService.updateProductQuantity(productId, stockAdded);
  }
}
