What you want to build is usually **not a new model**. For Salesforce, you normally build an **MCP server** that exposes Salesforce data and actions as **tools**, **resources**, and optionally **prompts** to an LLM client such as Claude Desktop, VS Code, Cline, or Agentforce. MCP is the open protocol for connecting LLM apps to external systems, and the server side is where you define those capabilities. ([Model Context Protocol][1])

For Salesforce specifically, there is already an official **Salesforce DX MCP Server (Beta)** from Salesforce CLI, with 60+ tools for Salesforce development workflows. Salesforce also documents MCP support in Agentforce and how remote MCP servers connect to external systems. ([Developer][2])

## The right architecture

Think of it like this:

**LLM client** → **your Salesforce MCP server** → **Salesforce APIs / CLI / metadata / org**

Your MCP server should do three jobs:

1. **Authenticate** to Salesforce securely with OAuth 2.0 / connected app.
2. **Expose safe capabilities** as MCP tools/resources.
3. **Enforce guardrails** so the model cannot do dangerous things by accident.

Salesforce’s APIs and connected apps use OAuth 2.0 for secure access, which is the standard foundation for this kind of integration. ([Developer][3])

## What you need to build

Build these layers.

### 1) Salesforce connection layer

This is the adapter that talks to Salesforce.

Usually it includes:

* OAuth / connected app setup
* access token refresh
* instance URL handling
* API wrapper for REST / Tooling API / Metadata API / SOQL
* optional Salesforce CLI integration for dev tasks

Use this layer for actions like:

* describe object
* query records
* get metadata
* deploy/retrieve components
* run Apex tests
* fetch logs

Salesforce’s official DX MCP server already covers many CLI-centric developer operations, so you should decide whether to **extend that** or build your own focused server for your business use case. ([GitHub][4])

### 2) MCP server layer

This is the actual MCP implementation.

Expose:

* **Tools** for actions
* **Resources** for read-only context
* **Prompts** for reusable workflows

That structure matches the MCP spec directly. ([Model Context Protocol][5])

### 3) Safety and policy layer

This is critical for Salesforce.

You need:

* read vs write separation
* object allowlist
* field allowlist / denylist
* SOQL validation
* PII protection
* approval step for updates/deletes
* audit logging
* rate limiting
* user/org scoping

Without this, an LLM can become a risky admin bot.

## The best way to build it

You have 3 realistic options.

### Option A: Extend Salesforce’s official DX MCP server

Best if your goal is:

* developer productivity
* org inspection
* metadata work
* LWC / Apex / DevOps help

This is fastest because Salesforce already ships an open-source DX MCP server and docs around toolsets. ([GitHub][4])

### Option B: Build a custom MCP server for business operations

Best if your goal is:

* account/contact/case/lead operations
* guided support agent
* internal sales assistant
* loan/banking workflows in Salesforce

This is likely the right fit for you if you want something around FSC, nCino, contacts, loans, tasks, case summaries, relationship data, and controlled record actions.

### Option C: Hybrid

Use Salesforce DX MCP for dev/admin tasks, and your own custom MCP server for business workflows.

This is often the strongest design.

## What tools should your Salesforce MCP server expose?

Start small. Do not begin with 50 tools.

### Phase 1: Read-only tools

Build these first:

* `describe_object`
* `get_object_fields`
* `query_records`
* `get_record_by_id`
* `list_related_records`
* `search_metadata`
* `get_picklist_values`
* `get_recent_errors`
* `run_soql_readonly`

These are low risk and very useful.

### Phase 2: Safe write tools

After Phase 1 is stable:

* `create_record`
* `update_record`
* `upsert_record`
* `create_task`
* `add_case_comment`
* `log_call_note`

Each should require:

* strict input schema
* confirmation for destructive actions
* validation before execution

### Phase 3: Dev/Admin tools

Only if needed:

* `run_apex_test`
* `deploy_metadata`
* `retrieve_metadata`
* `get_debug_logs`
* `create_permission_set_assignment`
* `validate_package_xml`

## What resources should you expose?

Resources are best for context the model can read repeatedly.

Examples:

* `salesforce://schema/Account`
* `salesforce://schema/Opportunity`
* `salesforce://record/001...`
* `salesforce://org/limits`
* `salesforce://metadata/layout/Case`
* `salesforce://picklists/Lead.Status`

