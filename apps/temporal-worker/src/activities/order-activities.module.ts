import { Module } from '@nestjs/common';
import { OrderActivitiesService } from './order-activities.service';
import { OrdersSvcHttpModule } from './orders-svc-http.module';

@Module({
  imports: [OrdersSvcHttpModule],
  controllers: [],
  providers: [OrderActivitiesService],
  exports: [OrderActivitiesService],
})
export class OrderActivitiesModule {}
