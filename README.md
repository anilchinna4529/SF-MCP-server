# Salesforce Model Context Protocol (MCP) Server

The **Salesforce MCP Server** connects advanced AI assistants (like Claude Desktop, VS Code plugins like Cline/Roo, or Agentforce) directly to your Salesforce organization. 

The Model Context Protocol (MCP) is an open standard that enables AI models to act as secure extensions of your systems. By utilizing this server, your AI assistant can securely query Salesforce data, interact with standard and custom objects, examine metadata, and perform administrative or operational workflows—all governed by the strict permissions and access policies you define.

---

## 🚀 Features

- **Object Exploration**: Describe objects, fields, metadata, and relationships.
- **Data Querying**: Securely run SOQL queries directly from your AI prompts.
- **Record Management**: Fetch, summarize, create, and update standard/custom object records (e.g., Accounts, Contacts, Opportunities).
- **Task Automation**: Create follow-up tasks, log calls, or resolve Cases automatically.
- **Strict Security & Guardrails**: Includes an allowlist for objects/fields, preventing unauthorized writes or bulk deletions.

---

## 🛠️ Prerequisites

Before installing the MCP Server, ensure you have the following ready:

1. **Node.js** (v18 or higher) installed on your machine.
2. A **Salesforce Org** (e.g., a Developer Edition, Sandbox, or Production org).
3. **Salesforce OAuth/Connected App**: You must create a Connected App in Salesforce to retrieve an Access Token or configure OAuth flows.

### Setting up a Salesforce Connected App
To authenticate the MCP Server, create a Connected App:
1. Go to **Setup** > **App Manager** > **New Connected App**.
2. Enable OAuth Settings.
3. Add scopes like `Manage user data via APIs (api)` and `Perform requests at any time (refresh_token, offline_access)`.
4. Save the app to obtain your **Consumer Key** and **Consumer Secret**.
5. Use an OAuth flow (e.g., Username-Password or Web Server flow) to get a valid `ACCESS_TOKEN`.

---

## 💻 Installation

Clone the repository and install the dependencies to run this server locally.

```bash
# 1. Clone the repository
git clone https://github.com/your-username/salesforce-mcp-server.git
cd salesforce-mcp-server

# 2. Install dependencies
npm install

# 3. Build the server
npm run build
```

---

## ⚙️ Configuration

Create a `.env` file in the root of the project to securely provide your Salesforce credentials and govern access. 

```env
# /salesforce-mcp-server/.env

# Your Salesforce instance URL (e.g., your My Domain URL)
SALESFORCE_BASE_URL=https://yourCompany.my.salesforce.com

# API Version to use (e.g., v61.0)
SALESFORCE_API_VERSION=v61.0

# Your valid Session ID or OAuth Access Token
SALESFORCE_ACCESS_TOKEN=your_valid_access_token_here

# Comma-separated list of objects the AI is allowed to read/write
ALLOWED_OBJECTS=Account,Contact,Opportunity,Task,Case

# Set to true to allow the AI to perform Write and DML operations
ALLOW_WRITES=true
```

---

## 🤖 How to use it with your AI Assistant

MCP servers don't run as stand-alone web apps; instead, they are consumed by a client like **Claude Desktop**. 

### Connecting to Claude Desktop
You can add this server to your Claude Desktop configuration so that Claude can automatically call the Salesforce tools during your chats.

1. Open your Claude Desktop config file. 
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Add the `salesforce` server to your configuration:

```json
{
  "mcpServers": {
    "salesforce": {
      "command": "node",
      "args": [
        "C:/absolute/path/to/salesforce-mcp-server/dist/server.js"
      ],
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
3. Restart Claude Desktop. You will now see the connection to Salesforce in the UI.

### In-Chat Usage Examples
Once connected, you can ask your AI assistant questions directly using natural language:

- _"Can you list the fields on the Opportunity object?"_
- _"Run a SOQL query to find all Accounts where Industry is 'Technology'."_
- _"Summarize the latest 3 High-priority Cases."_
- _"Create a follow-up Task for Contact ID '003xxx' with the subject 'Follow up on Quote'."_

---

## 🛡️ Security Best Practices

When using an AI agent against your Salesforce Org, adhering to least-privilege principles is crucial:
* **Always test in sandboxes first** before connecting your production Org.
* **Refine your Allowed Objects**: Keep the `ALLOWED_OBJECTS` array as small as possible. Use it to restrict the AI from altering critical ERP or HR objects.
* **Control Writes**: Start with `ALLOW_WRITES=false`. Only turn writes on if you trust the validation steps in the target Org.
* **Restrict the Integration User**: The Salesforce User whose credentials generated the `ACCESS_TOKEN` should have an extremely restricted Profile/Permission Set (Field-Level Security) so the AI cannot access sensitive fields logically.