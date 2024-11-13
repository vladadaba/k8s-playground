import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('keycloak.users')
  async onKeycloakUpdate(@Payload() message: any) {
    if (!message.payload) {
      return;
    }

    await this.appService.handleKeycloakEvent(message.payload);
  }
}
