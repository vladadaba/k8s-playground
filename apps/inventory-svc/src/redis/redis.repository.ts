import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisRepository implements OnModuleDestroy {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  onModuleDestroy(): void {
    this.redisClient.disconnect();
  }

  get(prefix: string, key: string): Promise<any> {
    return this.redisClient.get(`${prefix}:${key}`);
  }

  hset(prefix: string, key: string, obj: any) {
    return this.redisClient.hset(`${prefix}:${key}`, obj);
  }

  hincrby(prefix: string, key: string, field: string, increment: number) {
    return this.redisClient.hincrby(`${prefix}:${key}`, field, increment);
  }

  hmget(prefix: string, key: string, fields: string[]) {
    return this.redisClient.hmget(`${prefix}:${key}`, ...fields);
  }

  hget(prefix: string, key: string, field: string) {
    return this.redisClient.hget(`${prefix}:${key}`, field);
  }
}