MCP resources are intended for contextual data like schemas and application-specific information. ([Model Context Protocol][6])

## What prompts should you expose?

Prompts are useful for repeatable workflows, for example:

* “Summarize this Account and open Cases”
* “Generate release notes from changed metadata”
* “Analyze lead conversion failure”
* “Prepare customer 360 summary”
* “Check why flow failed for this record”

MCP supports server-provided prompt templates with arguments, which is a good fit for Salesforce workflows. ([Model Context Protocol][7])

## Suggested tech stack

For Windows and Salesforce, a practical stack is:

* **Node.js + TypeScript**
* MCP SDK for server implementation
* **jsforce** or direct Salesforce REST/Tooling/Metadata APIs
* optional Salesforce CLI integration
* zod / JSON Schema for tool inputs
* Redis or simple memory cache for describe metadata and tokens
* structured logging

Why Node/TS?

* easiest MCP ecosystem path
* easiest Windows setup
* good Salesforce library support
* aligns with most MCP examples and Salesforce DX tooling

## Folder structure

A clean structure would be:

```text
salesforce-mcp/
  src/
    server.ts
    auth/
      oauth.ts
      tokenStore.ts
    salesforce/
      client.ts
      soql.ts
      metadata.ts
      tooling.ts
      validation.ts
    tools/
      describeObject.ts
      queryRecords.ts
      getRecord.ts
      createTask.ts
      updateRecord.ts
    resources/
      schemaResource.ts
      recordResource.ts
    prompts/
      summarizeAccount.ts
    policy/
      allowlist.ts
      permissions.ts
      redact.ts
    utils/
      logger.ts
      errors.ts
  .env
  package.json
  README.md
```

## Minimal build plan

### Step 1: Define the use case

Pick one:

* Salesforce dev assistant
* service/support assistant
* FSC/nCino operations assistant
* sales assistant

Do not start generic.

### Step 2: Define tool contracts

For each tool, write:

* tool name
* purpose
* required inputs
* output schema
* permissions needed
* risks
* retry behavior

### Step 3: Set up Salesforce auth

Create a connected app and decide whether you will use:

* authorization code flow for user-scoped actions
* client credentials only for tightly scoped server-to-server use where appropriate

Salesforce’s docs position OAuth 2.0 and connected apps as the standard mechanism for external access. ([Developer][3])

### Step 4: Implement read-only tools first

Start with:

* object describe
* SOQL query with safeguards
* record lookup

### Step 5: Add policy enforcement

Before any write tool:

* allowlist objects
* disallow unrestricted SOQL/DML
* redact sensitive fields
* require explicit confirmation on writes

### Step 6: Add audit logging

Log:

* caller
* tool used
* Salesforce org
* inputs
* results
* errors
* approval actions

### Step 7: Test with one client

Use one MCP client first:

* Claude Desktop
* VS Code/Cline
* Agentforce MCP client where applicable

Salesforce has documented both built-in MCP tooling and remote MCP server connectivity for Agentforce. ([Developer][8])

## Example first 5 tools to build

For your background, I would build these first:

1. `describe_object`

   * input: object API name
   * output: fields, types, required fields

2. `query_records`

   * input: object, selected fields, filters, limit
   * output: records
   * do not allow freeform SOQL at first

3. `get_record_summary`

   * input: object, recordId
   * output: important fields + related info

4. `create_task_for_contact`

   * input: contactId, subject, status, dueDate
   * output: created task id

5. `explain_validation_error`

   * input: object, payload, error message
   * output: human explanation + fix suggestion

These would already be very useful in Salesforce projects.

## Biggest mistakes to avoid

Do not:

* give the model raw unrestricted SOQL/DML
* allow delete/update on all objects
* expose secrets in prompts/resources
* let one server operate against multiple orgs without tenant isolation
* skip field-level security checks
* skip logging
* start with Apex deploy tools before basic read tools

## My recommendation for you

Because you work in Salesforce and banking-style workflows, build this first:

**Project:** `salesforce-fsc-mcp-server`

**Version 1 scope:**

* read Account / Contact / Opportunity / Case / custom loan objects
* summarize customer and related records
* create follow-up tasks
* explain validation and flow errors
* fetch metadata for fields/picklists/layouts

That will give real value quickly.

## Best starting path

Fastest route:

