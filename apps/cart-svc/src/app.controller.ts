import { Body, Controller, Delete, Get, Put, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard } from '@5stones/nest-oidc';
import { AppService } from './app.service';
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCart(@CurrentUser() user: any) {
    return this.appService.getCart(user.sub);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async addProductToCart(
    @CurrentUser() user: any,
    @Body() product: { id: string; quantity: number },
  ) {
    await this.appService.putCartItem(user.sub, product);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async removeProductFromCart(@CurrentUser() user: any, @Body() { productId }) {
    await this.appService.putCartItem(user.sub, { id: productId, quantity: 0 });
  }

  @EventPattern('inventory.product')
  async onProductUpdate(@Payload() product: any, @Ctx() context: KafkaContext) {
    const headers = context.getMessage().headers;

    if (
      ['create', 'details_updated', 'stock_updated'].includes(
        headers['operation'] as string,
      )
    ) {
      await this.appService.upsertProduct(product);
    } else {
      // TODO:
    }
  }
}
