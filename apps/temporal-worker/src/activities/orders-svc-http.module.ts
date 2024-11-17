import { HttpModule, HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export abstract class OrdersSvcHttpService extends HttpService {}

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get('ORDERS_SVC_URL'),
        // TODO: use keycloak service account which has admin role? Or impersonate manager?
        // headers: {
        //   Authorization: `Bearer ${configService.get(
        //     'ORDERS_SVC_WORKFLOWS_AUTH_TOKEN',
        //   )}`,
        // },
      }),
    }),
  ],
  providers: [{
    provide: OrdersSvcHttpService,
    useExisting: HttpService
  }],
  exports: [OrdersSvcHttpService],
})
export class OrdersSvcHttpModule {}
