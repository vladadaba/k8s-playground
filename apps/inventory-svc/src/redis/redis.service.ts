import { Inject, Injectable } from '@nestjs/common';
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

  updateProductQuantity(id: string, quantityChange: number) {
    return this.redisRepository.hincrby(
      'inventory',
      'products',
      id,
      quantityChange,
    );
  }
}
