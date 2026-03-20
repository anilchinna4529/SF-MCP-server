import { env } from "../config/env.js";

export function assertObjectAllowed(objectName: string): void {
  // If wildcard is present, allow any object
  if (env.allowedObjects.includes("*") || env.allowedObjects.includes("ALL")) {
    return;
  }

  if (!env.allowedObjects.includes(objectName)) {
    throw new Error(`Object not allowed: ${objectName}`);
  }
}
