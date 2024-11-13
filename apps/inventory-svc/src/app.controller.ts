import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, Roles } from '@5stones/nest-oidc';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getProducts() {
    return this.appService.getProducts();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  async createProduct(@Body() data) {
    await this.appService.createProduct(data);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  async updateProduct(@Body() data) {
    await this.appService.updateProduct(data);
  }

  @Patch('/quantity')
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  async updateProductStock(@Body() data) {
    await this.appService.updateProductStock(data);
  }
}
