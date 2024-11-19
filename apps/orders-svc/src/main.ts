import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      consumer: {
        groupId: 'orders-svc',
      },
      client: {
        clientId: 'orders-svc-consumer',
        brokers: process.env.KAFKA_BROKERS.split(','),
      },
    },
  });

  await app.startAllMicroservices();
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
