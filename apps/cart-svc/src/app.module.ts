import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { ClsModule } from 'nestjs-cls';
import { AuthModule } from '@5stones/nest-oidc';
import { KafkaController } from './kafka.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule.forRoot({
      oidcAuthority: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
    }),
    ClsModule.forRoot({
      // https://papooch.github.io/nestjs-cls/introduction/quick-start
      // we can use this to save some request context
      global: true,
      middleware: { mount: true },
    }),
  ],
  controllers: [AppController, KafkaController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
