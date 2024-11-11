import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@5stones/nest-oidc';
import { AppService } from './app.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class AppController {
  constructor(private readonly appService: AppService) {}
}
