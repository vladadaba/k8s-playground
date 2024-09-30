import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  CommunicationProtocolEnum,
  DaprClient,
  DaprServer,
  DaprWorkflowClient,
  WorkflowRuntime,
} from '@dapr/dapr';
import { OrderProcessingService } from './order-processing.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    OrderProcessingService,
    {
      provide: DaprClient,
      useValue: new DaprClient({
        communicationProtocol: CommunicationProtocolEnum.GRPC,
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
      provide: DaprServer,
      useValue: new DaprServer({
        communicationProtocol: CommunicationProtocolEnum.GRPC,
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
