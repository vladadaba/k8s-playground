import { Deserializer } from "@nestjs/microservices";

export class AvroSchemaRegistryDeserializer<TInput = any, TOutput = any>
  implements Deserializer
{
  deserialize(
    value: TInput,
    options?: Record<string, any>
  ): TOutput | Promise<TOutput> {
    return null;
  }
}
