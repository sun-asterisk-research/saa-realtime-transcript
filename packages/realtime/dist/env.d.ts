import 'dotenv/config';
import { z } from 'zod/v4';
declare const logLevels: readonly ["fatal", "error", "warn", "info", "debug", "trace", "silent"];
export type LogLevel = (typeof logLevels)[number];
declare const envSchema: z.ZodObject<{
    SONIOX_API_KEY: z.ZodString;
    MAX_ENDPOINT_DELAY_MS: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    WS_PATH: z.ZodDefault<z.ZodString>;
    IDLE_TIMEOUT_MS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<{
        fatal: "fatal";
        error: "error";
        warn: "warn";
        info: "info";
        debug: "debug";
        trace: "trace";
        silent: "silent";
    }>>;
    SUPABASE_URL: z.ZodURL;
    SUPABASE_SERVICE_ROLE_KEY: z.ZodString;
}, z.core.$strip>;
export type Env = z.infer<typeof envSchema>;
export declare const env: {
    SONIOX_API_KEY: string;
    PORT: number;
    WS_PATH: string;
    IDLE_TIMEOUT_MS: number;
    LOG_LEVEL: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    MAX_ENDPOINT_DELAY_MS?: number | undefined;
};
export {};
//# sourceMappingURL=env.d.ts.map