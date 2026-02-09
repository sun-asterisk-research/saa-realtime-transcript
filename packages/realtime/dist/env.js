import 'dotenv/config';
import { z } from 'zod/v4';
const logLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];
const envSchema = z.object({
    // Soniox API
    SONIOX_API_KEY: z.string().min(1, 'SONIOX_API_KEY is required'),
    // Soniox V4 - Semantic endpointing configuration
    MAX_ENDPOINT_DELAY_MS: z.coerce.number().int().positive().optional(),
    // WebSocket Server
    PORT: z.coerce.number().int().positive().default(3001),
    WS_PATH: z.string().default('/'),
    // Idle timeout for Soniox connections (in milliseconds)
    IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(300_000),
    // Logging
    LOG_LEVEL: z.enum(logLevels).default('info'),
    // Supabase
    SUPABASE_URL: z.url('SUPABASE_URL must be a valid URL'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
});
function validateEnv() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error('Environment validation failed:');
        console.error(z.prettifyError(result.error));
        process.exit(1);
    }
    return result.data;
}
export const env = validateEnv();
//# sourceMappingURL=env.js.map