1. Study the official MCP concepts: tools, resources, prompts. ([Model Context Protocol][5])
2. Review Salesforce’s DX MCP server and Agentforce MCP docs. ([GitHub][4])
3. Build your own focused custom server for your Salesforce business workflow.
4. Keep V1 read-heavy and safe.

If you want, I can draft a **full architecture diagram + folder structure + sample TypeScript starter code for a Salesforce MCP server** next.

[1]: https://modelcontextprotocol.io/specification/2025-11-25?utm_source=chatgpt.com "Specification"
[2]: https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_mcp.htm?utm_source=chatgpt.com "Salesforce DX MCP Server and Tools (Beta)"
[3]: https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_oauth_and_connected_apps.htm?utm_source=chatgpt.com "Authorization Through External Client Apps or Connected ..."
[4]: https://github.com/salesforcecli/mcp?utm_source=chatgpt.com "MCP Server for interacting with Salesforce instances"
[5]: https://modelcontextprotocol.io/specification/2025-11-25/server/tools?utm_source=chatgpt.com "Tools"
[6]: https://modelcontextprotocol.io/specification/2025-06-18/server/resources?utm_source=chatgpt.com "Resources"
[7]: https://modelcontextprotocol.io/specification/2025-06-18/server/prompts?utm_source=chatgpt.com "Prompts"
[8]: https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/devagent-mcp.html?utm_source=chatgpt.com "Agentforce MCP Tools"

Absolutely — below is a **practical V1 draft** for a **Salesforce MCP server** using **TypeScript + Node.js**.

This includes:

1. **Architecture diagram**
2. **Folder structure**
3. **Starter TypeScript code**
4. **Example tools**
5. **How to run and extend**

---

# 1) High-level architecture diagram

```text
+------------------------------------------------------+
|                    MCP Client                        |
|  Claude Desktop / Cline / VS Code / Custom Agent    |
+--------------------------+---------------------------+
                           |
                           | MCP (stdio / http)
                           v
+------------------------------------------------------+
|              Salesforce MCP Server (Node/TS)        |
|------------------------------------------------------|
|  server.ts                                           |
|   - MCP server bootstrap                             |
|   - tool registration                                |
|   - resource registration                            |
|   - prompt registration (optional)                   |
|                                                      |
|  tools/                                              |
|   - describeObject                                   |
|   - queryRecords                                     |
|   - getRecordSummary                                 |
|   - createTask                                       |
|                                                      |
|  policy/                                             |
|   - object allowlist                                 |
|   - field filtering                                  |
|   - write safeguards                                 |
|   - redaction                                        |
|                                                      |
|  auth/                                               |
|   - Salesforce OAuth / token management              |
|                                                      |
|  salesforce/                                         |
|   - REST API client                                  |
|   - SOQL builder                                     |
|   - metadata helpers                                 |
|                                                      |
|  resources/                                          |
|   - schema resources                                 |
|   - org info resources                               |
|                                                      |
|  prompts/                                            |
|   - reusable workflows                               |
+--------------------------+---------------------------+
                           |
                           | HTTPS REST / Tooling API
                           v
+------------------------------------------------------+
|                    Salesforce Org                    |
|------------------------------------------------------|
|  Standard Objects                                    |
|  Custom Objects                                      |
|  Metadata / Tooling API                              |
|  Validation Rules / Flows / Apex / Tasks             |
+------------------------------------------------------+
```

---

# 2) Recommended V1 architecture

## Main layers

### A. MCP transport layer

Handles:

* MCP protocol
* tool/resource registration
* request/response lifecycle

### B. Salesforce service layer

Handles:

* login/token usage
* REST calls
* describe/query/create/update helpers

### C. Policy layer

Handles:

* object allowlist
* field allowlist
* deny risky writes
* redact sensitive data

### D. Tool layer

Each tool should be small and focused:

* validate input
* call service layer
* enforce policy
* return structured response

---

# 3) Folder structure

```text
salesforce-mcp-server/
├─ package.json
├─ tsconfig.json
├─ .env
├─ .gitignore
├─ README.md
├─ src/
│  ├─ server.ts
│  ├─ config/
│  │  └─ env.ts
│  ├─ auth/
│  │  └─ salesforceAuth.ts
│  ├─ salesforce/
│  │  ├─ client.ts
│  │  ├─ types.ts
│  │  ├─ queryBuilder.ts
│  │  └─ metadata.ts
│  ├─ policy/
│  │  ├─ allowlist.ts
│  │  ├─ guards.ts
│  │  └─ redact.ts
│  ├─ tools/
│  │  ├─ describeObject.ts
│  │  ├─ queryRecords.ts
│  │  ├─ getRecordSummary.ts
│  │  └─ createTask.ts
│  ├─ resources/
│  │  └─ schemaResource.ts
│  ├─ prompts/
│  │  └─ summarizeAccount.ts
│  └─ utils/
│     ├─ logger.ts
│     └─ errors.ts
```

