import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, JwtAuthGuard } from '@5stones/nest-oidc';
import { AppService } from './app.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getCart(@CurrentUser() user: any) {
    return this.appService.getCartItems(user.sub);
  }

  @Put()
  async addProductToCart(
    @CurrentUser() user: any,
    @Body() product: { id: string; quantity: number },
  ) {
    await this.appService.putCartItem(user.sub, product);
  }

  @Delete()
  async removeProductFromCart(@CurrentUser() user: any, @Body() { productId }) {
    await this.appService.putCartItem(user.sub, { id: productId, quantity: 0 });
  }

  @Patch('/complete')
  async placeOrderForCurrentCart(@CurrentUser() user: any) {
    await this.appService.placeOrderForCurrentCart(user.sub);
  }
}
