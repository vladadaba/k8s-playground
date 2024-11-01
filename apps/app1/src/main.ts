import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://demo:demo@rabbitmq:5672'],
      noAck: false,
      queue: 'users',
    },
  });

  app.startAllMicroservices();
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
