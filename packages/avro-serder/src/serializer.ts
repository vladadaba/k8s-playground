import { Serializer } from "@nestjs/microservices";
import { KafkaRequest } from "@nestjs/microservices/serializers";
import {
  COMPATIBILITY,
  SchemaRegistry,
} from "@kafkajs/confluent-schema-registry";
import { ISchemaVersionConfig } from "./schema-version-config.interface";

export class AvroSchemaRegistrySerializer
  implements Serializer<any, KafkaRequest | Promise<KafkaRequest>>
{
  private readonly schemaRegistryClient: SchemaRegistry;

  constructor(
    schemaRegistryUrl: string,
    private readonly schemaVersionConfig: ISchemaVersionConfig
  ) {
    this.schemaRegistryClient = new SchemaRegistry({
      host: schemaRegistryUrl,
    });
  }

  async serialize(
    value: KafkaRequest,
    options?: { pattern: string }
  ): Promise<any> {
    if (!options?.pattern) {
      return value;
    }

    const topic = options?.pattern;
    try {
      const val = await this.schemaRegistryClient.encode(
        this.schemaVersionConfig[topic],
        value.value
      );
      return {
        key: value.key.toString(),
        value: val,
        headers: value.headers,
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
