import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis/redis.service';
import { Cart, CartItemChange } from 'generated/prisma-client';

@Injectable()
export class AppService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(RedisService) private readonly redisService: RedisService,
  ) {}

  async putCartItem(userId: string, product: { id: string; quantity: number }) {
    await this.prismaService.$transaction(async (prisma) => {
      // TODO: select for update
      const cart = await prisma.cart.findFirst({
        where: { userId, completedAt: null },
        include: { cartItemChanges: true },
      });

      if (!cart) {
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

        return;
      }

      await prisma.cartItemChange.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: product.quantity,
        },
      });
    });
  }

  async getCart(userId: string) {
    const rows = await this.prismaService.$queryRaw<(Cart & CartItemChange)[]>`
SELECT DISTINCT ON (cic."productId") 
    cic."productId",
    cic.quantity
FROM 
    "Cart" c
JOIN 
    "CartItemChange" cic ON c.id = cic."cartId"
WHERE 
    c."userId" = ${userId}
    AND c."completedAt" IS NULL
ORDER BY 
    cic."productId", cic."createdAt" DESC`;

    return rows;
  }
}
