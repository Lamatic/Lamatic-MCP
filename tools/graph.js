const { z } = require('zod');
const { saveGraphConfig, getGraphConfig } = require('../utils/config');
const {
  getProjectEndpoint, listActiveFlows, getFlowDetails, extractAdvanceSchema, executeWorkflow,
} = require('../utils/graphExecute');

const EXECUTABLE_TRIGGERS = ['graphqlNode', 'chatTriggerNode', 'searchTriggerNode', 'webhookTriggerNode'];

function registerGraphTools(server) {
  server.tool(
    'graph_auth_login',
    'Authenticate with Lamatic GraphMCP (only needed if not already configured via environment variables)',
    {
      orgApiKey: z.string().optional().describe('Your org-level API key (lt-org-...) — required for flow discovery'),
      projectApiKey: z.string().describe('Your project-level API key (lt-mmup-...)'),
      orgId: z.string().optional().describe('Your organization ID — required for flow discovery'),
    },
    async ({ orgApiKey, projectApiKey, orgId }) => {
      saveGraphConfig({ orgApiKey, projectApiKey, orgId });
      return { content: [{ type: 'text', text: 'Authenticated successfully!' }] };
    }
  );

  server.tool(
    'graph_load_project_flows',
    'Load all active flows for a project with their input schemas (requires org-level access)',
    { projectId: z.string().describe('The project ID to load flows from') },
    async ({ projectId }) => {
      try {
        const [flows, endpoint] = await Promise.all([listActiveFlows(projectId), getProjectEndpoint(projectId)]);

        if (!endpoint) return { content: [{ type: 'text', text: 'Project endpoint not available. Make sure the project is deployed.' }] };
        if (!flows.length) return { content: [{ type: 'text', text: 'No active flows found for this project.' }] };

        const flowDetails = await Promise.all(flows.map((f) => getFlowDetails(projectId, f.id)));

        const flowList = flowDetails.map((f) => {
          const triggerNode = f.nodes?.find((n) => n.data?.trigger === true);
          const triggerType = triggerNode?.data?.nodeId || 'unknown';
          const schema = extractAdvanceSchema(f);
          const isExecutable = EXECUTABLE_TRIGGERS.includes(triggerType) || (schema && Object.keys(schema).length > 0);
          const schemaStr = schema ? Object.entries(schema).map(([k, v]) => `    ${k}: ${v}`).join('\n') : '    No input schema defined';
          const executableTag = isExecutable ? '✅ Manually executable' : '⚠️ Not manually executable (requires trigger data)';
          return `- ${f.name}\n  ID: ${f.id}\n  Trigger: ${triggerType}\n  ${executableTag}\n  Input Fields:\n${schemaStr}`;
        }).join('\n\n');

        return {
          content: [{
            type: 'text',
            text: `Found ${flowDetails.length} active flows.\nEndpoint: ${endpoint}\n\n${flowList}\n\nUse graph_execute_flow with the flow ID and matching payload to run a flow.`,
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error loading flows: ${err.message}` }] };
      }
    }
  );

  server.tool(
    'graph_execute_flow',
    'Execute a deployed Lamatic flow. If connected via a single-flow integration, flowId can be omitted.',
    {
      projectId: z.string().optional().describe('The project ID (optional if already configured)'),
      flowId: z.string().optional().describe('The flow ID to execute (optional if pre-configured for a single flow)'),
      payload: z.record(z.any()).describe('Input payload matching the flow input schema (e.g. { "prompt": "Hello" })'),
    },
    async ({ projectId, flowId, payload }) => {
      try {
        const config = getGraphConfig();
        const resolvedProjectId = projectId || config.projectId;
        const resolvedFlowId = flowId || config.flowId;

        if (!resolvedFlowId) return { content: [{ type: 'text', text: 'No flowId provided and no flow pre-configured. Pass a flowId.' }] };

        const endpoint = await getProjectEndpoint(resolvedProjectId);
        if (!endpoint) return { content: [{ type: 'text', text: 'Project endpoint not available. Make sure the project is deployed.' }] };

        const result = await executeWorkflow(endpoint, resolvedProjectId, resolvedFlowId, payload);

        return {
          content: [{
            type: 'text',
            text: `Flow executed!\n\nStatus: ${result.data?.executeWorkflow?.status}\nResult: ${JSON.stringify(result.data?.executeWorkflow?.result, null, 2)}`,
          }],
        };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error executing flow: ${err.message}` }] };
      }
    }
  );

  server.tool(
    'graph_refresh_flows',
    'Refresh and list all active flows for a project (requires org-level access)',
    { projectId: z.string().describe('The project ID') },
    async ({ projectId }) => {
      try {
        const flows = await listActiveFlows(projectId);
        const flowDetails = await Promise.all(flows.map((f) => getFlowDetails(projectId, f.id)));
        const flowList = flowDetails.map((f) => {
          const triggerNode = f.nodes?.find((n) => n.data?.trigger === true);
          const triggerType = triggerNode?.data?.nodeId || 'unknown';
          const schema = extractAdvanceSchema(f);
          const isExecutable = EXECUTABLE_TRIGGERS.includes(triggerType) || (schema && Object.keys(schema).length > 0);
          const tag = isExecutable ? '✅' : '⚠️';
          return `${tag} ${f.name} (ID: ${f.id} | Trigger: ${triggerType})`;
        }).join('\n');
        return { content: [{ type: 'text', text: `Refreshed! Found ${flowDetails.length} active flows:\n${flowList}` }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error refreshing flows: ${err.message}` }] };
      }
    }
  );
}

module.exports = { registerGraphTools };
