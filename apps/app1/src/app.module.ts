import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DaprClient, DaprWorkflowClient, WorkflowRuntime } from '@dapr/dapr';
import { OrderProcessingService } from './order-processing.service';
import { PrismaService } from './prisma.service';
import {
  AuthGuard,
  KeycloakConnectModule,
  ResourceGuard,
  RoleGuard,
  TokenValidation,
} from 'nest-keycloak-connect';
import { APP_GUARD } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';

@Module({
  imports: [
    KeycloakConnectModule.register({
      authServerUrl: 'http://keycloak:8080', // might be http://localhost:8080/auth for older keycloak versions
      realm: 'test_realm',
      clientId: 'test_client_confidential',
      secret: 'fyYdyshuKYJIhOL3KP2Gsk60KX3Cmwcg',
      tokenValidation: TokenValidation.ONLINE, // optional
      // policyEnforcement: PolicyEnforcementMode.PERMISSIVE, // optional
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
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ResourceGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class AppModule {}
