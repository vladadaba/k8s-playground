import { plainToInstance } from 'class-transformer';
import { IsOptional, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  DATABASE_URL: string;

  @IsString()
  KEYCLOAK_SECRET: string;

  @IsString()
  KEYCLOAK_URL: string;

  @IsString()
  KEYCLOAK_REALM: string;

  @IsString()
  KEYCLOAK_CLIENTID: string;

  @IsString()
  KAFKA_BROKERS: string;

  @IsString()
  SCHEMA_REGISTRY_URL: string;

  @IsString()
  @IsOptional()
  SCHEMA_REGISTRY_USERNAME: string;

  @IsString()
  @IsOptional()
  SCHEMA_REGISTRY_PASSWORD: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
