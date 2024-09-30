import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DaprClient, DaprServer } from '@dapr/dapr';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: DaprClient,
      useValue: new DaprClient(),
    },
    {
      provide: DaprServer,
      useValue: new DaprServer(),
    },
  ],
})
export class AppModule {}
