import { SalesforceClient } from "../salesforce/client.js";
import { assertObjectAllowed } from "../policy/allowlist.js";

export async function readSchemaResource(objectName: string) {
  assertObjectAllowed(objectName);

  const sf = new SalesforceClient();
  const describe = await sf.describeObject(objectName);

  return {
    contents: [
      {
        uri: `salesforce://schema/${objectName}`,
        mimeType: "application/json",
        text: JSON.stringify(describe, null, 2)
      }
    ]
  };
}
