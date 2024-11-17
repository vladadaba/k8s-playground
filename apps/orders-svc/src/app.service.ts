import { Injectable } from '@nestjs/common';
import { OrderStatusEnum, Role } from 'generated/prisma-client';
import { PrismaService } from './prisma.service';
import { WorkflowService } from './workflows/workflow.service';
import { uuid4 } from '@temporalio/workflow';

@Injectable()
export class AppService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly workflowService: WorkflowService,
  ) {}

  async upsertUser(user: any) {
    const userData = {
      id: user.id,
      username: user.username,
      roles: user.roles,
      isDeleted: false,
    };

    await this.prismaService.user.upsert({
      where: { id: user.id },
      create: userData,
      update: userData,
    });
  }

  async getAvailableManagers() {
    const managers = await this.prismaService.user.findMany({
      where: { roles: { has: Role.MANAGER } },
    });

    return managers;
  }

  async placeOrder({ cartId, userId, orderItems }) {
    const id = uuid4();
    await this.workflowService.placeOrder({
      id,
      cartId,
      userId,
      orderItems,
    });
  }

  async createOrder({ id, cartId, userId, orderItems }) {
    // TODO: reduce quantity when order placed or approved?
    await this.prismaService.order.create({
      data: {
        id,
        cartId,
        userId,
        orderItems: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            cost: item.cost,
          })),
        },
        status: {
          create: {
            status: OrderStatusEnum.WAITING_FOR_APPROVAL,
          },
        },
      },
    });
  }

  approveOrder(orderId: string, isApproved: boolean, approvedBy: string) {
    return this.workflowService.approveOrder(orderId, isApproved, approvedBy);
  }

  getOrders() {
    return this.prismaService.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { status: { orderBy: { createdAt: 'desc' } }, orderItems: true },
    });
  }

  getOrder(orderId: string) {
    return this.prismaService.order.findFirst({
      where: { id: orderId },
      include: { status: { orderBy: { createdAt: 'desc' } }, orderItems: true },
    });
  }

  changeOrderStatus(
    orderId: string,
    data: { approvedBy?: string; status: 'approved' | 'rejected' | 'canceled' },
  ) {
    return this.prismaService.orderStatusChange.create({
      data: {
        orderId,
        changedById: data.approvedBy,
        status: this.getStatusFromString(data.status),
      },
    });
  }

  assignOrder(orderId: string, data: { assigneeId: string }) {
    return this.prismaService.orderAssignmentChange.create({
      data: {
        orderId,
        assigneeId: data.assigneeId,
      },
    });
  }

  getStatusFromString(status: string): OrderStatusEnum {
    switch (status) {
      case 'approved':
        return OrderStatusEnum.APPROVED;
      case 'rejected':
        return OrderStatusEnum.REJECTED;
      case 'canceled':
        return OrderStatusEnum.CANCELED;
      default:
        throw new Error(`Unknown order status: ${status}`);
    }
  }
}
