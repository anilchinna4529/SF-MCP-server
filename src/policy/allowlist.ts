import { env } from "../config/env.js";

export function assertObjectAllowed(objectName: string): void {
  if (!env.allowedObjects.includes(objectName)) {
    throw new Error(`Object not allowed: ${objectName}`);
  }
}
