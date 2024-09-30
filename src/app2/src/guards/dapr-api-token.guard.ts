import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class DaprApiTokenGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return request?.headers?.['dapr-api-token'] === 'ig/Qqa+atihYJYVbeZgUqQ';
  }
}
