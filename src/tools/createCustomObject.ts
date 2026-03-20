import { SalesforceClient } from "../salesforce/client.js";

interface CreateCustomObjectArgs {
  objectName: string;
  label: string;
  pluralLabel: string;
  fields: Array<{
    fullName: string;
    label: string;
    type: string;
    length?: number;
    required?: boolean;
    description?: string;
  }>;
}

export async function createCustomObjectTool(args: Record<string, unknown>) {
  const { objectName, label, pluralLabel, fields } = args as unknown as CreateCustomObjectArgs;

  if (!objectName || !label || !pluralLabel || !fields) {
    throw new Error("Missing required parameters: objectName, label, pluralLabel, and fields are required");
  }

  const client = new SalesforceClient();

  try {
    const result = await client.createCustomObject(objectName, label, pluralLabel, fields);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: result.success,
            id: result.id,
            message: result.success
              ? `Custom object '${label}' (${objectName}__c) created successfully`
              : `Failed to create custom object: ${result.errors?.join(", ")}`,
            objectApiName: `${objectName}__c`
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create custom object: ${errorMessage}`);
  }
}