import { DaprClient, HttpMethod } from '@dapr/dapr';
import { Injectable } from '@nestjs/common';
import { OrderProcessingService } from './order-processing.service';
import { OrderPayload } from './model';

@Injectable()
export class AppService {
  constructor(
    private readonly daprClient: DaprClient,
    private readonly orderProcessingWorkflow: OrderProcessingService,
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

  startWorkflow(order: OrderPayload) {
    return this.orderProcessingWorkflow.start(order);
  }
}
