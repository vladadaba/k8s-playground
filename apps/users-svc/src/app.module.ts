import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KeycloakModule } from './keycloak/keycloak.module';
import { KeycloakService } from './keycloak/keycloak.service';
import { PrismaService } from './prisma.service';
import { validate } from './config/env.validation';
import { AvroSchemaRegistrySerializer } from '@repo/avro-serder';
import { TestController } from './test.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ validate, isGlobal: true }),
    KeycloakModule,
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'users-svc-producer',
            brokers: process.env.KAFKA_BROKERS.split(','),
          },
          producerOnlyMode: true,
          serializer: new AvroSchemaRegistrySerializer(
            process.env.SCHEMA_REGISTRY_URL,
            {
              test: 1,
            },
          ),
        },
      },
    ]),
  ],
  controllers: [AppController, TestController],
  providers: [AppService, KeycloakService, PrismaService],
})
export class AppModule {}
