import { SalesforceClient } from "../salesforce/client.js";

interface UpdateRecordArgs {
  objectName: string;
  recordId: string;
  payload: Record<string, unknown>;
}

export async function updateRecordTool(args: Record<string, unknown>) {
  const { objectName, recordId, payload } = args as unknown as UpdateRecordArgs;

  const client = new SalesforceClient();
  try {
    const result = await client.updateRecord(objectName, recordId, payload);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error updating record: ${error.message}` }],
      isError: true
    };
  }
}
