import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      consumer: {
        groupId: 'users-svc',
      },
      client: {
        clientId: 'users-svc-consumer',
        brokers: [process.env.KAFKA_BROKERS],
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3000);
}

bootstrap();
