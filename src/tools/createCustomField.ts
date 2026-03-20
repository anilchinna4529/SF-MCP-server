import { SalesforceClient } from "../salesforce/client.js";

interface CreateCustomFieldArgs {
  objectName: string;
  field: {
    fullName: string;
    label: string;
    type: string;
    length?: number;
    required?: boolean;
    description?: string;
  };
}

export async function createCustomFieldTool(args: Record<string, unknown>) {
  const { objectName, field } = args as unknown as CreateCustomFieldArgs;
  const client = new SalesforceClient();
  try {
    const result = await client.createCustomField(objectName, field);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error creating custom field: ${error.message}` }],
      isError: true
    };
  }
}
