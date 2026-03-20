import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

import { describeObjectTool } from "./tools/describeObject.js";
import { queryRecordsTool } from "./tools/queryRecords.js";
import { getRecordSummaryTool } from "./tools/getRecordSummary.js";
import { createTaskTool } from "./tools/createTask.js";
import { createCustomObjectTool } from "./tools/createCustomObject.js";
import { createRecordTool } from "./tools/createRecord.js";
import { updateRecordTool } from "./tools/updateRecord.js";
import { createCustomFieldTool } from "./tools/createCustomField.js";
import { createApexClassTool } from "./tools/createApexClass.js";
import { createLWCTool } from "./tools/createLWC.js";
import { createMetadataTool } from "./tools/createMetadata.js";
import { readSchemaResource } from "./resources/schemaResource.js";

const server = new Server(
  {
    name: "salesforce-mcp-server",
    version: "0.1.0"
  },
  {
    capabilities: {
      tools: {},
      resources: {}
    }
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "describe_object",
        description: "Describe a Salesforce object and return field metadata.",
        inputSchema: {
          type: "object",
          properties: {
            objectName: { type: "string" }
          },
          required: ["objectName"]
        }
      },
      {
        name: "query_records",
        description: "Query Salesforce records from an allowed object.",
        inputSchema: {
          type: "object",
          properties: {
            objectName: { type: "string" },
            fields: {
              type: "array",
              items: { type: "string" }
            },
            where: { type: "string" },
            limit: { type: "number" }
          },
          required: ["objectName", "fields"]
        }
      },
      {
        name: "get_record_summary",
        description: "Get a record by id and return a summary of selected fields.",
        inputSchema: {
          type: "object",
          properties: {
            objectName: { type: "string" },
            recordId: { type: "string" },
            fields: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["objectName", "recordId", "fields"]
        }
      },
      {
        name: "create_task",
        description: "Create a Task related to a Contact or Lead via WhoId.",
        inputSchema: {
          type: "object",
          properties: {
            whoId: { type: "string" },
            subject: { type: "string" },
            status: { type: "string" },
            priority: { type: "string" },
            activityDate: { type: "string" },
            description: { type: "string" }
          },
          required: ["whoId", "subject"]
        }
      },
      {
        name: "create_custom_object",
        description: "Create a custom object in Salesforce with specified fields.",
        inputSchema: {
          type: "object",
          properties: {
            objectName: { type: "string", description: "API name for the custom object (without __c suffix)" },
            label: { type: "string", description: "Label for the custom object" },
            pluralLabel: { type: "string", description: "Plural label for the custom object" },
            fields: {
              type: "array",
              description: "Array of field definitions",
              items: {
                type: "object",
                properties: {
                  fullName: { type: "string", description: "API name for the field (without __c suffix)" },
                  label: { type: "string", description: "Label for the field" },
                  type: { type: "string", description: "Data type (Text, Email, Phone, Number, etc.)" },
                  length: { type: "number", description: "Length for text fields" },
                  required: { type: "boolean", description: "Whether the field is required" },
                  description: { type: "string", description: "Description of the field" }
                },
                required: ["fullName", "label", "type"]
              }
            }
          },
          required: ["objectName", "label", "pluralLabel", "fields"]
        }
      },
      {
        name: "create_record",
        description: "Create a generic Salesforce record (e.g., User, Account).",
        inputSchema: {
          type: "object",
          properties: {
            objectName: { type: "string" },
            payload: { type: "object", description: "Key-value pairs of fields to insert" }
          },
          required: ["objectName", "payload"]
        }
      },
      {
        name: "update_record",
        description: "Update an existing Salesforce record.",
        inputSchema: {
          type: "object",
          properties: {
            objectName: { type: "string" },
            recordId: { type: "string" },
            payload: { type: "object", description: "Key-value pairs of fields to update" }
          },
          required: ["objectName", "recordId", "payload"]
        }
      },
      {
        name: "create_custom_field",
        description: "Create a custom field on a given object using the SOAP Metadata API.",
        inputSchema: {
          type: "object",
          properties: {
            objectName: { type: "string", description: "API name for the custom object (without __c suffix)" },
            field: {
              type: "object",
              properties: {
                fullName: { type: "string", description: "API name for the field (without __c suffix)" },
                label: { type: "string" },
                type: { type: "string" },
                length: { type: "number" },
                required: { type: "boolean" },
                description: { type: "string" }
              },
              required: ["fullName", "label", "type"]
            }
          },
          required: ["objectName", "field"]
        }
      },
      {
        name: "create_apex_class",
        description: "Create a new Apex Class using the Tooling API.",
        inputSchema: {
          type: "object",
          properties: {
            className: { type: "string" },
            body: { type: "string", description: "The full Apex class body code" }
          },
          required: ["className", "body"]
        }
      },
      {
        name: "create_lwc",
        description: "Create a new Lightning Web Component (LWC) bundle.",
        inputSchema: {
          type: "object",
          properties: {
            bundleName: { type: "string" },
            html: { type: "string" },
            js: { type: "string" },
            xml: { type: "string", description: "Ignored for Tooling API, metadata handles exposure automatically" }
          },
          required: ["bundleName", "js"]
        }
      },
      {
        name: "create_metadata",
        description: "Deploy raw Salesforce Metadata (Flows, Page Layouts, Reports, Dashboards) via SOAP API. Provide raw XML representing a standard deployment envelope.",
        inputSchema: {
          type: "object",
          properties: {
            rawXml: { type: "string", description: "Complete, raw XML SOAP Envelope for the createMetadata call" }
          },
          required: ["rawXml"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const toolArgs = args ?? {};

  switch (name) {
    case "describe_object":
      return describeObjectTool(toolArgs);
    case "query_records":
      return queryRecordsTool(toolArgs);
    case "get_record_summary":
      return getRecordSummaryTool(toolArgs);
    case "create_task":
      return createTaskTool(toolArgs);
    case "create_custom_object":
      return createCustomObjectTool(toolArgs);
    case "create_record":
      return createRecordTool(toolArgs);
    case "update_record":
      return updateRecordTool(toolArgs);
    case "create_custom_field":
      return createCustomFieldTool(toolArgs);
    case "create_apex_class":
      return createApexClassTool(toolArgs);
    case "create_lwc":
      return createLWCTool(toolArgs);
    case "create_metadata":
      return createMetadataTool(toolArgs);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "salesforce://schema/Account",
        name: "Account Schema",
        mimeType: "application/json",
        description: "Schema metadata for Account object"
      },
      {
        uri: "salesforce://schema/Contact",
        name: "Contact Schema",
        mimeType: "application/json",
        description: "Schema metadata for Contact object"
      }
    ]
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  const match = uri.match(/^salesforce:\/\/schema\/([A-Za-z0-9_]+)$/);
  if (!match) {
    throw new Error(`Unsupported resource URI: ${uri}`);
  }

  const objectName = match[1];
  return readSchemaResource(objectName);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Failed to start Salesforce MCP server:", error);
  process.exit(1);
});
