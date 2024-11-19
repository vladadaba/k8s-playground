import * as schemaRegistry from "avro-schema-registry";
import { Serializer } from "@nestjs/microservices";
import { KafkaRequest } from "@nestjs/microservices/serializers";
import { ISchemaVersionConfig } from "./schema-version-config.interface";

export class AvroSchemaRegistrySerializer
  implements Serializer<any, KafkaRequest | Promise<KafkaRequest>>
{
  private readonly schemaRegistryClient: schemaRegistry.ISchemaRegistry;

  constructor(
    schemaRegistryUrl: string,
    username: string,
    password: string,
    private readonly schemaVersionConfig: ISchemaVersionConfig
  ) {
    this.schemaRegistryClient = schemaRegistry(schemaRegistryUrl, {
      username,
      password,
    });
  }

  serialize(value: KafkaRequest, options?: any): any {
    console.log("value:", value);
    console.log("options:", options);
    return value;
  }
}
