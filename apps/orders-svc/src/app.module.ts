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
    // KeycloakConnectModule.registerAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: async (config: ConfigService) => ({
    //     authServerUrl: config.get('KEYCLOAK_URL'),
    //     realm: config.get('KEYCLOAK_REALM'),

    //     clientId: config.get('KEYCLOAK_CLIENTID'),
    //     secret: config.get('KEYCLOAK_SECRET'),

    //     tokenValidation: TokenValidation.OFFLINE, // fixed in @vladadaba/nest-keycloak-connect
    //     // realmPublicKey:
    //     //   'MIICozCCAYsCBgGTDZYvhzANBgkqhkiG9w0BAQsFADAVMRMwEQYDVQQDDAp0ZXN0X3JlYWxtMB4XDTI0MTEwODIxMDEwNloXDTM0MTEwODIxMDI0NlowFTETMBEGA1UEAwwKdGVzdF9yZWFsbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMQE9UC9thxkAhBSAaAYDKFHNje1VJvJSE76xRajsb8gFUaRglenJ9Uhp/7iNUbwN7GWoIKdisdx/Sk5Ee+Btid2UboFh0qbIoBlO0daHp5ctifqo04BWyWuQgrIo0LBFYWfCAWtL08453iqIYZYjv6QkuLfjDXI21stPx69XkAV6J14wrM7q6vCrCv35QX+jJ9Fq8I9VxxBsjK0ehGlnZASzaiSgarpiitMJi1ChaCYL4U5x/nFzHmUtC4dDrWqR4R3dtKqS9AUn4JMRRJvAir2RjgRFJAVRn72D3Nstd2QyUsPLr6E69wNQV7/vQnmvllyKiSoAwx9mWBdQFy6DOsCAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAnFF0DDL8qiFGajeboC8aavA62ejEHg3yYy3PdEHkO/MXoIhFaH9B1Mb5WRnIDQWqhk/PSooWgHOmF06UdDbnfRjG5xFGVonWvR/UjdKLjUNPB5LfbtF/zXCSHs3cJkXaM4C3iEV2vJJz2Vvwjywakyrr6r9YKUpX8f8GgzFaeDseLdGeftTHFkswYP4dWinEYcoIs46k7xGqroU/hudvQJ/vRmXZtZ9jEw7VYViz3jBlPzXVs1LG22kiuK3p/0DKBF+LL3yQG3OcXHzNSg9nohTlBL9TLcA4lelPLjnQ9xw9OrB3yC6bbPPyHrwWYZ4t22Wx4CfTks6IJlJId8gJug==',
    //     // policyEnforcement: PolicyEnforcementMode.PERMISSIVE, // optional
    //   }),
    // }),
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
