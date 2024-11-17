import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrderApprovalWorkerModule } from './order-approval-worker/order-approval-worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    OrderApprovalWorkerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
