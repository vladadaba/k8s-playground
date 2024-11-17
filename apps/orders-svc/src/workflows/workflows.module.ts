import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Connection } from '@temporalio/client';
import { WorkflowService } from './workflow.service';

@Module({
  providers: [
    {
      provide: 'WORKFLOW_CLIENT',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const connection = await Connection.connect({
          address: configService.get('TEMPORAL_HOST'),
        });

        return new Client({ connection });
      },
    },
    WorkflowService,
  ],
  exports: [WorkflowService, 'WORKFLOW_CLIENT'],
})
export class WorkflowsModule {}
