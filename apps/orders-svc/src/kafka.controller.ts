import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class KafkaController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('cart.order')
  async placeOrder(@Payload() order: any) {
    return this.appService.placeOrder(order);
  }

  @EventPattern('users.users')
  async userUpdated(@Payload() user: any) {
    await this.appService.upsertUser(user);
  }
}
