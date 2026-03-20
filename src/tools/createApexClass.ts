import { SalesforceClient } from "../salesforce/client.js";

interface CreateApexClassArgs {
  className: string;
  body: string;
}

export async function createApexClassTool(args: Record<string, unknown>) {
  const { className, body } = args as unknown as CreateApexClassArgs;
  const client = new SalesforceClient();
  try {
    const result = await client.createApexClass(className, body);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error creating Apex class: ${error.message}` }],
      isError: true
    };
  }
}
