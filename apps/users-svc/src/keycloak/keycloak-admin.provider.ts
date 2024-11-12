import { ConfigService } from '@nestjs/config';
import { Provider } from '@nestjs/common';
import KcAdminClient from 'keycloak-admin';

export const KeycloakAdminProvider: Provider = {
  provide: 'KEYCLOAK_ADMIN_CLIENT',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const baseUrl = configService.get<string>('KEYCLOAK_URL');
    const realmName = configService.get<string>('KEYCLOAK_REALM');

    const kcAdminClient = new KcAdminClient({
      baseUrl,
      realmName,
    });

    return kcAdminClient;
  },
};
