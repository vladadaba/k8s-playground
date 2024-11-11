import {
  WorkflowActivityContext,
  WorkflowContext,
  TWorkflow,
  DaprWorkflowClient,
  WorkflowRuntime,
} from '@dapr/dapr';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Order, OrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class OrderProcessingService implements OnModuleInit {
  constructor(
    private readonly daprWorkflowClient: DaprWorkflowClient,
    private readonly daprWorkflowRuntime: WorkflowRuntime,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.daprWorkflowRuntime
      .registerWorkflowWithName(
        'purchaseOrderWorkflow',
        this.purchaseOrderWorkflow,
      )
      .registerActivityWithName('approveOrder', this.approveOrder)
      .registerActivityWithName('rejectOrder', this.rejectOrder);

    // Wrap the worker startup in a try-catch block to handle any errors during startup
    try {
      await this.daprWorkflowRuntime.start();
      console.log('Workflow runtime started successfully');
    } catch (error) {
      console.error('Error starting workflow runtime:', error);
    }
  }

  // Activity function that places an order
  approveOrder = async (
    _: WorkflowActivityContext,
    { order, approverId }: { order: Order; approverId?: string },
  ) => {
    // await this.prisma.$transaction(async (prisma) => {
    //   const affectedRows =
    //     await prisma.$executeRaw`update "InventoryItem" set "quantity" = "quantity" - ${order.quantity} where id = uuid(${order.productId})`;
    //   if (affectedRows !== 1) {
    //     // TODO: wtf?
    //   }
    // });
  };

  // Activity function that places an order
  rejectOrder = async (
    _: WorkflowActivityContext,
    { order, approverId }: { order: Order; approverId?: string },
  ) => {};

  // Orchestrator function that represents a purchase order workflow
  purchaseOrderWorkflow: TWorkflow = async function* (
    ctx: WorkflowContext,
    order: Order,
  ): any {
    // Orders under 1000 are auto-approved
    if (true /*new Decimal(order.cart).lessThan(1000)*/) {
      yield ctx.callActivity('approveOrder', { order });
      return;
    }

    // Orders of $1000 or more require manager approval
    // Approvals must be received within 2 minutes or they will be cancled.
    const approvalEvent = ctx.waitForExternalEvent('approval_received');
    const timeoutEvent = ctx.createTimer(60 * 2);
    const tasks = [approvalEvent, timeoutEvent];
    const winner = yield ctx.whenAny(tasks);

    if (winner == timeoutEvent) {
      yield ctx.callActivity('rejectOrder', { order });
    } else {
      const { approverId, isApproved } = approvalEvent.getResult();
      if (isApproved) {
        yield ctx.callActivity('approveOrder', { order, approverId });
      } else {
        yield ctx.callActivity('rejectOrder', { order, approverId });
      }
    }
  };

  start = async (order: Order) => {
    try {
      const id = await this.daprWorkflowClient.scheduleNewWorkflow(
        'purchaseOrderWorkflow',
        order,
        `purchase_order-${order.id}`,
      );
      console.log(`Orchestration scheduled with ID: ${id}`);

      // can take up to 2 minutes so we don't await it here
      // const state = await this.daprWorkflowClient.waitForWorkflowCompletion(id);
    } catch (error) {
      console.error('Error scheduling or waiting for orchestration:', error);
      throw error;
    }
  };

  async approve(orderId: string, approverId: string, isApproved: boolean) {
    await this.daprWorkflowClient.raiseEvent(
      `purchase_order-${orderId}`,
      'approval_received',
      {
        approverId,
        isApproved,
      },
    );
  }
}
