import { Injectable } from '@nestjs/common';
import { OrderProcessingService } from './order-processing.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(
    private readonly orderProcessingWorkflow: OrderProcessingService,
    private readonly prisma: PrismaService,
  ) {}

  async startWorkflow(productId: string, quantity: number) {
    const { cost } = await this.prisma.inventoryItem.findFirst({
      where: {
        id: productId,
      },
      select: {
        cost: true,
      },
    });

    const order = await this.prisma.order.create({
      data: {
        quantity,
        status: 'WAITING_FOR_APPROVAL',
        productId,
        totalCost: cost.mul(quantity),
      },
    });

    return this.orderProcessingWorkflow.start(order);
  }

  approve(orderId: string, approvedId: string, isApproved: boolean) {
    return this.orderProcessingWorkflow.approve(
      orderId,
      approvedId,
      isApproved,
    );
  }

  async getOrders() {
    const orders = await this.prisma.order.findMany({
      where: {
        status: 'WAITING_FOR_APPROVAL',
      },
      include: {
        product: true,
      },
    });

    return orders.map((o) => ({
      id: o.id,
      name: o.product.name,
      quantity: o.quantity,
      total: o.totalCost,
    }));
  }

  async getProducts() {
    const products = await this.prisma.inventoryItem.findMany();

    return products.map((o) => ({
      id: o.id,
      name: o.name,
      cost: o.cost,
      quantity: o.quantity,
    }));
  }
}
