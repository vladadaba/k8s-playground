import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor() {}

  @EventPattern('keycloak')
  async onKeycloakUpdate(@Payload() message: any) {
    console.log('KAFKA MESSAGE:', JSON.stringify(message, null, 2));

    // TODO: queue is not created
    // this.kafkaClient.emit('users', { hello: 'world' });

    // insert into database
    // emit to `users` topic
  }
}
