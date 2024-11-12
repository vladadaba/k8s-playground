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
    const timestamp = payload?.ts_ms;
    let updatedUser: User;

    if (table === 'user_entity') {
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
        isDeleted: false,
        createdAt: operation === 'c' ? timestamp : undefined,
      };

      if (operation === 'd') {
        // Handle delete operation by marking user as deleted
        userData.isDeleted = true;
      }

      updatedUser = await this.prismaService.$transaction(async (prisma) => {
        // return value is created entity OR count of updated entities
        await prisma.user.upsert({
          where: { id: userId, updatedAt: { lt: timestamp } },
          create: userData,
          update: userData,
        });

        return prisma.user.findUnique({
          where: { id: userId },
        });
      });

      this.logger.log(`User updated: ${userId}`);
    } else if (table === 'user_role_mapping') {
      const role = this.getRoleEnum(data?.role_id);
      const userId = data?.user_id;
      if (!role) {
        return;
      }

      updatedUser = await this.prismaService.$transaction(async (prisma) => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        let roles;
        if (operation === 'c') {
          roles = user.roles.concat(role);
        } else if (operation === 'd') {
          roles = roles.filter((r) => r !== role);
        } else {
          return; // ?
        }

        return await prisma.user.update({
          where: { id: userId },
          data: {
            roles,
          },
        });
      });
    }

    this.kafkaClient.emit('users', {
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
