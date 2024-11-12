import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export const RedisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const redisInstance = new Redis({
      host: configService.get('REDIS_HOST'),
      port: configService.get<number>('REDIS_PORT'),
      username: configService.get('REDIS_USER'),
      password: configService.get('REDIS_PASSWORD'),
    });

    redisInstance.on('error', (e) => {
      throw new Error(`Redis connection failed: ${e}`);
    });

    return redisInstance;
  },
};
