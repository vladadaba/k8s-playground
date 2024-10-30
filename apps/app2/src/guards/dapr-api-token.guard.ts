import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Injectable()
export class DaprApiTokenGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}  
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return request?.headers?.['dapr-api-token'] === this.configService.get('APP_API_TOKEN');
  }
}
