import {
  condition,
  defineSignal,
  proxyActivities,
  setHandler,
} from '@temporalio/workflow';
import type { OrderActivitiesService } from './activities/order-activities.service';

export const orderApprovalSignal = defineSignal<any | null>('order_approved');

const { createOrder, getManagerId, assignOrder, approveOrder } =
  proxyActivities<OrderActivitiesService>({
    startToCloseTimeout: '1 minute',
  });

export async function orderApprovalWorkflow(order: any): Promise<void> {
  let approvalData: {
    isApproved?: boolean;
    approvedBy?: string;
  } = null;

  // Register a query handler that allows querying for the current rates
  setHandler(
    orderApprovalSignal,
    (approvalDataSignal: { isApproved: boolean; approvedBy: string }) => {
      approvalData = approvalDataSignal;
    },
  );

  await createOrder(order);
  const orderId = order.id;

  const totalCost = order.orderItems.reduce(
    (total, item) => total + item.cost * item.quantity,
    0,
  );

  if (totalCost < 1000) {
    await approveOrder({ orderId, isApproved: true, approvedBy: null });
    return;
  }

  const assigneeId = await getManagerId();
  await assignOrder({ orderId, assigneeId });
  await condition(
    () => !!approvalData,
    /*24 * 60 * 60 * 1000 // wait for 1 day */
    5 * 60 * 1000, // wait for 5 minutes
  );

  const isApproved = approvalData?.isApproved || false;
  const approvedBy = approvalData?.approvedBy || null;
  await approveOrder({ orderId, isApproved, approvedBy });
}
