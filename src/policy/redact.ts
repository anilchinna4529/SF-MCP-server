const REDACT_FIELDS = new Set([
  "SSN__c",
  "Tax_ID__c",
  "National_ID__c"
]);

export function redactRecord(record: Record<string, unknown>): Record<string, unknown> {
  const clone: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    clone[key] = REDACT_FIELDS.has(key) ? "[REDACTED]" : value;
  }

  return clone;
}
