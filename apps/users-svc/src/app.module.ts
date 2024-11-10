import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DaprClient } from '@dapr/dapr';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: DaprClient,
      useValue: new DaprClient(),
    },
  ],
})
export class AppModule {}
