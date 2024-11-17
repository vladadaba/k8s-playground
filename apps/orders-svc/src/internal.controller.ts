import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('internal')
// @UseGuards(JwtAuthGuard)
export class InternalController {
  constructor(private readonly appService: AppService) {}

  @Post()
  createOrderInternal(@Body() order: any) {
    return this.appService.createOrder(order);
  }

  @Patch(':orderId/assignee')
  assignOrderInternal(
    @Param('orderId') orderId: string,
    @Body() assignOrderData: { assigneeId: string },
  ) {
    return this.appService.assignOrder(orderId, {
      assigneeId: assignOrderData.assigneeId,
    });
  }

  @Post(':orderId/approve')
  approveOrderInternal(
    @Param('orderId') orderId: string,
    @Body()
    approveOrderData: {
      approvedBy?: string;
      status: 'approved' | 'rejected' | 'canceled';
    },
  ) {
    return this.appService.changeOrderStatus(orderId, {
      approvedBy: approveOrderData.approvedBy,
      status: approveOrderData.status,
    });
  }

  @Get('available-managers')
  async getAvailableManagers() {
    return this.appService.getAvailableManagers();
  }
}
