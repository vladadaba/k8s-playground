import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KeycloakService } from './keycloak/keycloak.service';
import { PrismaService } from './prisma.service';
import { Role, User } from 'generated/prisma-client';

@Injectable()
export class AppService {
  private readonly logger = new Logger(KeycloakService.name);

  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
    private readonly keycloakService: KeycloakService,
    private readonly prismaService: PrismaService,
  ) {}

  async handleKeycloakEvent(payload: any) {
    const table = payload.source?.table;
    const operation = payload?.op;
    const data = payload?.after || payload?.before;
    const timestamp = new Date(payload?.ts_ms);
    let updatedUser: User;

    if (table === 'user_entity') {
      const isServiceAccount = data?.service_account_client_link != null;
      if (isServiceAccount) {
        return;
      }

      const realmId = data?.realm_id;
      const userId = data?.id;

      // Filter events by realmId to match keycloakService's realmId
      if (realmId !== this.keycloakService.realmId) {
        this.logger.warn(
          `Event from realm ${realmId} ignored (expected ${this.keycloakService.realmId})`,
        );
        return;
      }

      if (!userId) return;

      const userData = {
        id: userId,
        username: data?.username as string,
        updatedAt: timestamp,
        createdAt: new Date(data.created_timestamp),
        isDeleted: false,
      };

      if (operation === 'd') {
        // Handle delete operation by marking user as deleted
        userData.isDeleted = true;
      }

      updatedUser = await this.prismaService.user.upsert({
        where: { id: userId },
        create: userData,
        update: userData,
      });
    } else if (table === 'user_role_mapping') {
      const role = this.getRoleEnum(data?.role_id);
      const userId = data?.user_id;
      if (!role) {
        return;
      }

      updatedUser = await this.prismaService.$transaction(async (prisma) => {
        const rows = await prisma.$queryRaw<
          { roles: Role[] }[]
        >`select roles from users where id = ${userId} for update`;

        if (!rows.length) {
          return;
        }

        let [{ roles }] = rows;
        if (!roles) {
          roles = [];
        }

        if (operation === 'd') {
          roles = roles.filter((r) => r !== role);
        } else {
          roles = roles.concat(role);
        }

        return prisma.user.update({
          where: { id: userId },
          data: {
            roles,
          },
        });
      });
    }

    // TODO: deep equal to compare before and after value

    if (!updatedUser) {
      return;
    }

    // should be in outbox, but playing with schema-registry here
    this.kafkaClient.emit('users.users', {
      key: updatedUser.id,
      value: updatedUser,
    });
  }

  getRoleEnum(role_id: string) {
    if (role_id === this.keycloakService.adminRoleId) {
      return Role.ADMIN;
    }

    if (role_id === this.keycloakService.managerRoleId) {
      return Role.MANAGER;
    }

    return null;
  }
}
