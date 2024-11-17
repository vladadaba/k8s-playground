import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard } from '@5stones/nest-oidc';
import { AppService } from './app.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getOrders() {
    return this.appService.getOrders();
  }

  @Get(':orderId')
  getOrder(@Param('orderId') orderId: string) {
    return this.appService.getOrder(orderId);
  }

  @Post(':orderId/approve')
  async approveOrder(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() { isApproved }: any,
  ) {
    await this.appService.approveOrder(orderId, isApproved, user.sub);
  }
}
