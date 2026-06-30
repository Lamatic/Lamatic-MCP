const axios = require('axios');
const { getDevConfig } = require('./config');

const BASE_URL = 'https://enterprise-api.edge.lamatic.tech/v1';

function getHeaders() {
  const config = getDevConfig();
  return {
    Authorization: `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json',
  };
}

async function createProject({ orgId, name, region, userId }) {
  if (!orgId) throw new Error('Organization ID is required. Use --org-id or set it during auth login.');
  const res = await axios.post(
    `${BASE_URL}/organizations/${orgId}/project/create`,
    { name, region, userId },
    { headers: getHeaders() }
  );
  return res.data;
}

async function createFlow({ orgId, projectId, name }) {
  const res = await axios.post(
    `${BASE_URL}/organizations/${orgId}/project/${projectId}/flows/create`,
    {
      name,
      nodes: [
        {
          id: 'triggerNode_1',
          data: {
            nodeId: 'apiNode',
            values: { id: 'triggerNode_1', nodeName: 'API Trigger' },
            trigger: true,
          },
          type: 'triggerNode',
          position: { x: 225, y: 0 },
          measured: { width: 216, height: 93 },
        },
      ],
      edges: [],
    },
    { headers: getHeaders() }
  );
  return res.data;
}

async function triggerDeployment({ orgId, projectId, name, description, userId }) {
  const res = await axios.post(
    `${BASE_URL}/organizations/${orgId}/project/${projectId}/deployments/trigger`,
    { name: name || 'Deployment', description: description || 'Triggered from Lamatic MCP', userId },
    { headers: getHeaders() }
  );
  return res.data;
}

async function getProject({ orgId, projectId }) {
  const res = await axios.get(`${BASE_URL}/organizations/${orgId}/project/${projectId}`, { headers: getHeaders() });
  return res.data;
}

async function getFlows({ orgId, projectId }) {
  const res = await axios.get(`${BASE_URL}/organizations/${orgId}/project/${projectId}/flows`, { headers: getHeaders() });
  return res.data;
}

async function getFlowDetail({ orgId, projectId, flowId }) {
  const res = await axios.get(`${BASE_URL}/organizations/${orgId}/project/${projectId}/flows/${flowId}`, { headers: getHeaders() });
  return res.data;
}

async function listProjects({ orgId }) {
  const res = await axios.get(`${BASE_URL}/organizations/${orgId}/projects`, { headers: getHeaders() });
  return res.data;
}

async function updateProject({ orgId, projectId, name }) {
  const res = await axios.post(`${BASE_URL}/organizations/${orgId}/project/${projectId}/update`, { name }, { headers: getHeaders() });
  return res.data;
}

async function deleteProject({ orgId, projectId, userId }) {
  const res = await axios.delete(`${BASE_URL}/organizations/${orgId}/project/delete`, {
    headers: getHeaders(),
    data: { projectId, userId },
  });
  return res.data;
}

async function updateFlow(projectId, flowId, nodes, edges, status = 'active') {
  const { orgId } = getDevConfig();
  const res = await axios.post(
    `${BASE_URL}/organizations/${orgId}/project/${projectId}/flows/update`,
    { nodes, edges, flowId, status },
    { headers: getHeaders() }
  );
  return res.data;
}

async function deleteFlow(projectId, flowId) {
  const { orgId } = getDevConfig();
  const res = await axios.delete(`${BASE_URL}/organizations/${orgId}/project/${projectId}/flows/delete`, {
    headers: getHeaders(),
    data: { flowId },
  });
  return res.data;
}

async function listAllFlows(projectId) {
  const { orgId } = getDevConfig();
  const res = await axios.get(`${BASE_URL}/organizations/${orgId}/project/${projectId}/flows`, { headers: getHeaders() });
  return res.data;
}

async function renameFlow(projectId, flowId, name) {
  const { orgId } = getDevConfig();
  const res = await axios.post(
    `${BASE_URL}/organizations/${orgId}/project/${projectId}/flows/rename`,
    { flowId, name },
    { headers: getHeaders() }
  );
  return res.data;
}

async function updateFlowStatus(projectId, flowId, status) {
  const { orgId } = getDevConfig();
  const res = await axios.post(
    `${BASE_URL}/organizations/${orgId}/project/${projectId}/flows/update-status`,
    { flowId, status },
    { headers: getHeaders() }
  );
  return res.data;
}

async function createContext(projectId, name, type) {
  const { orgId } = getDevConfig();
  const res = await axios.post(
    `${BASE_URL}/organizations/${orgId}/project/${projectId}/context/create`,
    { name, type },
    { headers: getHeaders() }
  );
  return res.data;
}

async function deleteContext(projectId, contextId) {
  const { orgId } = getDevConfig();
  const res = await axios.delete(`${BASE_URL}/organizations/${orgId}/project/${projectId}/context/${contextId}`, { headers: getHeaders() });
  return res.data;
}

async function getContext(projectId, contextId) {
  const { orgId } = getDevConfig();
  const res = await axios.get(`${BASE_URL}/organizations/${orgId}/project/${projectId}/context/${contextId}`, { headers: getHeaders() });
  return res.data;
}

async function getAllContexts(projectId) {
  const { orgId } = getDevConfig();
  const res = await axios.get(`${BASE_URL}/organizations/${orgId}/project/${projectId}/context`, { headers: getHeaders() });
  return res.data;
}

async function listAllDeployments(projectId) {
  const { orgId } = getDevConfig();
  const res = await axios.get(`${BASE_URL}/organizations/${orgId}/project/${projectId}/deployments`, { headers: getHeaders() });
  return res.data;
}

async function getDeployment(projectId, deploymentId) {
  const { orgId } = getDevConfig();
  const res = await axios.get(`${BASE_URL}/organizations/${orgId}/project/${projectId}/deployments/${deploymentId}`, { headers: getHeaders() });
  return res.data;
}

async function listModelCreds(projectId) {
  const { orgId } = getDevConfig();
  const res = await axios.get(`${BASE_URL}/organizations/${orgId}/project/${projectId}/models`, { headers: getHeaders() });
  return res.data;
}

async function listModelProviders(projectId, includeModels = false) {
  const { orgId } = getDevConfig();
  const url = `${BASE_URL}/organizations/${orgId}/project/${projectId}/models/providers${includeModels ? '?includeModels=true' : ''}`;
  const res = await axios.get(url, { headers: getHeaders() });
  return res.data;
}

async function checkModelStatus(projectId, modelName) {
  const { orgId } = getDevConfig();
  const res = await axios.get(
    `${BASE_URL}/organizations/${orgId}/project/${projectId}/models/status?modelName=${encodeURIComponent(modelName)}`,
    { headers: getHeaders() }
  );
  return res.data;
}

async function createModelCreds(projectId, name, provider, credentials) {
  const { orgId } = getDevConfig();
  const res = await axios.post(
    `${BASE_URL}/organizations/${orgId}/project/${projectId}/models/create`,
    { name, provider, credentials },
    { headers: getHeaders() }
  );
  return res.data;
}

async function listSupportedIntegrations(projectId) {
  const { orgId } = getDevConfig();
  const res = await axios.get(`${BASE_URL}/organizations/${orgId}/project/${projectId}/integrations/supported`, { headers: getHeaders() });
  return res.data;
}

async function listIntegrationCreds(projectId) {
  const { orgId } = getDevConfig();
  const res = await axios.get(`${BASE_URL}/organizations/${orgId}/project/${projectId}/integrations`, { headers: getHeaders() });
  return res.data;
}

async function createIntegrationCreds(projectId, name, integration, credentials) {
  const { orgId } = getDevConfig();
  const res = await axios.post(
    `${BASE_URL}/organizations/${orgId}/project/${projectId}/integrations/create`,
    { name, integration, credentials },
    { headers: getHeaders() }
  );
  return res.data;
}

async function getCredInfo(projectId, credentialId) {
  const { orgId } = getDevConfig();
  const res = await axios.get(`${BASE_URL}/organizations/${orgId}/project/${projectId}/credentials/${credentialId}`, { headers: getHeaders() });
  return res.data;
}

async function getOAuthUrl(projectId, nodeName, redirectUri, credentialName) {
  const { orgId } = getDevConfig();
  const res = await axios.post(
    `${BASE_URL}/organizations/${orgId}/project/${projectId}/credentials/oauth/url`,
    { nodeName, redirect_uri: redirectUri, credentialName },
    { headers: getHeaders() }
  );
  return res.data;
}

async function deleteCredential(projectId, credentialId) {
  const { orgId } = getDevConfig();
  const res = await axios.delete(`${BASE_URL}/organizations/${orgId}/project/${projectId}/credentials/${credentialId}`, { headers: getHeaders() });
  return res.data;
}

async function updateCredential(projectId, credentialId, credentials) {
  const { orgId } = getDevConfig();
  const res = await axios.post(
    `${BASE_URL}/organizations/${orgId}/project/${projectId}/credentials/update`,
    { credentialId, credentials },
    { headers: getHeaders() }
  );
  return res.data;
}

module.exports = {
  createProject, createFlow, triggerDeployment, getProject, getFlows, getFlowDetail, listProjects,
  updateProject, deleteProject, updateFlow, deleteFlow, listAllFlows, renameFlow, updateFlowStatus,
  createContext, deleteContext, getContext, getAllContexts, listAllDeployments, getDeployment,
  listModelCreds, listModelProviders, checkModelStatus, createModelCreds, listSupportedIntegrations,
  listIntegrationCreds, createIntegrationCreds, getCredInfo, getOAuthUrl, deleteCredential, updateCredential,
};
