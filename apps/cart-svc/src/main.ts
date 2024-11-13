import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      consumer: {
        groupId: 'cart-svc',
      },
      client: {
        clientId: 'cart-svc-consumer',
        brokers: [process.env.KAFKA_BROKERS],
      },
    },
  });

  await app.startAllMicroservices();
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
