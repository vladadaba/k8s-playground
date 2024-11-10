import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  hello() {
    return {
      service: 'users-svc',
      response: 'Hello from users-svc',
    };
  }
}
