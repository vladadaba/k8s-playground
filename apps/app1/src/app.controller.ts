import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { AuthenticatedUser, Public, Roles } from 'nest-keycloak-connect';
import { AppService } from './app.service';
import { ApproveOrderDto, OrderDto, PurchaseDto } from './model';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern()
  syncUsersFromKeycloak(@Payload() data: any, @Ctx() context: RmqContext) {
    try {
      console.log(data);
      context.getChannelRef().ack(context.getMessage());
    } catch (err) {
      context.getChannelRef().reject(context.getMessage(), false); // this will dlq our message
    }
  }

  @Get('hello')
  @Public()
  hello() {
    return this.appService.hello();
  }

  @Get('hello_with_failures')
  helloWithFailures() {
    return this.appService.helloWithFailures();
  }

  @Post('publish_redis')
  async redisPublish(@Body() body) {
    await this.appService.redisPublish(body);
  }

  @Post('publish_rabbitmq')
  async rabbitmqPublish(@Body() body) {
    await this.appService.rabbitmqPublish(body);
  }

  @Post('state')
  async setState(@Body('key') key: string, @Body('value') value: string) {
    await this.appService.setState(key, value);
  }

  @Get('state')
  getState(@Query('key') key: string) {
    return this.appService.getState(key);
  }

  @Post('start-workflow')
  startWorkflow(@Body() { productId, quantity }: OrderDto) {
    return this.appService.startWorkflow(productId, quantity);
  }

  @Post('approve-order')
  @Roles({ roles: ['realm:admin'] }) // https://stackoverflow.com/questions/73653840/keycloak-and-nodejs-nestjs-wrong-role-mismatch
  approveOrder(
    @AuthenticatedUser() userInfo,
    @Body() { orderId, isApproved }: ApproveOrderDto,
  ) {
    const approverId = userInfo.sub;
    return this.appService.approve(orderId, approverId, isApproved);
  }

  @Get('orders')
  @Roles({ roles: ['realm:admin'] })
  getOrders() {
    return this.appService.getOrders();
  }

  @Get('products')
  @Public()
  getProducts() {
    return this.appService.getProducts();
  }

  @Post('purchase')
  purchase(
    @AuthenticatedUser() userInfo,
    @Body() { productId, quantity }: PurchaseDto,
  ) {
    return this.appService.startWorkflow(productId, quantity);
  }
}
