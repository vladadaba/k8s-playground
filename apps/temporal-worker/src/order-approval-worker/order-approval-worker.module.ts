import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NativeConnection, Worker } from '@temporalio/worker';
import { OrderApprovalWorkerService } from './order-approval-worker.service';
import { OrderActivitiesModule } from '../activities/order-activities.module';
import { OrderActivitiesService } from '../activities/order-activities.service';

@Module({
  imports: [OrderActivitiesModule],
  controllers: [],
  providers: [
    {
      provide: 'ORDER_APPROVAL_WORKER',
      inject: [OrderActivitiesService, ConfigService],
      useFactory: async (
        orderActivitiesService: OrderActivitiesService,
        configService: ConfigService,
      ) => {
        const activities = {
          createOrder: orderActivitiesService.createOrder.bind(
            orderActivitiesService,
          ),
          getManagerId: orderActivitiesService.getManagerId.bind(
            orderActivitiesService,
          ),
          assignOrder: orderActivitiesService.assignOrder.bind(
            orderActivitiesService,
          ),
          approveOrder: orderActivitiesService.approveOrder.bind(
            orderActivitiesService,
          ),
        };

        const connection = await NativeConnection.connect({
          address: configService.get('TEMPORAL_HOST'),
        });

        const worker = await Worker.create({
          workflowsPath: require.resolve('../workflows'),
          taskQueue: 'order-approval',
          activities,
          connection,
        });

        worker.run();
        console.log('Started worker!');

        return worker;
      },
    },
    OrderApprovalWorkerService,
  ],
})
export class OrderApprovalWorkerModule {}
