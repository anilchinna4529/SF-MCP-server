import { SalesforceClient } from "../salesforce/client.js";

interface CreateMetadataArgs {
  rawXml: string;
}

export async function createMetadataTool(args: Record<string, unknown>) {
  const { rawXml } = args as unknown as CreateMetadataArgs;
  const client = new SalesforceClient();
  try {
    const result = await client.deployRawMetadata(rawXml);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error deploying metadata: ${error.message}` }],
      isError: true
    };
  }
}
