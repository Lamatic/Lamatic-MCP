# @lamatic/mcp

Unified Lamatic MCP server. Merges `@lamatic/dev-mcp`, `@lamatic/graph-mcp`, a proxy to the hosted Lamatic Docs MCP, and `kit_*` — the AgentKit MCP — into one server.

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

For `kit_*` tools that write to GitHub (`kit_revalidate_pr`), optionally add a token to raise GitHub's API rate limit and enable posting `/validate` comments:

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

## Tool prefixes

| Prefix | Covers | Auth |
|---|---|---|
| `dev_*` | Org/project/flow/credential management | `dev_auth_login`, or `LAMATIC_API_KEY` + `LAMATIC_ORG_ID` env vars |
| `graph_*` | Execute deployed flows | `graph_auth_login` (full mode), or `PROJECT_API_KEY`/`PROJECT_ID`/`ENDPOINT` env vars (execution-only mode) |
| `docs_*` | Query Lamatic.ai docs via RAG | none — proxies to the public hosted endpoint |
| `kit_*` | Browse, search, and validate AgentKit contributions | none for read/validate tools; GitHub token (`kit_auth_login` or `GITHUB_TOKEN` env var) only for `kit_revalidate_pr` |

## Config

All credentials live in one namespaced file: `~/.lamatic/config.json`

```json
{
  "dev": { "apiKey": "...", "orgId": "...", "userId": "..." },
  "graph": { "orgApiKey": "...", "projectApiKey": "...", "orgId": "..." },
  "kit": { "githubToken": "..." }
}
```

Each namespace degrades independently — missing `dev` credentials only break `dev_*` tools, not `graph_*`, `docs_*`, or `kit_*`.

## Architecture notes

- `docs_*` does not duplicate the RAG-calling logic from the Lamatic-MCP-Docs repo. It runs a thin MCP client (`utils/docsProxy.js`) that connects to the existing hosted endpoint (`https://docmcp.lamatic.ai/api/mcp`) and forwards the call. The standalone hosted endpoint keeps working unchanged for zero-install users.
- `kit_*` reads directly from the public `Lamatic/AgentKit` GitHub repo via `utils/kitProxy.js` — there is no hosted Kit API today. If one ever gets stood up (the same way `docs_*` proxies to a hosted endpoint instead of calling GitHub/RAG directly), the fetch calls in `kitProxy.js` are the only thing that needs to change; tool signatures in `tools/kit.js` stay the same.
- `kit_validate_structure` mirrors the Phase 1 checks in `validate-pr.yml` by hand. There's no CI link between the two files today — if Phase 1's bash logic changes, this needs a matching manual update or the two will silently disagree on what counts as a valid kit.

## Local development

```bash
git clone <this-repo>
cd lamatic-mcp
npm install
node server.js
```