#!/usr/bin/env node

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const { registerDevTools } = require('./tools/dev');
const { registerGraphTools } = require('./tools/graph');
const { registerDocsTools } = require('./tools/docs');
const { registerKitTools } = require('./tools/kit');

const server = new McpServer({
  name: 'lamatic-mcp',
  version: '1.0.0',
});

registerDevTools(server);
registerGraphTools(server);
registerDocsTools(server);
registerKitTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Lamatic MCP Server running... (dev_*, graph_*, docs_* tools active, kit_* reserved)');
}

main().catch(console.error);
