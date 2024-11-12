import { Module } from '@nestjs/common';
import { KeycloakAdminProvider } from './keycloak-admin.provider';
import { KeycloakService } from './keycloak.service';

@Module({
  providers: [KeycloakAdminProvider, KeycloakService],
  exports: [KeycloakAdminProvider], // Export if needed in other modules
})
export class KeycloakModule {}
