import { SalesforceClient } from "../salesforce/client.js";

interface CreateLWCArgs {
  bundleName: string;
  html: string;
  js: string;
  xml: string;
}

export async function createLWCTool(args: Record<string, unknown>) {
  const { bundleName, html, js, xml } = args as unknown as CreateLWCArgs;
  const client = new SalesforceClient();
  try {
    const result = await client.createLWCBundle(bundleName, html, js, xml);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error creating LWC: ${error.message}` }],
      isError: true
    };
  }
}
