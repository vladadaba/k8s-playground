import { plainToInstance } from 'class-transformer';
import { IsNumber, IsString, IsUrl, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  REDIS_HOST: string;

  @IsNumber()
  REDIS_PORT: number;

  @IsString()
  REDIS_USER: string;

  @IsString()
  REDIS_PASSWORD: string;

  @IsString()
  KEYCLOAK_URL: number;

  @IsString()
  KEYCLOAK_REALM: string;
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
