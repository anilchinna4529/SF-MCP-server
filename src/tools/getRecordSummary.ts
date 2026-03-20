import { z } from "zod";
import { SalesforceClient } from "../salesforce/client.js";
import { assertObjectAllowed } from "../policy/allowlist.js";
import { redactRecord } from "../policy/redact.js";

const inputSchema = z.object({
  objectName: z.string().min(1),
  recordId: z.string().min(15),
  fields: z.array(z.string().min(1)).min(1)
});

export async function getRecordSummaryTool(args: unknown) {
  const { objectName, recordId, fields } = inputSchema.parse(args);

  assertObjectAllowed(objectName);

  const sf = new SalesforceClient();
  const record = await sf.getRecordById(objectName, recordId, fields);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            objectName,
            recordId,
            summary: redactRecord(record as Record<string, unknown>)
          },
          null,
          2
        )
      }
    ]
  };
}
