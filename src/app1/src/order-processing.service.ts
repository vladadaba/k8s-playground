import {
  WorkflowActivityContext,
  WorkflowContext,
  TWorkflow,
  DaprClient,
  DaprWorkflowClient,
  WorkflowRuntime,
} from '@dapr/dapr';
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  OrderNotification,
  InventoryRequest,
  InventoryResult,
  InventoryItem,
  OrderPayload,
  OrderPaymentRequest,
} from './model';

const storeName = 'statestore'; // same as in redis-state.yaml

@Injectable()
export class OrderProcessingService implements OnModuleInit {
  constructor(
    private readonly daprClient: DaprClient,
    private readonly daprWorkflowClient: DaprWorkflowClient,
    private readonly daprWorkflowRuntime: WorkflowRuntime,
  ) {}

  async onModuleInit() {
    this.daprWorkflowRuntime
      .registerWorkflowWithName(
        'orderProcessingWorkflow',
        this.orderProcessingWorkflow,
      )
      .registerActivityWithName('notifyActivity', this.notifyActivity)
      .registerActivityWithName(
        'reserveInventoryActivity',
        this.reserveInventoryActivity,
      )
      .registerActivityWithName(
        'requestApprovalActivity',
        this.requestApprovalActivity,
      )
      .registerActivityWithName(
        'processPaymentActivity',
        this.processPaymentActivity,
      )
      .registerActivityWithName(
        'updateInventoryActivity',
        this.updateInventoryActivity,
      );

    // Wrap the worker startup in a try-catch block to handle any errors during startup
    try {
      await this.daprWorkflowRuntime.start();
      console.log('Workflow runtime started successfullyy');
    } catch (error) {
      console.error('Error starting workflow runtime:', error);
    }
  }

  start = async (order: OrderPayload) => {
    try {
      const id = await this.daprWorkflowClient.scheduleNewWorkflow(
        'orderProcessingWorkflow',
        order,
      );
      console.log(`Orchestration scheduled with ID: ${id}`);

      // Wait for orchestration completion
      const state = await this.daprWorkflowClient.waitForWorkflowCompletion(
        id,
        undefined,
        30,
      );

      var orchestrationResult = `Orchestration completed! Result: ${state?.serializedOutput}`;
      console.log(orchestrationResult);
    } catch (error) {
      console.error('Error scheduling or waiting for orchestration:', error);
      throw error;
    }
  };

  // Defines Notify Activity. This is used by the workflow to send out a notification
  private notifyActivity = async (
    _: WorkflowActivityContext,
    orderNotification: OrderNotification,
  ) => {
    console.log(orderNotification.message);
    return;
  };

  //Defines Reserve Inventory Activity. This is used by the workflow to verify if inventory is available for the order
  private reserveInventoryActivity = async (
    _: WorkflowActivityContext,
    inventoryRequest: InventoryRequest,
  ) => {
    console.log(
      `Reserving inventory for ${inventoryRequest.requestId} of ${inventoryRequest.quantity} ${inventoryRequest.itemName}`,
    );

    const result = await this.daprClient.state.get(
      storeName,
      inventoryRequest.itemName,
    );
    if (result == undefined || result == null) {
      return new InventoryResult(false, undefined);
    }
    const inventoryItem = result as InventoryItem;
    console.log(
      `There are ${inventoryItem.quantity} ${inventoryItem.itemName} in stock`,
    );

    if (inventoryItem.quantity >= inventoryRequest.quantity) {
      return new InventoryResult(true, inventoryItem);
    }
    return new InventoryResult(false, undefined);
  };

  private requestApprovalActivity = async (
    _: WorkflowActivityContext,
    orderPayLoad: OrderPayload,
  ) => {
    console.log(`Requesting approval for order ${orderPayLoad.itemName}`);
    return true;
  };

  private processPaymentActivity = async (
    _: WorkflowActivityContext,
    orderPaymentRequest: OrderPaymentRequest,
  ) => {
    console.log(
      `Processing payment for order ${orderPaymentRequest.itemBeingPurchased}`,
    );
    console.log(
      `Payment of ${orderPaymentRequest.amount} for ${orderPaymentRequest.quantity} ${orderPaymentRequest.itemBeingPurchased} processed successfully`,
    );
    return true;
  };

