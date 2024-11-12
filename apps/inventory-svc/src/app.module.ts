import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@5stones/nest-oidc';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { ClsModule } from 'nestjs-cls';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule.forRoot({
      oidcAuthority: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
      roleEvaluators: [
        {
          expression:
            'jwt.realm_access.roles|mapValue[.value == "admin"]|length>0',
          role: 'admin',
        },
      ],
    }),
    ClsModule.forRoot({
      // https://papooch.github.io/nestjs-cls/introduction/quick-start
      // we can use this to save some request context
      global: true,
      middleware: { mount: true },
    }),
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
