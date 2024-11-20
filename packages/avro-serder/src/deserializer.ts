import {
  ConsumerDeserializer,
  Deserializer,
  IncomingEvent,
  IncomingResponse,
} from "@nestjs/microservices";
import { ISchemaVersionConfig } from "./schema-version-config.interface";
import { SchemaRegistry } from "@kafkajs/confluent-schema-registry";

export class AvroSchemaRegistryDeserializer implements ConsumerDeserializer {
  private readonly schemaRegistryClient: SchemaRegistry;

  constructor(
    schemaRegistryUrl: string,
    private readonly schemaVersionConfig: ISchemaVersionConfig
  ) {
    this.schemaRegistryClient = new SchemaRegistry({
      host: schemaRegistryUrl,
    });
  }

  async deserialize(
    value: any,
    options?: Record<string, any>
  ): Promise<IncomingEvent> {
    if (!options?.channel) {
      return value;
    }

    const topic = options?.channel;
    try {
      const schema = await this.schemaRegistryClient.getSchema(
        this.schemaVersionConfig[topic]
      );
      const val = await this.schemaRegistryClient.decode(value.value, {
        AVRO: {
          readerSchema: schema,
        },
      });
      return {
        pattern: topic,
        data: val,
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
