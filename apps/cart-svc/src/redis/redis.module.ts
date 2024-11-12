import { Module } from '@nestjs/common';

import { RedisService } from './redis.service';
import { RedisProvider } from './redis.provider';
import { RedisRepository } from './redis.repository';

@Module({
  imports: [],
  controllers: [],
  providers: [RedisProvider, RedisRepository, RedisService],

  exports: [RedisService],
})
export class RedisModule {}
