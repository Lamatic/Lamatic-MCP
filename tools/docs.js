const { z } = require('zod');
const { queryDocs } = require('../utils/docsProxy');

function registerDocsTools(server) {
  server.tool(
    'docs_query_docs',
    'Ask any question about Lamatic.ai documentation. Uses RAG to search across all indexed docs and return a precise answer. No authentication required.',
    { text: z.string().describe('The question to ask about Lamatic.ai documentation') },
    async ({ text }) => {
      try {
        const result = await queryDocs(text);
        return result;
      } catch (err) {
        return { content: [{ type: 'text', text: `Error querying docs: ${err.message}` }] };
      }
    }
  );
}

module.exports = { registerDocsTools };
