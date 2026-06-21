import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 3000),
  baseUrl: process.env.BASE_URL ?? "",

  databasePath: process.env.DATABASE_PATH ?? "./data.db",

  nylasApiKey: process.env.NYLAS_API_KEY ?? "",
  nylasClientId: process.env.NYLAS_CLIENT_ID ?? "",
  nylasClientSecret: process.env.NYLAS_CLIENT_SECRET ?? "",
  nylasCallbackUri: process.env.NYLAS_CALLBACK_URI ?? "",

  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
};

