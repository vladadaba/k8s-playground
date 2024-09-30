import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  hello() {
    return {
      service: 'app3',
      response: 'Hello from App3',
    };
  }
}
