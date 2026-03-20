import { z } from "zod";
import { SalesforceClient } from "../salesforce/client.js";
import { assertObjectAllowed } from "../policy/allowlist.js";
import { assertWritesAllowed } from "../policy/guards.js";

const inputSchema = z.object({
  whoId: z.string().min(15),
  subject: z.string().min(1),
  status: z.string().min(1).default("Not Started"),
  priority: z.string().optional(),
  activityDate: z.string().optional(),
  description: z.string().optional()
});

export async function createTaskTool(args: unknown) {
  const parsed = inputSchema.parse(args);

  assertWritesAllowed();
  assertObjectAllowed("Task");

  const sf = new SalesforceClient();
  const result = await sf.createRecord("Task", {
    WhoId: parsed.whoId,
    Subject: parsed.subject,
    Status: parsed.status,
    Priority: parsed.priority,
    ActivityDate: parsed.activityDate,
    Description: parsed.description
  });

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            success: result.success,
            id: result.id,
            errors: result.errors
          },
          null,
          2
        )
      }
    ]
  };
}