---

# 4) Suggested V1 tool set

Start with these 4 tools:

* `describe_object`
* `query_records`
* `get_record_summary`
* `create_task`

That is enough to prove the architecture.

---

# 5) Environment variables

## `.env`

```env
SALESFORCE_BASE_URL=https://yourInstance.my.salesforce.com
SALESFORCE_API_VERSION=v61.0
SALESFORCE_ACCESS_TOKEN=your_access_token

ALLOWED_OBJECTS=Account,Contact,Opportunity,Task,Case
ALLOW_WRITES=true
```

For production, replace raw token storage with a proper OAuth refresh-token flow or JWT-based auth.

---

# 6) package.json

```json
{
  "name": "salesforce-mcp-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx src/server.ts",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "dotenv": "^16.4.5",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.10.1",
    "tsx": "^4.19.2",
    "typescript": "^5.6.3"
  }
}
```

---

# 7) tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
```

---

# 8) Config loader

## `src/config/env.ts`

```ts
import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  salesforceBaseUrl: required("SALESFORCE_BASE_URL"),
  salesforceApiVersion: process.env.SALESFORCE_API_VERSION ?? "v61.0",
  salesforceAccessToken: required("SALESFORCE_ACCESS_TOKEN"),
  allowedObjects: (process.env.ALLOWED_OBJECTS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  allowWrites: (process.env.ALLOW_WRITES ?? "false").toLowerCase() === "true"
};
```

---

# 9) Salesforce types

## `src/salesforce/types.ts`

```ts
export interface SalesforceDescribeField {
  name: string;
  label: string;
  type: string;
  length?: number;
  nillable?: boolean;
  createable?: boolean;
  updateable?: boolean;
}

export interface SalesforceDescribeObjectResponse {
  name: string;
  label: string;
  keyPrefix?: string;
  fields: SalesforceDescribeField[];
}

export interface SalesforceQueryResponse<T = Record<string, unknown>> {
  totalSize: number;
  done: boolean;
  records: T[];
}
```

---

# 10) Policy layer

## `src/policy/allowlist.ts`

```ts
import { env } from "../config/env.js";

export function assertObjectAllowed(objectName: string): void {
  if (!env.allowedObjects.includes(objectName)) {
    throw new Error(`Object not allowed: ${objectName}`);
  }
}
```

## `src/policy/guards.ts`

```ts
import { env } from "../config/env.js";

export function assertWritesAllowed(): void {
  if (!env.allowWrites) {
    throw new Error("Write operations are disabled.");
  }
}

export function assertSafeLimit(limit: number): void {
  if (limit < 1 || limit > 200) {
    throw new Error("Limit must be between 1 and 200.");
  }
}
```

## `src/policy/redact.ts`

```ts
const REDACT_FIELDS = new Set([
  "SSN__c",
  "Tax_ID__c",
  "National_ID__c"
]);

export function redactRecord(record: Record<string, unknown>): Record<string, unknown> {
  const clone: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    clone[key] = REDACT_FIELDS.has(key) ? "[REDACTED]" : value;
  }

  return clone;
}
```

---

# 11) Salesforce client

## `src/salesforce/client.ts`

```ts
import { env } from "../config/env.js";
import type {
  SalesforceDescribeObjectResponse,
  SalesforceQueryResponse
} from "./types.js";

export class SalesforceClient {
  private readonly baseUrl: string;
  private readonly apiVersion: string;
  private readonly token: string;

