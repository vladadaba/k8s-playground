import { plainToInstance } from 'class-transformer';
import { IsNumber, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
    @IsString()
    DATABASE_URL: string;

    @IsString()
    KEYCLOAK_SECRET: number;

    @IsString()
    KEYCLOAK_URL: number;

    @IsString()
    KEYCLOAK_REALM: string;

    @IsString()
    KEYCLOAK_CLIENTID: string;

    @IsString()
    KAFKA_BROKERS: string;
}

export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToInstance(
        EnvironmentVariables,
        config,
        { enableImplicitConversion: true },
    );
    const errors = validateSync(validatedConfig, { skipMissingProperties: false });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return validatedConfig;
}

