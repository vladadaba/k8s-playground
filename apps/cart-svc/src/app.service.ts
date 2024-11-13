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

  async getCart(userId: string) {
    const rows = await this.prismaService.$queryRaw<any[]>`
SELECT DISTINCT ON (cic.product_id) 
    ii.product_id as productId,
    ii.name,
    ii.cost as costPerItem,
    cic.quantity
FROM 
    cart c
JOIN 
    cart_item_change cic ON c.id = cic.cart_id
JOIN inventory_item ii ON cic.product_id = ii.product.id
WHERE 
    c.user_id = ${userId}
    AND c.completed_at IS NULL
ORDER BY 
    cic.product_id, cic.created_at DESC`;

    return rows;
  }

  async upsertProduct(product: any) {
    await this.prismaService.inventoryItem.upsert({
      where: { id: product.id },
      create: product,
      update: product,
    });
  }
}
