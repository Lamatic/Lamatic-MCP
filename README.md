# @lamatic/mcp

[![npm version](https://img.shields.io/npm/v/@lamatic/mcp.svg)](https://www.npmjs.com/package/@lamatic/mcp)
[![npm downloads](https://img.shields.io/npm/dm/@lamatic/mcp.svg)](https://www.npmjs.com/package/@lamatic/mcp)
[![license](https://img.shields.io/npm/l/@lamatic/mcp.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/@lamatic/mcp.svg)](https://nodejs.org)

> The unified [Model Context Protocol](https://modelcontextprotocol.io) server for [Lamatic.ai](https://lamatic.ai) — manage your org, execute deployed flows, query the docs, and explore AgentKit, all from any MCP-compatible AI agent (Claude, Cursor, Claude Code, and more).

`@lamatic/mcp` merges four capabilities into a single server so your AI assistant can operate Lamatic end to end:

| Prefix   | What it does                                              | Package it replaces  |
|----------|-----------------------------------------------------------|----------------------|
| `dev_*`  | Manage orgs, projects, flows, contexts & credentials      | `@lamatic/dev-mcp`   |
| `graph_*`| Execute deployed Lamatic flows                            | `@lamatic/graph-mcp` |
| `docs_*` | Query Lamatic.ai documentation via RAG                    | hosted Docs MCP      |
| `kit_*`  | Browse, search & validate AgentKit contributions          | —                    |

Each namespace degrades independently — missing credentials for one prefix never break the others.

## Requirements

- **Node.js** ≥ 18

## Install

No install needed — run it on demand with `npx`:

```bash
npx @lamatic/mcp
```

Or install globally to expose the `lamatic-mcp` binary:

```bash
npm install -g @lamatic/mcp
lamatic-mcp
```

## Setup

### Claude Desktop / Cursor / Claude Code

Add the server to your MCP config:

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

### Execution-only mode (single flow)

For GraphMCP's execution-only mode (no org key, single flow — e.g. the Studio "Connect with AI" snippet), pass env vars instead:

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

### GitHub token (optional, for AgentKit PR writes)

`kit_revalidate_pr` posts `/validate` comments to GitHub. Add a token to raise GitHub's API rate limit and enable comment writes:

```json
{
  "mcpServers": {
    "lamatic": {
      "command": "npx",
      "args": ["-y", "@lamatic/mcp"],
      "env": {
        "GITHUB_TOKEN": "<github-personal-access-token>"
      }
    }
  }
}
```

## Authentication

| Prefix    | How to authenticate                                                                                     |
|-----------|---------------------------------------------------------------------------------------------------------|
| `dev_*`   | `dev_auth_login` tool, or `LAMATIC_API_KEY` + `LAMATIC_ORG_ID` env vars                                  |
| `graph_*` | `graph_auth_login` (full mode), or `PROJECT_API_KEY` / `PROJECT_ID` / `ENDPOINT` env vars (single-flow) |
| `docs_*`  | None — proxies to the public hosted endpoint                                                            |
| `kit_*`   | None for read/validate tools; GitHub token (`kit_auth_login` or `GITHUB_TOKEN`) only for `kit_revalidate_pr` |

All credentials live in one namespaced file at `~/.lamatic/config.json`:

```json
{
  "dev":   { "apiKey": "...", "orgId": "...", "userId": "..." },
  "graph": { "orgApiKey": "...", "projectApiKey": "...", "orgId": "..." },
  "kit":   { "githubToken": "..." }
}
```

## Available tools

### `dev_*` — org, project, flow & credential management

**Auth & projects**
- `dev_auth_login` — Authenticate with Lamatic DevMCP
- `dev_list_projects` — List all projects in your organization
- `dev_create_project` — Create a new project
- `dev_get_project` — Get details of a project
- `dev_update_project` — Rename a project
- `dev_delete_project` — Delete a project
- `dev_deploy_project` — Deploy a project

**Flows**
- `dev_create_flow` — Create a new flow in a project
- `dev_get_flows` — List all flows in a project
- `dev_list_all_flows` — List all flows for a project
- `dev_update_flow` — Update a flow with new nodes and edges
- `dev_rename_flow` — Rename a flow
- `dev_update_flow_status` — Change a flow's status
- `dev_delete_flow` — Delete a flow

**Contexts (vector / memory)**
- `dev_create_context` — Create a new vector or memory context
- `dev_get_context` — Get details of a specific context
- `dev_get_all_contexts` — List all contexts in a project
- `dev_delete_context` — Delete a context

**Deployments**
- `dev_list_all_deployments` — List all deployments for a project
- `dev_get_deployment` — Get details of a specific deployment

**Models**
- `dev_list_model_providers` — List available model providers (optionally their models)
- `dev_list_model_creds` — List model credentials for a project
- `dev_create_model_creds` — Create model credentials for a provider
- `dev_check_model_status` — Check the availability status of a model

**Integrations & credentials**
- `dev_list_supported_integrations` — List all supported integrations
- `dev_list_integration_creds` — List integration credentials for a project
- `dev_create_integration_creds` — Create integration credentials
- `dev_get_cred_info` — Get details of a specific credential
- `dev_update_credential` — Update an existing credential
- `dev_delete_credential` — Delete a credential
- `dev_get_oauth_url` — Get an OAuth authorization URL for an integration

### `graph_*` — execute deployed flows

- `graph_auth_login` — Authenticate with GraphMCP (only if not configured via env vars)
- `graph_load_project_flows` — Load all active flows with their input schemas (org-level access)
- `graph_refresh_flows` — Refresh and list all active flows for a project (org-level access)
- `graph_execute_flow` — Execute a deployed flow (`flowId` optional in single-flow mode)

### `docs_*` — documentation Q&A

- `docs_query_docs` — Ask any question about Lamatic.ai docs; RAG-powered, no auth required

### `kit_*` — AgentKit browse, search & validation

- `kit_list` — List all kits, bundles, and templates in the AgentKit repo
- `kit_get` — Get full details for a kit (config, README, flows)
- `kit_search` — Search kits by type and/or tag/keyword
- `kit_get_flow` — Get the raw `.ts` source of a flow inside a kit
- `kit_validate_structure` — Run CI's Phase 1 structural checks against a local kit before opening a PR
- `kit_check_pr_status` — Check Phase 1/Phase 2 validation status and labels on an open PR
- `kit_revalidate_pr` — Trigger Phase 2 Studio re-validation by posting the `/validate` comment (needs GitHub token)
- `kit_auth_login` — Store a GitHub token for `kit_check_pr_status` and `kit_revalidate_pr`

## Architecture notes

- `docs_*` does not duplicate the RAG-calling logic from the Lamatic-MCP-Docs repo. It runs a thin MCP client (`utils/docsProxy.js`) that connects to the hosted endpoint (`https://docmcp.lamatic.ai/api/mcp`) and forwards the call. The standalone hosted endpoint keeps working unchanged for zero-install users.
- `kit_*` reads directly from the public `Lamatic/AgentKit` GitHub repo via `utils/kitProxy.js` — there is no hosted Kit API today. If one is ever stood up (the way `docs_*` proxies to a hosted endpoint), the fetch calls in `kitProxy.js` are the only thing that needs to change; tool signatures in `tools/kit.js` stay the same.
- `kit_validate_structure` mirrors the Phase 1 checks in `validate-pr.yml` by hand. There is no CI link between the two files today — if Phase 1's bash logic changes, this needs a matching manual update or the two will silently disagree on what counts as a valid kit.

## Local development

```bash
git clone https://github.com/Lamatic/Lamatic-MCP.git
cd lamatic-mcp
npm install
node server.js
```
