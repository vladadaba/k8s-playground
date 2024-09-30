import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  hello() {
    return this.appService.hello();
  }

  @Post('redis_consumer')
  redisConsumer(@Headers() headers, @Body() body) {
    console.log('REDIS EVENT: ', JSON.stringify({ headers, body }));
  }

  @Post('rabbitmq_consumer')
  rabbitmqConsumer(@Headers() headers, @Body() body) {
    console.log('RABBITMQ EVENT: ', JSON.stringify({ headers, body }));
  }
}
