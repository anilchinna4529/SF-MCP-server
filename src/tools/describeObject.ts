import { z } from "zod";
import { SalesforceClient } from "../salesforce/client.js";
import { assertObjectAllowed } from "../policy/allowlist.js";

const inputSchema = z.object({
  objectName: z.string().min(1)
});

export async function describeObjectTool(args: unknown) {
  const { objectName } = inputSchema.parse(args);

  assertObjectAllowed(objectName);

  const sf = new SalesforceClient();
  const result = await sf.describeObject(objectName);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            name: result.name,
            label: result.label,
            keyPrefix: result.keyPrefix,
            fields: result.fields.map((f) => ({
              name: f.name,
              label: f.label,
              type: f.type,
              nillable: f.nillable,
              createable: f.createable,
              updateable: f.updateable
            }))
          },
          null,
          2
        )
      }
    ]
  };
}
