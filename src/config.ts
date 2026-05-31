import { z } from "zod";

const ConfigSchema = z.object({
  apiKey: z.string().min(1, "GODADDY_API_KEY must not be empty"),
  apiSecret: z.string().min(1, "GODADDY_API_SECRET must not be empty"),
  baseUrl: z.string().url(),
  logLevel: z.enum(["debug", "info", "warn", "error"])
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  const apiKey = process.env.GODADDY_API_KEY;
  const apiSecret = process.env.GODADDY_API_SECRET;

  if (!apiKey) {
    throw new Error("Missing required environment variable: GODADDY_API_KEY");
  }
  if (!apiSecret) {
    throw new Error("Missing required environment variable: GODADDY_API_SECRET");
  }

  const raw = {
    apiKey,
    apiSecret,
    baseUrl: process.env.GODADDY_BASE_URL ?? "https://api.godaddy.com",
    logLevel: process.env.LOG_LEVEL ?? "info"
  };

  const result = ConfigSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const pathKey = issue.path.join(".");
    const envVarMap: Record<string, string> = {
      apiKey: "GODADDY_API_KEY",
      apiSecret: "GODADDY_API_SECRET",
      baseUrl: "GODADDY_BASE_URL",
      logLevel: "LOG_LEVEL"
    };
    const envVar = envVarMap[pathKey] ?? pathKey;
    throw new Error(`Invalid config (${envVar}): ${issue.message}`);
  }
  return result.data;
}
