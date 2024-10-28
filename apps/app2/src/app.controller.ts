import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { DaprApiTokenGuard } from './guards/dapr-api-token.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  hello(@Headers() headers) {
    return this.appService.hello(headers['traceparent'] as string);
  }

  @Get('hello_with_failures')
  helloWithFailures(@Headers() headers) {
    const rnd = Math.random();
    console.log('RANDOM:', rnd);
    if (rnd > 0.1) {
      throw new Error('Error');
    }

    return this.appService.hello(headers['traceparent'] as string);
  }

  @Post('redis_consumer')
  @UseGuards(DaprApiTokenGuard)
  redisConsumer(@Headers() headers, @Body() body) {
    console.log('REDIS EVENT: ', JSON.stringify({ headers, body }));
  }

  @Post('rabbitmq_consumer')
  @UseGuards(DaprApiTokenGuard)
  rabbitmqConsumer(@Headers() headers, @Body() body) {
    console.log('RABBITMQ EVENT: ', JSON.stringify({ headers, body }));
  }
}
