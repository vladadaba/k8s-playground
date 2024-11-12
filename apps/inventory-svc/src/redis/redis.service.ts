import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { RedisRepository } from './redis.repository';

@Injectable()
export class RedisService {
  constructor(
    @Inject(RedisRepository) private readonly redisRepository: RedisRepository,
  ) {}

  getProductsQuantity(ids: string[]) {
    return this.redisRepository.hmget('inventory', 'products', ids);
  }

  async setAllProductQuantities(products: Record<string, number>) {
    await this.redisRepository.hset('inventory', 'products', products);
  }

  async updateProductQuantity(id: string, quantityChange: number) {
    await this.redisRepository.hincrby(
      'inventory',
      'products',
      id,
      quantityChange,
    );
  }
}
