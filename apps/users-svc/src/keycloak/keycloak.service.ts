import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KcAdminClient from 'keycloak-admin';

@Injectable()
export class KeycloakService implements OnModuleInit {
  private readonly logger = new Logger(KeycloakService.name);

  private _realmId: string | null = null;
  private _managerRoleId: string | null = null;
  private _adminRoleId: string | null = null;

  get realmId(): string | null {
    return this._realmId;
  }

  get managerRoleId(): string | null {
    return this._managerRoleId;
  }

  get adminRoleId(): string | null {
    return this._adminRoleId;
  }

  constructor(
    @Inject('KEYCLOAK_ADMIN_CLIENT')
    private readonly kcAdminClient: KcAdminClient,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      // Authenticate using client credentials
      await this.kcAdminClient.auth({
        clientId: this.configService.get('KEYCLOAK_CLIENTID'),
        clientSecret: this.configService.get('KEYCLOAK_SECRET'),
        grantType: 'client_credentials',
      });

      // Fetch realms to find the one with name = 'test_realm'
      const realms = await this.kcAdminClient.realms.find();
      const targetRealmName = this.configService.get('KEYCLOAK_REALM');
      const targetRealm = realms.find(
        (realm) => realm.realm === targetRealmName,
      );

      if (!targetRealm) {
        this.logger.error(`Realm with name "${targetRealmName}" not found`);
        return;
      }

      this._realmId = targetRealm.id;

      this.logger.log(`Found realm ID: ${targetRealm.id}`);

      // Set the realmName to the target for fetching roles
      this.kcAdminClient.setConfig({ realmName: targetRealm.realm });

      // Fetch roles 'manager' and 'admin' within the 'test_realm'
      const roles = await this.kcAdminClient.roles.find();

      const managerRole = roles.find((role) => role.name === 'manager');
      const adminRole = roles.find((role) => role.name === 'admin');

      if (managerRole) {
        this.logger.log(`Manager role ID: ${managerRole.id}`);
        this._managerRoleId = managerRole.id;
      } else {
        this.logger.warn('Manager role not found');
      }

      if (adminRole) {
        this.logger.log(`Admin role ID: ${adminRole.id}`);
        this._adminRoleId = adminRole.id;
      } else {
        this.logger.warn('Admin role not found');
      }
    } catch (error) {
      this.logger.error('Error while fetching realm or roles', error);
    }
  }
}
