import { DaprClient, HttpMethod } from '@dapr/dapr';
import { Injectable } from '@nestjs/common';
import { OrderProcessingService } from './order-processing.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(
    private readonly daprClient: DaprClient,
    private readonly orderProcessingWorkflow: OrderProcessingService,
    private readonly prisma: PrismaService,
  ) {}

  async hello(): Promise<{
    service: string;
    response: Record<string, any>;
  }> {
    const response = await this.daprClient.invoker.invoke(
      'app2',
      'hello',
      HttpMethod.GET,
    );

    return {
      service: 'app1',
      response: response,
    };
  }

  async helloWithFailures(): Promise<{
    service: string;
    response: Record<string, any>;
  }> {
    const response = await this.daprClient.invoker.invoke(
      'app2',
      'hello_with_failures',
      HttpMethod.GET,
    );

    return {
      service: 'app1',
      response: response,
    };
  }

  async redisPublish(body: any): Promise<void> {
    await this.daprClient.pubsub.publish('redisbus', 'my_topic', body);
  }

  async rabbitmqPublish(body: any): Promise<void> {
    await this.daprClient.pubsub.publish('rabbitmqbus', 'my_topic', body);
  }

  setState(key: string, value: string) {
    return this.daprClient.state.save('statestore', [
      {
        key,
        value,
      },
    ]);
  }

  getState(key: string) {
    return this.daprClient.state.get('statestore', key);
  }

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
}
