import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
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
}
