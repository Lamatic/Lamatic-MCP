const { z } = require('zod');
const { saveDevConfig, getDevConfig } = require('../utils/config');
const {
  createProject, createFlow, triggerDeployment, getProject, updateProject, listProjects, getFlows,
  deleteProject, updateFlow, deleteFlow, listAllFlows, renameFlow, updateFlowStatus, createContext,
  deleteContext, getContext, getAllContexts, listAllDeployments, getDeployment, listModelCreds,
  listModelProviders, checkModelStatus, createModelCreds, listSupportedIntegrations, listIntegrationCreds,
  createIntegrationCreds, getCredInfo, getOAuthUrl, deleteCredential, updateCredential,
} = require('../utils/devApi');

function err(e) {
  return { content: [{ type: 'text', text: `Error: ${e.response?.data?.message || e.message}` }] };
}

function registerDevTools(server) {
  server.tool('dev_auth_login', 'Authenticate with Lamatic DevMCP', {
    apiKey: z.string(),
    orgId: z.string(),
    userId: z.string(),
  }, async ({ apiKey, orgId, userId }) => {
    saveDevConfig({ apiKey, orgId, userId });
    return { content: [{ type: 'text', text: `Authenticated successfully! Org ID: ${orgId}` }] };
  });

  server.tool('dev_create_project', 'Create a new Lamatic project', {
    name: z.string(),
    region: z.enum(['us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1']),
  }, async ({ name, region }) => {
    try {
      const config = getDevConfig();
      const project = await createProject({ orgId: config.orgId, name, region, userId: config.userId });
      return { content: [{ type: 'text', text: `Project created!\n- ID: ${project.id}\n- Slug: ${project.slug}\n- Status: ${project.status}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_get_project', 'Get details of a Lamatic project', {
    projectId: z.string(),
  }, async ({ projectId }) => {
    try {
      const config = getDevConfig();
      const project = await getProject({ orgId: config.orgId, projectId });
      return { content: [{ type: 'text', text: `Project found!\n- ID: ${project.id}\n- Name: ${project.name}\n- Status: ${project.status}\n- Region: ${project.location}\n- Endpoint: ${project.endpoint}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_create_flow', 'Create a new flow in a Lamatic project', {
    projectId: z.string(),
    name: z.string(),
  }, async ({ projectId, name }) => {
    try {
      const config = getDevConfig();
      const result = await createFlow({ orgId: config.orgId, projectId, name });
      return { content: [{ type: 'text', text: `Flow created!\n- ID: ${result.id}\n- Name: ${result.name}\n- Status: ${result.status}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_get_flows', 'List all flows in a Lamatic project', {
    projectId: z.string(),
  }, async ({ projectId }) => {
    try {
      const config = getDevConfig();
      const data = await getFlows({ orgId: config.orgId, projectId });
      const flows = data.flows || [];
      if (flows.length === 0) return { content: [{ type: 'text', text: 'No flows found.' }] };
      const flowList = flows.map((f) => `- ${f.name} (ID: ${f.id}, Status: ${f.status})`).join('\n');
      return { content: [{ type: 'text', text: `Flows:\n\n${flowList}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_deploy_project', 'Deploy a Lamatic project', {
    projectId: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
  }, async ({ projectId, name, description }) => {
    try {
      const config = getDevConfig();
      const result = await triggerDeployment({
        orgId: config.orgId, projectId,
        name: name || 'Deployment',
        description: description || 'Triggered from Lamatic MCP',
        userId: config.userId,
      });
      return { content: [{ type: 'text', text: `Deployment triggered!\n\n${JSON.stringify(result, null, 2)}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_list_projects', 'List all projects in your Lamatic organization', {}, async () => {
    try {
      const config = getDevConfig();
      const data = await listProjects({ orgId: config.orgId });
      const projects = data.projects || [];
      if (projects.length === 0) return { content: [{ type: 'text', text: 'No projects found.' }] };
      const projectList = projects.map((p) => `- ${p.name} (ID: ${p.id}, Status: ${p.status}, Region: ${p.location})`).join('\n');
      return { content: [{ type: 'text', text: `Your projects:\n\n${projectList}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_update_project', 'Rename a Lamatic project', {
    projectId: z.string(),
    name: z.string(),
  }, async ({ projectId, name }) => {
    try {
      const config = getDevConfig();
      const result = await updateProject({ orgId: config.orgId, projectId, name });
      return { content: [{ type: 'text', text: `Project renamed successfully!\n- New Name: ${result.project_name}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_delete_project', 'Delete a Lamatic project', {
    projectId: z.string(),
  }, async ({ projectId }) => {
    try {
      const config = getDevConfig();
      const result = await deleteProject({ orgId: config.orgId, projectId, userId: config.userId });
      return { content: [{ type: 'text', text: `Project deletion started!\n- Deployment ID: ${result.deployment_id}\n- Status: ${result.status}\n- Message: ${result.message}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_update_flow', 'Update an existing Lamatic flow with new nodes and edges', {
    projectId: z.string().describe('The project ID'),
    flowId: z.string().describe('The flow ID to update'),
    nodes: z.array(z.object({}).passthrough()).describe('Array of node objects'),
    edges: z.array(z.object({}).passthrough()).describe('Array of edge objects'),
    status: z.enum(['active', 'inactive']).default('active').describe('Flow status'),
  }, async ({ projectId, flowId, nodes, edges, status }) => {
    try {
      const result = await updateFlow(projectId, flowId, nodes, edges, status);
      return { content: [{ type: 'text', text: `Flow updated!\nFlow ID: ${result.flowId}\nName: ${result.name}\nStatus: ${result.status}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_delete_flow', 'Delete a flow from a Lamatic project', {
    projectId: z.string().describe('The project ID'),
    flowId: z.string().describe('The flow ID to delete'),
  }, async ({ projectId, flowId }) => {
    try {
      const result = await deleteFlow(projectId, flowId);
      return { content: [{ type: 'text', text: result.message }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_list_all_flows', 'List all flows for a Lamatic project', {
    projectId: z.string().describe('The project ID'),
  }, async ({ projectId }) => {
    try {
      const result = await listAllFlows(projectId);
      const flowList = result.flows.map((f) => `- ${f.name} (ID: ${f.id} | Slug: ${f.slug} | Status: ${f.status})`).join('\n');
      return { content: [{ type: 'text', text: `Flows:\n${flowList}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_rename_flow', 'Rename a flow in a Lamatic project', {
    projectId: z.string().describe('The project ID'),
    flowId: z.string().describe('The flow ID to rename'),
    name: z.string().describe('The new name for the flow'),
  }, async ({ projectId, flowId, name }) => {
    try {
      const result = await renameFlow(projectId, flowId, name);
      return { content: [{ type: 'text', text: `Flow renamed successfully!\nFlow ID: ${result.flowId}\nNew Name: ${result.name}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_update_flow_status', 'Update the status of a flow in a Lamatic project', {
    projectId: z.string().describe('The project ID'),
    flowId: z.string().describe('The flow ID'),
    status: z.enum(['active', 'inactive']).describe('The new status for the flow'),
  }, async ({ projectId, flowId, status }) => {
    try {
      const result = await updateFlowStatus(projectId, flowId, status);
      return { content: [{ type: 'text', text: `Flow status updated!\nFlow ID: ${result.flowId}\nStatus: ${result.status}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_create_context', 'Create a new context (vector or memory) in a Lamatic project', {
    projectId: z.string().describe('The project ID'),
    name: z.string().describe('Name of the context'),
    type: z.enum(['vector', 'memory']).describe('Type of context'),
  }, async ({ projectId, name, type }) => {
    try {
      const result = await createContext(projectId, name, type);
      return { content: [{ type: 'text', text: `Context created!\nID: ${result.id}\nClass: ${result.class}\nType: ${result.isMemory ? 'memory' : 'vector'}\nProperties: ${result.propertyCount}\nObjects: ${result.objectCount}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_delete_context', 'Delete a context from a Lamatic project', {
    projectId: z.string().describe('The project ID'),
    contextId: z.string().describe('The context ID to delete'),
  }, async ({ projectId, contextId }) => {
    try {
      const result = await deleteContext(projectId, contextId);
      return { content: [{ type: 'text', text: result.message }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_get_context', 'Get details of a specific context in a Lamatic project', {
    projectId: z.string().describe('The project ID'),
    contextId: z.string().describe('The context ID'),
  }, async ({ projectId, contextId }) => {
    try {
      const result = await getContext(projectId, contextId);
      return { content: [{ type: 'text', text: `Context Details:\nID: ${result.id}\nName: ${result.name}\nType: ${result.type}\nProperties: ${result.propertyCount}\nObjects: ${result.objectCount}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_get_all_contexts', 'List all contexts in a Lamatic project', {
    projectId: z.string().describe('The project ID'),
  }, async ({ projectId }) => {
    try {
      const result = await getAllContexts(projectId);
      const contextList = result.contexts.map((c) => `- ${c.name} (ID: ${c.id} | Type: ${c.type} | Objects: ${c.objectCount})`).join('\n');
      return { content: [{ type: 'text', text: `Contexts:\n${contextList}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_list_all_deployments', 'List all deployments for a Lamatic project', {
    projectId: z.string().describe('The project ID'),
  }, async ({ projectId }) => {
    try {
      const result = await listAllDeployments(projectId);
      const list = result.deployments.map((d) => `- ${d.name} (ID: ${d.id} | Status: ${d.status})`).join('\n');
      return { content: [{ type: 'text', text: `Deployments:\n${list}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_get_deployment', 'Get details of a specific deployment in a Lamatic project', {
    projectId: z.string().describe('The project ID'),
    deploymentId: z.string().describe('The deployment ID'),
  }, async ({ projectId, deploymentId }) => {
    try {
      const result = await getDeployment(projectId, deploymentId);
      const changes = result.changes_deployed.map((c) => `  - ${c.name}`).join('\n');
      return { content: [{ type: 'text', text: `Deployment Details:\nID: ${result.id}\nName: ${result.name}\nDescription: ${result.description || 'N/A'}\nStatus: ${result.status}\nTriggered By: ${result.triggered_by}\nCreated At: ${result.created_at}\nTime Taken: ${result.time_taken_in_seconds}s\nChanges Deployed:\n${changes}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_list_model_creds', 'List all model credentials for a Lamatic project', {
    projectId: z.string().describe('The project ID'),
  }, async ({ projectId }) => {
    try {
      const result = await listModelCreds(projectId);
      const list = result.models.map((m) => `- ${m.name} (Provider: ${m.provider} | Credential ID: ${m.credentialId})`).join('\n');
      return { content: [{ type: 'text', text: `Model Credentials:\n${list}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_list_model_providers', 'List all available model providers, optionally including their models', {
    projectId: z.string().describe('The project ID'),
    includeModels: z.boolean().default(false).describe('Include available models for each provider'),
  }, async ({ projectId, includeModels }) => {
    try {
      const result = await listModelProviders(projectId, includeModels);
      const list = result.providers.map((p) => {
        let entry = `- ${p.name}`;
        if (includeModels && p.models?.length) {
          const models = p.models.map((m) => `    • ${m.name} (${m.type.join(', ')} | ${m.status})`).join('\n');
          entry += `\n${models}`;
        }
        return entry;
      }).join('\n');
      return { content: [{ type: 'text', text: `Providers:\n${list}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_check_model_status', 'Check the availability status of a specific model', {
    projectId: z.string().describe('The project ID'),
    modelName: z.string().describe('The model name to check (e.g. command-r7b-12-2024)'),
  }, async ({ projectId, modelName }) => {
    try {
      const result = await checkModelStatus(projectId, modelName);
      return { content: [{ type: 'text', text: `Model: ${modelName}\nStatus: ${result.status}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_create_model_creds', 'Create new model credentials for a provider in a Lamatic project', {
    projectId: z.string().describe('The project ID'),
    name: z.string().describe('Display name for the credential'),
    provider: z.string().describe('Provider name (e.g. openai, anthropic, mistral)'),
    credentials: z.record(z.string()).describe('Key-value pairs of credentials required by the provider'),
  }, async ({ projectId, name, provider, credentials }) => {
    try {
      const result = await createModelCreds(projectId, name, provider, credentials);
      return { content: [{ type: 'text', text: `Model credential created!\nCredential ID: ${result.credentialId}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_list_supported_integrations', 'List all supported integrations available for a Lamatic project', {
    projectId: z.string().describe('The project ID'),
  }, async ({ projectId }) => {
    try {
      const result = await listSupportedIntegrations(projectId);
      const list = result.integrations.map((i) => `- ${i.name} (Type: ${i.type})`).join('\n');
      return { content: [{ type: 'text', text: `Supported Integrations:\n${list}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_list_integration_creds', 'List all integration credentials for a Lamatic project', {
    projectId: z.string().describe('The project ID'),
  }, async ({ projectId }) => {
    try {
      const result = await listIntegrationCreds(projectId);
      if (!result.integrations.length) return { content: [{ type: 'text', text: 'No integration credentials found for this project.' }] };
      const list = result.integrations.map((i) => `- ${i.name} (Integration: ${i.integration} | Credential ID: ${i.credentialId})`).join('\n');
      return { content: [{ type: 'text', text: `Integration Credentials:\n${list}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_create_integration_creds', 'Create new integration credentials for a Lamatic project', {
    projectId: z.string().describe('The project ID'),
    name: z.string().describe('Display name for the integration credential'),
    integration: z.string().describe('Integration type (e.g. s3, slack, postgres, gmail, googleDrive)'),
    credentials: z.record(z.string()).describe('Key-value pairs of credentials required by the integration'),
  }, async ({ projectId, name, integration, credentials }) => {
    try {
      const result = await createIntegrationCreds(projectId, name, integration, credentials);
      return { content: [{ type: 'text', text: `Integration credential created!\nCredential ID: ${result.credentialId}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_get_cred_info', 'Get details of a specific credential in a Lamatic project', {
    projectId: z.string().describe('The project ID'),
    credentialId: z.string().describe('The credential ID'),
  }, async ({ projectId, credentialId }) => {
    try {
      const result = await getCredInfo(projectId, credentialId);
      const c = result.credential;
      return { content: [{ type: 'text', text: `Credential Info:\nID: ${c.id}\nName: ${c.name}\nType: ${c.type}\nProvider: ${c.provider}\nCreated At: ${c.created_at}\nUpdated At: ${c.updated_at}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_get_oauth_url', 'Get an OAuth authorization URL for an integration in a Lamatic project', {
    projectId: z.string().describe('The project ID'),
    nodeName: z.string().describe('The integration node name (e.g. googleDrive, gmail, slack)'),
    redirectUri: z.string().describe('The redirect URI after OAuth authorization'),
    credentialName: z.string().describe('Display name for the credential being created'),
  }, async ({ projectId, nodeName, redirectUri, credentialName }) => {
    try {
      const result = await getOAuthUrl(projectId, nodeName, redirectUri, credentialName);
      return { content: [{ type: 'text', text: `OAuth URL:\n${result.authUrl}` }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_delete_credential', 'Delete a credential from a Lamatic project', {
    projectId: z.string().describe('The project ID'),
    credentialId: z.string().describe('The credential ID to delete'),
  }, async ({ projectId, credentialId }) => {
    try {
      const result = await deleteCredential(projectId, credentialId);
      return { content: [{ type: 'text', text: result.message }] };
    } catch (e) { return err(e); }
  });

  server.tool('dev_update_credential', 'Update an existing credential in a Lamatic project', {
    projectId: z.string().describe('The project ID'),
    credentialId: z.string().describe('The credential ID to update'),
    credentials: z.record(z.string()).describe('Key-value pairs of updated credentials'),
  }, async ({ projectId, credentialId, credentials }) => {
    try {
      const result = await updateCredential(projectId, credentialId, credentials);
      return { content: [{ type: 'text', text: result.message }] };
    } catch (e) { return err(e); }
  });
}

module.exports = { registerDevTools };
