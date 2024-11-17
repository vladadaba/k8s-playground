import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prismaService: PrismaService) {}

  async putCartItem(userId: string, product: { id: string; quantity: number }) {
    await this.prismaService.$transaction(async (prisma) => {
      // TODO: select for update
      const cart = await prisma.cart.findFirst({
        where: { userId, completedAt: null },
        include: { cartItemChanges: true },
      });

      if (cart) {
        await prisma.cartItemChange.create({
          data: {
            cartId: cart.id,
            productId: product.id,
            quantity: product.quantity,
          },
        });

        return;
      }

      // TODO: even with select for update, if it doesn't return any rows we can end up with 2 carts with same userId and completedAt is null
      await prisma.cart.create({
        data: {
          userId,
          cartItemChanges: {
            create: {
              productId: product.id,
              quantity: product.quantity,
            },
          },
        },
      });
    });
  }

  async getCartItems(userId: string) {
    const rows = await this.prismaService.$queryRaw<any[]>`
SELECT DISTINCT ON (cic.product_id) 
    cic.product_id as "productId",
    ii.name,
    ii.cost as "costPerItem",
    cic.quantity
FROM 
    cart c
JOIN 
    cart_item_change cic ON c.id = cic.cart_id
JOIN inventory_item ii ON cic.product_id = ii.id
WHERE 
    c.user_id = ${userId}
    AND c.completed_at IS NULL
ORDER BY 
    cic.product_id, cic.created_at desc`;

    return rows.map((item) => ({
      ...item,
      costPerItem: Number(item.costPerItem),
    }));
  }

  async upsertProduct(product: any) {
    await this.prismaService.inventoryItem.upsert({
      where: { id: product.id },
      create: {
        id: product.id,
        cost: product.cost || 0,
        name: product.name || '',
        quantity: product.quantity || 0,
      },
      update: product,
    });
  }

  async placeOrderForCurrentCart(userId: string) {
    await this.prismaService.$transaction(async (prisma) => {
      const carts = await prisma.cart.findMany({
        where: { userId, completedAt: null },
      });

      if (carts.length !== 1) {
        throw new Error(
          `TODO: placeOrderForCurrentCart updatedRows (${carts.length}) !== 1`,
        );
      }

      const cart = carts[0];
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          completedAt: new Date(),
        },
      });

      const cartItems = await this.getCartItems(userId);

      await prisma.outbox.create({
        data: {
          aggregateId: cart.userId, // TODO: is there a better key to use? cartId?
          aggregateType: 'order',
          operation: 'order_placed',
          payload: {
            cartId: cart.id,
            userId: cart.userId,
            orderItems: cartItems.map((item) => ({
              productId: item.productId,
              name: item.name,
              cost: item.costPerItem,
              quantity: item.quantity,
            })),
          },
        },
      });
    });
  }
}
