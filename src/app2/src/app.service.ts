import { DaprClient, HttpMethod } from '@dapr/dapr';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly daprClient: DaprClient) {}

  async hello(traceparent?: string): Promise<{
    service: string;
    response: Record<string, any>;
  }> {
    const response = await this.daprClient.invoker.invoke(
      'app3',
      'hello',
      HttpMethod.GET,
      null,
      {
        headers: {
          // have to propagate trace ourselves
          traceparent,
        },
      },
    );

    return {
      service: 'app2',
      response: response,
    };
  }
}
