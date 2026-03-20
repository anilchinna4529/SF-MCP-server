import { env } from "../config/env.js";

export function assertWritesAllowed(): void {
  if (!env.allowWrites) {
    throw new Error("Write operations are disabled.");
  }
}

export function assertSafeLimit(limit: number): void {
  if (limit < 1 || limit > 200) {
    throw new Error("Limit must be between 1 and 200.");
  }
}
