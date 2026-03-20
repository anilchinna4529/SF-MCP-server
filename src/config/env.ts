import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  salesforceBaseUrl: required("SALESFORCE_BASE_URL"),
  salesforceApiVersion: process.env.SALESFORCE_API_VERSION ?? "v61.0",
  salesforceAccessToken: required("SALESFORCE_ACCESS_TOKEN"),
  allowedObjects: (process.env.ALLOWED_OBJECTS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  allowWrites: (process.env.ALLOW_WRITES ?? "false").toLowerCase() === "true"
};
