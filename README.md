# @lamatic/mcp

Unified Lamatic MCP server. Merges `@lamatic/dev-mcp`, `@lamatic/graph-mcp`, and a proxy to the hosted Lamatic Docs MCP into one server, with a fourth `kit_*` namespace reserved for the not-yet-scoped AgentKit MCP.

## Install

```bash
npx @lamatic/mcp
```

## Setup

### Claude Desktop / Cursor / Claude Code

```json
{
  "mcpServers": {
    "lamatic": {
      "command": "npx",
      "args": ["-y", "@lamatic/mcp"]
    }
  }
}
```

For GraphMCP's execution-only mode (no org key, single flow — e.g. the Studio "Connect with AI" snippet), add env vars instead:

```json
{
  "mcpServers": {
    "lamatic": {
      "command": "npx",
      "args": ["-y", "@lamatic/mcp"],
      "env": {
        "PROJECT_API_KEY": "<projectApiKey>",
        "PROJECT_ID": "<projectId>",
        "ENDPOINT": "<endpoint>",
        "FLOW_ID": "<flowId>"
      }
    }
  }
}
```

## Tool prefixes

| Prefix | Covers | Auth |
|---|---|---|
| `dev_*` | Org/project/flow/credential management | `dev_auth_login`, or `LAMATIC_API_KEY` + `LAMATIC_ORG_ID` env vars |
| `graph_*` | Execute deployed flows | `graph_auth_login` (full mode), or `PROJECT_API_KEY`/`PROJECT_ID`/`ENDPOINT` env vars (execution-only mode) |
| `docs_*` | Query Lamatic.ai docs via RAG | none — proxies to the public hosted endpoint |
| `kit_*` | AgentKit contributor pipeline | reserved, not yet implemented |

## Config

All credentials live in one namespaced file: `~/.lamatic/config.json`

```json
{
  "dev": { "apiKey": "...", "orgId": "...", "userId": "..." },
  "graph": { "orgApiKey": "...", "projectApiKey": "...", "orgId": "..." }
}
```

Each namespace degrades independently — missing `dev` credentials only break `dev_*` tools, not `graph_*` or `docs_*`.

## Architecture notes

- `docs_*` does not duplicate the RAG-calling logic from the Lamatic-MCP-Docs repo. It runs a thin MCP client (`utils/docsProxy.js`) that connects to the existing hosted endpoint (`https://docmcp.lamatic.ai/api/mcp`) and forwards the call. The standalone hosted endpoint keeps working unchanged for zero-install users.
- `kit_*` has a config namespace (`getKitConfig`/`saveKitConfig` in `utils/config.js`) and a registration stub (`tools/kit.js`) wired up but empty, so its scope can be filled in later without touching `dev`/`graph`/`docs` code.

## Local development

```bash
git clone <this-repo>
cd lamatic-mcp
npm install
node server.js
```
