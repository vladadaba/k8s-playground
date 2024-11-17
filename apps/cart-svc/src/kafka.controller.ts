import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';

@Controller()
export class KafkaController {
  constructor(private readonly appService: AppService) {}

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
