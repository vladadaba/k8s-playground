import { Injectable, Inject } from '@nestjs/common';
import { Client } from '@temporalio/client';

@Injectable()
export class WorkflowService {
  constructor(@Inject('WORKFLOW_CLIENT') private readonly client: Client) {}

  async placeOrder(order: any) {
    await this.client.workflow.start('orderApprovalWorkflow', {
      taskQueue: 'order-approval',
      workflowId: `order-approval-${order.id}`,
      args: [order],
    });
  }

  async approveOrder(orderId: string, isApproved: boolean, approvedBy: string) {
    const handle = await this.client.workflow.getHandle(
      `order-approval-${orderId}`,
    );

    await handle.signal('order_approved', {
      isApproved,
      approvedBy,
    });
  }
}
