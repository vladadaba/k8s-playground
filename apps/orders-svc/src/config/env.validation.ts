import { plainToInstance } from 'class-transformer';
import { IsNumber, IsString, IsUrl, validateSync } from 'class-validator';

class EnvironmentVariables {
    @IsString()
    DATABASE_URL: string;

    @IsString()
    KEYCLOAK_URL: number;

    @IsString()
    KEYCLOAK_REALM: string;

    @IsString()
    KAFKA_BROKERS: string;

    @IsString()
    TEMPORAL_HOST: string;
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

