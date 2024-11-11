import { Injectable } from '@nestjs/common';
import { OrderProcessingService } from './order-processing.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(
    private readonly orderProcessingWorkflow: OrderProcessingService,
    private readonly prisma: PrismaService,
  ) {}
}
