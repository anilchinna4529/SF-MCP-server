import { SalesforceClient } from "../salesforce/client.js";

interface CreateRecordArgs {
  objectName: string;
  payload: Record<string, unknown>;
}

export async function createRecordTool(args: Record<string, unknown>) {
  const { objectName, payload } = args as unknown as CreateRecordArgs;

  const client = new SalesforceClient();
  try {
    const result = await client.createRecord(objectName, payload);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error creating record: ${error.message}` }],
      isError: true
    };
  }
}
