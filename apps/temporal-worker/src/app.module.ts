import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrderApprovalWorkerModule } from './order-approval-worker/order-approval-worker.module';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
    }),
    OrderApprovalWorkerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
