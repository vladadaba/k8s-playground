import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { Roles, JwtAuthGuard, CurrentUser } from '@5stones/nest-oidc';
import { AppService } from './app.service';
import { ApproveOrderDto, OrderDto, PurchaseDto } from './model';

@Controller()
@UseGuards(JwtAuthGuard)
export class AppController {
  constructor(private readonly appService: AppService) {}
}
