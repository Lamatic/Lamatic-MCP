const { z } = require('zod');
const { getKitConfig, saveKitConfig } = require('../utils/config');
const {
  getRegistry,
  normalizeRegistryKits,
  listKitDirs,
  getKitFileTree,
  getKitFile,
  listKitFlows,
} = require('../utils/kitProxy');
const { validateKitStructure } = require('../utils/kitValidate');

function getGithubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  const kit = getKitConfig();
  return kit.githubToken || null;
}

async function githubApiFetch(url, method = 'GET', body) {
  const token = getGithubToken();
  const headers = {
    'User-Agent': 'lamatic-mcp-kit',
    Accept: 'application/vnd.github+json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${typeof json === 'string' ? json.slice(0, 200) : JSON.stringify(json).slice(0, 200)}`);
  }
  return json;
}

function registerKitTools(server) {
  // ─── Tier 1 — browse / read ──────────────────────────────────────────

  server.tool(
    'kit_list',
    'List all kits, bundles, and templates available in the Lamatic AgentKit repository. No authentication required.',
    {},
    async () => {
      try {
        const registry = await getRegistry();
        const kits = normalizeRegistryKits(registry);
        if (kits) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(
                kits.map((k) => ({
                  name: k.name || k.slug || k.title,
                  type: k.type,
                  description: k.description,
                  tags: k.tags || [],
                })),
                null,
                2
              ),
            }],
          };
        }
        // Fallback: registry.json missing/unparseable/unrecognized shape — list kits/ directly
        const names = await listKitDirs();
        return { content: [{ type: 'text', text: JSON.stringify({ kits: names }, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error listing kits: ${err.message}` }] };
      }
    }
  );

  server.tool(
    'kit_get',
    'Get full details for a single kit — its lamatic.config.ts, README, and list of flows. No authentication required.',
    { name: z.string().describe('The kit folder name, e.g. "content-generation"') },
    async ({ name }) => {
      try {
        const [configRaw, readme, flows] = await Promise.all([
          getKitFile(name, 'lamatic.config.ts').catch(() => null),
          getKitFile(name, 'README.md').catch(() => null),
          listKitFlows(name),
        ]);

        if (configRaw === null) {
          return { content: [{ type: 'text', text: `Kit "${name}" not found in kits/.` }] };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ name, lamaticConfig: configRaw, readme, flows }, null, 2),
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error fetching kit "${name}": ${err.message}` }] };
      }
    }
  );

  server.tool(
    'kit_search',
    'Search kits by type (kit/bundle/template) and/or tag/keyword. No authentication required.',
    {
      query: z.string().optional().describe('Free-text keyword to match against name, description, and tags'),
      type: z.enum(['kit', 'bundle', 'template']).optional().describe('Filter by contribution type'),
    },
    async ({ query, type }) => {
      try {
        const registry = await getRegistry();
        const kits = normalizeRegistryKits(registry);
        if (!kits) {
          return { content: [{ type: 'text', text: 'Search requires registry.json — it is currently unavailable or in an unrecognized format. Try kit_list instead, or check server stderr logs for the fetch error.' }] };
        }

        let results = kits;
        if (type) {
          results = results.filter((k) => k.type === type);
        }
        if (query) {
          const q = query.toLowerCase();
          results = results.filter((k) => {
            const haystack = [k.name, k.slug, k.title, k.description, ...(k.tags || [])].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(q);
          });
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(
              results.map((k) => ({ name: k.name || k.slug || k.title, type: k.type, description: k.description, tags: k.tags || [] })),
              null,
              2
            ),
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error searching kits: ${err.message}` }] };
      }
    }
  );

  server.tool(
    'kit_get_flow',
    'Get the raw .ts source of a specific flow inside a kit. No authentication required.',
    {
      kitName: z.string().describe('The kit folder name, e.g. "content-generation"'),
      flowName: z.string().describe('The flow file name without .ts, e.g. "generate-week"'),
    },
    async ({ kitName, flowName }) => {
      try {
        const flowTs = await getKitFile(kitName, `flows/${flowName}.ts`);
        return { content: [{ type: 'text', text: flowTs }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error fetching flow "${flowName}" from kit "${kitName}": ${err.message}` }] };
      }
    }
  );

  // ─── Tier 2 — validate / PR status ───────────────────────────────────

  server.tool(
    'kit_validate_structure',
    'Run the same Phase 1 structural checks used in CI (validate-pr.yml) against a local kit folder, before opening a PR. No authentication required.',
    { kitPath: z.string().describe('Absolute or relative local filesystem path to the kit folder, e.g. "./kits/my-kit"') },
    async ({ kitPath }) => {
      try {
        const result = validateKitStructure(kitPath);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error validating "${kitPath}": ${err.message}` }] };
      }
    }
  );

  server.tool(
    'kit_check_pr_status',
    'Check the Phase 1 (structural) and Phase 2 (Studio runtime) validation status and labels on an open AgentKit PR. Requires a GitHub token (kit_auth_login or GITHUB_TOKEN env var) for higher rate limits, but works without one for public PRs at GitHub\'s unauthenticated rate limit.',
    { prNumber: z.number().describe('The AgentKit PR number, e.g. 160') },
    async ({ prNumber }) => {
      try {
        const [pr, comments] = await Promise.all([
          githubApiFetch(`https://api.github.com/repos/Lamatic/AgentKit/pulls/${prNumber}`),
          githubApiFetch(`https://api.github.com/repos/Lamatic/AgentKit/issues/${prNumber}/comments`),
        ]);

        const labels = (pr.labels || []).map((l) => l.name);
        const phase1Comment = comments.find((c) => c.body?.includes('AgentKit Structural Validation'));
        const phase2Comment = comments.find((c) => c.body?.includes('Studio Runtime Validation'));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              prNumber,
              title: pr.title,
              state: pr.state,
              labels,
              phase1: phase1Comment
                ? (phase1Comment.body.includes(':x:') ? 'failing' : phase1Comment.body.includes(':warning:') ? 'warnings' : 'passing')
                : 'not yet run',
              phase2: phase2Comment
                ? (phase2Comment.body.includes(':white_check_mark:') ? 'passing' : 'failing')
                : 'not yet run',
              phase1LastUpdated: phase1Comment?.updated_at || null,
              phase2LastUpdated: phase2Comment?.updated_at || null,
            }, null, 2),
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error checking PR #${prNumber}: ${err.message}` }] };
      }
    }
  );

  server.tool(
    'kit_revalidate_pr',
    'Trigger a Phase 2 Studio re-validation on an open AgentKit PR by posting the /validate comment. Requires a GitHub token with comment-write access (kit_auth_login or GITHUB_TOKEN env var).',
    { prNumber: z.number().describe('The AgentKit PR number, e.g. 160') },
    async ({ prNumber }) => {
      try {
        const token = getGithubToken();
        if (!token) {
          throw new Error('Not authenticated. Run kit_auth_login, or set GITHUB_TOKEN env var. A token with public_repo (comment write) scope is required to post /validate.');
        }
        await githubApiFetch(
          `https://api.github.com/repos/Lamatic/AgentKit/issues/${prNumber}/comments`,
          'POST',
          { body: '/validate' }
        );
        return { content: [{ type: 'text', text: `Posted /validate on PR #${prNumber}. Phase 2 will run shortly — use kit_check_pr_status to poll.` }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error triggering revalidation on PR #${prNumber}: ${err.message}` }] };
      }
    }
  );

  server.tool(
    'kit_auth_login',
    'Store a GitHub personal access token for kit_check_pr_status and kit_revalidate_pr. Token needs public_repo scope (or repo scope for private orgs).',
    { githubToken: z.string().describe('A GitHub personal access token') },
    async ({ githubToken }) => {
      try {
        saveKitConfig({ githubToken });
        return { content: [{ type: 'text', text: 'GitHub token saved for kit_* tools.' }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error saving token: ${err.message}` }] };
      }
    }
  );
}

module.exports = { registerKitTools };