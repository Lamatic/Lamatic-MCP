const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');

const DOCS_MCP_URL = 'https://docmcp.lamatic.ai/api/mcp';
async function queryDocs(text) {
  const transport = new StreamableHTTPClientTransport(new URL(DOCS_MCP_URL));
  const client = new Client({ name: 'lamatic-mcp-docs-proxy', version: '1.0.0' });

  try {
    await client.connect(transport);
    const result = await client.callTool({ name: 'query_docs', arguments: { text } });
    return result;
  } finally {
    await client.close().catch(() => {});
  }
}

module.exports = { queryDocs, DOCS_MCP_URL };