  private updateInventoryActivity = async (
    _: WorkflowActivityContext,
    inventoryRequest: InventoryRequest,
  ) => {
    console.log(
      `Updating inventory for ${inventoryRequest.requestId} of ${inventoryRequest.quantity} ${inventoryRequest.itemName}`,
    );
    const result = await this.daprClient.state.get(
      storeName,
      inventoryRequest.itemName,
    );
    if (result == undefined || result == null) {
      return new InventoryResult(false, undefined);
    }
    const inventoryItem = result as InventoryItem;
    inventoryItem.quantity = inventoryItem.quantity - inventoryRequest.quantity;
    if (inventoryItem.quantity < 0) {
      console.log(
        `Insufficient inventory for ${inventoryRequest.requestId} of ${inventoryRequest.quantity} ${inventoryRequest.itemName}`,
      );
      return new InventoryResult(false, undefined);
    }
    await this.daprClient.state.save(storeName, [
      {
        key: inventoryRequest.itemName,
        value: inventoryItem,
      },
    ]);
    console.log(
      `Inventory updated for ${inventoryRequest.requestId}, there are now ${inventoryItem.quantity} ${inventoryItem.itemName} in stock`,
    );
    return new InventoryResult(true, inventoryItem);
  };

  private orderProcessingWorkflow: TWorkflow = async function* (
    ctx: WorkflowContext,
    orderPayLoad: OrderPayload,
  ): any {
    const orderId = ctx.getWorkflowInstanceId();
    console.log(`Processing order ${orderId}...`);

    const orderNotification: OrderNotification = {
      message: `Received order ${orderId} for ${orderPayLoad.quantity} ${orderPayLoad.itemName} at a total cost of ${orderPayLoad.totalCost}`,
    };
    yield ctx.callActivity('notifyActivity', orderNotification);

    const inventoryRequest = new InventoryRequest(
      orderId,
      orderPayLoad.itemName,
      orderPayLoad.quantity,
    );
    const inventoryResult = yield ctx.callActivity(
      'reserveInventoryActivity',
      inventoryRequest,
    );

    if (!inventoryResult.success) {
      const orderNotification: OrderNotification = {
        message: `Insufficient inventory for order ${orderId}`,
      };
      yield ctx.callActivity('notifyActivity', orderNotification);
      return;
    }

    if (orderPayLoad.totalCost > 5000) {
      const approvalResult = yield ctx.callActivity(
        'requestApprovalActivity',
        orderPayLoad,
      );
      if (!approvalResult) {
        const orderNotification: OrderNotification = {
          message: `Order ${orderId} approval denied`,
        };
        yield ctx.callActivity('notifyActivity', orderNotification);
        return;
      }
    }

    const orderPaymentRequest = new OrderPaymentRequest(
      orderId,
      orderPayLoad.itemName,
      orderPayLoad.totalCost,
      orderPayLoad.quantity,
    );
    const paymentResult = yield ctx.callActivity(
      'processPaymentActivity',
      orderPaymentRequest,
    );

    if (!paymentResult) {
      const orderNotification: OrderNotification = {
        message: `Payment for order ${orderId} failed`,
      };
      yield ctx.callActivity(this.notifyActivity, orderNotification);
      return;
    }

    const updatedResult = yield ctx.callActivity(
      'updateInventoryActivity',
      inventoryRequest,
    );
    if (!updatedResult.success) {
      const orderNotification: OrderNotification = {
        message: `Failed to update inventory for order ${orderId}`,
      };
      yield ctx.callActivity('notifyActivity', orderNotification);
      return;
    }

    const orderCompletedNotification: OrderNotification = {
      message: `order ${orderId} processed successfully!`,
    };
    yield ctx.callActivity('notifyActivity', orderCompletedNotification);

    console.log(`Order ${orderId} processed successfully!`);
  };
}
