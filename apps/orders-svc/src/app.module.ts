import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DaprClient, DaprWorkflowClient, WorkflowRuntime } from '@dapr/dapr';
import { OrderProcessingService } from './order-processing.service';
import { PrismaService } from './prisma.service';
import { ClsModule } from 'nestjs-cls';
import { AuthModule } from '@5stones/nest-oidc';

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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    OrderProcessingService,
    PrismaService,
    {
      provide: DaprClient,
      useValue: new DaprClient({
        actor: {
          actorIdleTimeout: '1h',
          actorScanInterval: '30s',
          drainOngoingCallTimeout: '1m',
          drainRebalancedActors: true,
          reentrancy: {
            enabled: true,
            maxStackDepth: 32,
          },
          remindersStoragePartitions: 0,
        },
      }),
    },
    {
      provide: DaprWorkflowClient,
      useValue: new DaprWorkflowClient(),
    },
    {
      provide: WorkflowRuntime,
      useValue: new WorkflowRuntime(),
    },
  ],
})
export class AppModule {}