  constructor() {
    this.baseUrl = env.salesforceBaseUrl;
    this.apiVersion = env.salesforceApiVersion;
    this.token = env.salesforceAccessToken;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(
      `${this.baseUrl}/services/data/${this.apiVersion}${path}`,
      {
        ...init,
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          ...(init?.headers ?? {})
        }
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Salesforce API error ${response.status}: ${text}`);
    }

    return (await response.json()) as T;
  }

  async describeObject(objectName: string): Promise<SalesforceDescribeObjectResponse> {
    return this.request<SalesforceDescribeObjectResponse>(`/sobjects/${objectName}/describe`);
  }

  async query<T = Record<string, unknown>>(soql: string): Promise<SalesforceQueryResponse<T>> {
    return this.request<SalesforceQueryResponse<T>>(
      `/query?q=${encodeURIComponent(soql)}`
    );
  }

  async createRecord(objectName: string, payload: Record<string, unknown>): Promise<{ id: string; success: boolean; errors: string[] }> {
    return this.request<{ id: string; success: boolean; errors: string[] }>(
      `/sobjects/${objectName}`,
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );
  }

  async getRecordById<T = Record<string, unknown>>(
    objectName: string,
    recordId: string,
    fields: string[]
  ): Promise<T> {
    const query = `SELECT ${fields.join(", ")} FROM ${objectName} WHERE Id = '${recordId}' LIMIT 1`;
    const result = await this.query<T>(query);

    if (!result.records.length) {
      throw new Error(`Record not found: ${recordId}`);
    }

    return result.records[0];
  }
}
```

---

# 12) Safe SOQL builder

## `src/salesforce/queryBuilder.ts`

```ts
export function buildSelectQuery(params: {
  objectName: string;
  fields: string[];
  where?: string;
  limit?: number;
}): string {
  const { objectName, fields, where, limit = 20 } = params;

  if (!fields.length) {
    throw new Error("At least one field must be provided.");
  }

  const safeFields = fields.map((f) => f.trim()).filter(Boolean);

  let soql = `SELECT ${safeFields.join(", ")} FROM ${objectName}`;

  if (where?.trim()) {
    soql += ` WHERE ${where.trim()}`;
  }

  soql += ` LIMIT ${limit}`;

  return soql;
}
```

For V1, this is okay for internal use, but later you should replace freeform `where` with a structured filter DSL.

---

# 13) Tool: describe_object

## `src/tools/describeObject.ts`

```ts
import { z } from "zod";
import { SalesforceClient } from "../salesforce/client.js";
import { assertObjectAllowed } from "../policy/allowlist.js";

const inputSchema = z.object({
  objectName: z.string().min(1)
});

export async function describeObjectTool(args: unknown) {
  const { objectName } = inputSchema.parse(args);

  assertObjectAllowed(objectName);

  const sf = new SalesforceClient();
  const result = await sf.describeObject(objectName);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            name: result.name,
            label: result.label,
            keyPrefix: result.keyPrefix,
            fields: result.fields.map((f) => ({
              name: f.name,
              label: f.label,
              type: f.type,
              nillable: f.nillable,
              createable: f.createable,
              updateable: f.updateable
            }))
          },
          null,
          2
        )
      }
    ]
  };
}
```

---

# 14) Tool: query_records

## `src/tools/queryRecords.ts`

```ts
import { z } from "zod";
import { SalesforceClient } from "../salesforce/client.js";
import { assertObjectAllowed } from "../policy/allowlist.js";
import { assertSafeLimit } from "../policy/guards.js";
import { buildSelectQuery } from "../salesforce/queryBuilder.js";
import { redactRecord } from "../policy/redact.js";

const inputSchema = z.object({
  objectName: z.string().min(1),
  fields: z.array(z.string().min(1)).min(1),
  where: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional()
});

export async function queryRecordsTool(args: unknown) {
  const { objectName, fields, where, limit = 20 } = inputSchema.parse(args);

  assertObjectAllowed(objectName);
  assertSafeLimit(limit);

  const soql = buildSelectQuery({
    objectName,
    fields,
    where,
    limit
  });

  const sf = new SalesforceClient();
  const result = await sf.query(soql);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            soql,
            totalSize: result.totalSize,
            records: result.records.map((r) => redactRecord(r as Record<string, unknown>))
          },
          null,
          2
        )
      }
    ]
  };
}
```

---

# 15) Tool: get_record_summary

## `src/tools/getRecordSummary.ts`

```ts
import { z } from "zod";
import { SalesforceClient } from "../salesforce/client.js";
import { assertObjectAllowed } from "../policy/allowlist.js";
import { redactRecord } from "../policy/redact.js";

const inputSchema = z.object({
  objectName: z.string().min(1),
  recordId: z.string().min(15),
  fields: z.array(z.string().min(1)).min(1)
});

export async function getRecordSummaryTool(args: unknown) {
  const { objectName, recordId, fields } = inputSchema.parse(args);

  assertObjectAllowed(objectName);

  const sf = new SalesforceClient();
  const record = await sf.getRecordById(objectName, recordId, fields);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            objectName,
            recordId,
            summary: redactRecord(record as Record<string, unknown>)
          },
          null,
          2
        )
      }
    ]
  };
}
```

---

# 16) Tool: create_task

## `src/tools/createTask.ts`

```ts
import { z } from "zod";
import { SalesforceClient } from "../salesforce/client.js";
import { assertObjectAllowed } from "../policy/allowlist.js";
import { assertWritesAllowed } from "../policy/guards.js";

const inputSchema = z.object({
  whoId: z.string().min(15),
  subject: z.string().min(1),
  status: z.string().min(1).default("Not Started"),
  priority: z.string().optional(),
  activityDate: z.string().optional(),
  description: z.string().optional()
});

export async function createTaskTool(args: unknown) {
  const parsed = inputSchema.parse(args);

  assertWritesAllowed();
  assertObjectAllowed("Task");

  const sf = new SalesforceClient();
  const result = await sf.createRecord("Task", {
    WhoId: parsed.whoId,
    Subject: parsed.subject,
    Status: parsed.status,
    Priority: parsed.priority,
    ActivityDate: parsed.activityDate,
    Description: parsed.description
  });

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            success: result.success,
            id: result.id,
            errors: result.errors
          },
          null,
          2
        )
      }
    ]
  };
}
```

---

# 17) Resource example

## `src/resources/schemaResource.ts`

```ts
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
```

---

# 18) MCP server bootstrap

## `src/server.ts`

```ts
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
```

---

# 19) How to run

```bash
npm install
npm run dev
```

If you want to use it from an MCP client, point the client to:

```json
{
  "mcpServers": {
    "salesforce": {
      "command": "node",
      "args": ["dist/server.js"],
      "env": {
        "SALESFORCE_BASE_URL": "https://yourInstance.my.salesforce.com",
        "SALESFORCE_API_VERSION": "v61.0",
        "SALESFORCE_ACCESS_TOKEN": "your_access_token",
        "ALLOWED_OBJECTS": "Account,Contact,Opportunity,Task,Case",
        "ALLOW_WRITES": "true"
      }
    }
  }
}
```

For local dev with tsx:

```json
{
  "mcpServers": {
    "salesforce": {
      "command": "npx",
      "args": ["tsx", "src/server.ts"],
      "env": {
        "SALESFORCE_BASE_URL": "https://yourInstance.my.salesforce.com",
        "SALESFORCE_API_VERSION": "v61.0",
        "SALESFORCE_ACCESS_TOKEN": "your_access_token",
        "ALLOWED_OBJECTS": "Account,Contact,Opportunity,Task,Case",
        "ALLOW_WRITES": "true"
      }
    }
  }
}
```

---

# 20) What to improve next

## V2 improvements

Add these next:

### Auth

* refresh token flow
* JWT bearer flow
* per-user org auth

### Safer querying

* replace raw `where` string with structured filters
* field-level security checks
* profile/permission-aware access

### Better tools

* `update_record`
* `upsert_record`
* `get_picklist_values`
* `list_related_records`
* `explain_validation_error`
* `run_apex_test`
* `search_metadata`

### Better resources

* `salesforce://schema/CustomObject__c`
* `salesforce://org/limits`
* `salesforce://layout/Account`

### Safety

* audit logs
* confirmation for writes
* restricted writes by object/action
* rate limiting

---

# 21) Recommended real-world version for your Salesforce background

Since you work with banking-style objects and relationship data, I would shape V1 like this:

## Business-focused V1 tools

* `describe_object`
* `query_records`
* `get_customer_summary`
* `get_related_contacts`
* `create_followup_task`
* `explain_validation_error`

## Objects to allow initially

* Account
* Contact
* Opportunity
* Task
* Case
* Your custom loan/collateral objects

That gives useful assistant behavior without opening full admin risk.

---

# 22) Best next step

The best next deliverable after this is a **production-ready version** with:

* OAuth flow
* structured filter input
* record-level security checks
* proper logger
* error classes
* prompt templates
* unit test setup

I can draft that next as a **complete GitHub-ready starter project** with:
`README.md`, `.env.example`, better types, and 8–10 tools.
