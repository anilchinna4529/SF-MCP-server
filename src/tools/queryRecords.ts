import { z } from "zod";
import { SalesforceClient } from "../salesforce/client.js";
import { assertObjectAllowed } from "../policy/allowlist.js";
import { assertSafeLimit } from "../policy/guards.js";
import { buildSelectQuery } from "../salesforce/queryBuilder.js";
import { redactRecord } from "../policy/redact.js";

const inputSchema = z.object({
  objectName: z.string().min(1),
  fields: z.array(z.string().min(1)).min(1),
  where: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional()
});

export async function queryRecordsTool(args: unknown) {
  const { objectName, fields, where, limit = 20 } = inputSchema.parse(args);

  assertObjectAllowed(objectName);
  assertSafeLimit(limit);

  const soql = buildSelectQuery({
    objectName,
    fields,
    where,
    limit
  });

  const sf = new SalesforceClient();
  const result = await sf.query(soql);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            soql,
            totalSize: result.totalSize,
            records: result.records.map((r) => redactRecord(r as Record<string, unknown>))
          },
          null,
          2
        )
      }
    ]
  };
}
