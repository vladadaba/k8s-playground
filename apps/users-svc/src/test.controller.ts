import { Controller, Get, Inject } from '@nestjs/common';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';

@Controller('test')
export class TestController {
  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  @EventPattern('test')
  async onTest(@Payload() message: any) {
    console.log('onTest: ', message);
  }

  @Get('emit')
  async test() {
    this.kafkaClient.emit('test', {
      key: 5,
      value: {
        id: 5,
        name: 'Vlada',
        email: 'vladadaba92@gmail.com',
        age: 30,
      },
    });
  }
}
