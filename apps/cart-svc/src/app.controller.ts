import { Body, Controller, Delete, Get, Put, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard } from '@5stones/nest-oidc';
import { AppService } from './app.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getCart(@CurrentUser() user: any) {
    return this.appService.getCart(user.id);
  }

  @Put()
  async addProductToCart(
    @CurrentUser() user: any,
    @Body() product: { id: string; quantity: number },
  ) {
    await this.appService.putCartItem(user.id, product);
  }

  @Delete()
  async removeProductFromCart(@CurrentUser() user: any, @Body() { productId }) {
    await this.appService.putCartItem(user.id, { id: productId, quantity: 0 });
  }
}
