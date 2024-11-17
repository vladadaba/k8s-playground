import { Injectable } from '@nestjs/common';
import { OrdersSvcHttpService } from './orders-svc-http.module';

@Injectable()
export class OrderActivitiesService {
  constructor(
    private readonly ordersSvcHttpService: OrdersSvcHttpService
  ) {}

  async createOrder(order: any): Promise<void> {
    // TODO: handle duplicate id error due to retry, make activity idempotent
    const res = await this.ordersSvcHttpService.axiosRef.post(
      `internal`,
      order,
    );
  }

  async getManagerId(): Promise<string> {
    const { data: managers } = await this.ordersSvcHttpService.axiosRef.get('internal/available-managers');
    const manager = managers[Math.floor(Math.random() * managers.length)]

    return manager.id;
  }

  async assignOrder({ orderId, assigneeId }: { orderId: string, assigneeId: string }): Promise<void> {
    await this.ordersSvcHttpService.axiosRef.patch(
      `internal/${orderId}/assignee`,
      {
        assigneeId
      },
    );
  }

  async approveOrder({
    orderId,
    isApproved,
    approvedBy,
  }: {
    orderId: string;
    isApproved: boolean;
    approvedBy?: string;
  }): Promise<any> {
    const res = await this.ordersSvcHttpService.axiosRef.post(
      `internal/${orderId}/approve`,
      {
        approvedBy,
        status: isApproved ? 'approved' : 'rejected',
      },
    );
  }
}
