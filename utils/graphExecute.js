const axios = require('axios');
const { getGraphConfig } = require('./config');

// ─── Org-key calls (only used in "full" mode, not execution-only) ────────────

async function getProjectEndpoint(projectId) {
  const config = getGraphConfig();
  if (config.mode === 'execution-only') return config.endpoint; // already supplied

  const { orgApiKey, orgId } = config;
  const response = await axios.get(
    `https://enterprise-api.edge.lamatic.tech/v1/organizations/${orgId}/project/${projectId}`,
    { headers: { Authorization: `Bearer ${orgApiKey}` } }
  );
  const endpoint = response.data.endpoint;
  return endpoint?.replace('/graphql', '');
}

async function listActiveFlows(projectId) {
  const config = getGraphConfig();
  if (config.mode === 'execution-only') {
    throw new Error('Flow discovery is not available in execution-only mode. Use graph_execute_flow with a known flowId.');
  }
  const { orgApiKey, orgId } = config;
  const response = await axios.get(
    `https://enterprise-api.edge.lamatic.tech/v1/organizations/${orgId}/project/${projectId}/flows`,
    { headers: { Authorization: `Bearer ${orgApiKey}` } }
  );
  return response.data.flows.filter((f) => f.status === 'active');
}

async function getFlowDetails(projectId, flowId) {
  const config = getGraphConfig();
  if (config.mode === 'execution-only') {
    throw new Error('Flow details are not available in execution-only mode.');
  }
  const { orgApiKey, orgId } = config;
  const response = await axios.get(
    `https://enterprise-api.edge.lamatic.tech/v1/organizations/${orgId}/project/${projectId}/flows/${flowId}`,
    { headers: { Authorization: `Bearer ${orgApiKey}` } }
  );
  return response.data;
}

function extractAdvanceSchema(flow) {
  try {
    const triggerNode = flow.nodes?.find((n) => n.data?.trigger === true);
    if (triggerNode?.data?.nodeId === 'graphqlNode' && triggerNode?.data?.values?.advance_schema) {
      return JSON.parse(triggerNode.data.values.advance_schema);
    }
    if (triggerNode?.data?.schema) {
      return triggerNode.data.schema;
    }
  } catch (e) {}
  return null;
}

// ─── Execution call — works in BOTH modes ────────────────────────────────────

async function executeWorkflow(endpoint, projectId, workflowId, payload) {
  const { projectApiKey } = getGraphConfig();

  const query = `query ExecuteWorkflow($workflowId: String!, $payload: JSON!) { executeWorkflow(workflowId: $workflowId payload: $payload) { status result } }`;

  const variables = {
    workflowId,
    payload: Object.keys(payload).length > 0 ? payload : { dummy: 'empty' },
  };

  const response = await axios.post(
    endpoint,
    { query, variables },
    {
      headers: {
        Authorization: `Bearer ${projectApiKey}`,
        'Content-Type': 'application/json',
        'x-project-id': projectId,
      },
    }
  );
  return response.data;
}

module.exports = {
  getProjectEndpoint, listActiveFlows, getFlowDetails, extractAdvanceSchema, executeWorkflow,
};
