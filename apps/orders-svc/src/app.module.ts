import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { ClsModule } from 'nestjs-cls';
import { AuthModule } from '@5stones/nest-oidc';
import { WorkflowsModule } from './workflows/workflows.module';
import { InternalController } from './internal.controller';
import { WorkflowService } from './workflows/workflow.service';
import { KafkaController } from './kafka.controller';

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
    WorkflowsModule,
  ],
  controllers: [AppController, InternalController, KafkaController],
  providers: [AppService, PrismaService, WorkflowService],
})
export class AppModule {}
