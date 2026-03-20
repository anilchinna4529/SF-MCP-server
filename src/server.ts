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
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "describe_object":
      return describeObjectTool(args);
    case "query_records":
      return queryRecordsTool(args);
    case "get_record_summary":
      return getRecordSummaryTool(args);
    case "create_task":
      return createTaskTool(args);
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
