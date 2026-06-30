const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.lamatic');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

function readRawConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    return fs.readJsonSync(CONFIG_PATH);
  } catch {
    return {};
  }
}

function saveNamespace(namespace, data) {
  const current = readRawConfig();
  current[namespace] = { ...(current[namespace] || {}), ...data };
  fs.ensureDirSync(CONFIG_DIR);
  fs.writeJsonSync(CONFIG_PATH, current, { spaces: 2 });
}

function saveDevConfig({ apiKey, orgId, userId }) {
  saveNamespace('dev', { apiKey, orgId, userId });
}

function getDevConfig() {
  if (process.env.LAMATIC_API_KEY && process.env.LAMATIC_ORG_ID) {
    return {
      apiKey: process.env.LAMATIC_API_KEY,
      orgId: process.env.LAMATIC_ORG_ID,
      userId: process.env.LAMATIC_USER_ID || null,
    };
  }

  const dev = readRawConfig().dev;
  if (!dev?.apiKey || !dev?.orgId) {
    throw new Error(
      'Not authenticated for dev_* tools. Run dev_auth_login, or set LAMATIC_API_KEY and LAMATIC_ORG_ID env vars.'
    );
  }
  return dev;
}

function saveGraphConfig({ orgApiKey, projectApiKey, orgId }) {
  saveNamespace('graph', { orgApiKey, projectApiKey, orgId });
}

function getGraphConfig() {
  if (process.env.PROJECT_API_KEY && process.env.PROJECT_ID && process.env.ENDPOINT) {
    return {
      projectApiKey: process.env.PROJECT_API_KEY,
      projectId: process.env.PROJECT_ID,
      endpoint: process.env.ENDPOINT,
      flowId: process.env.FLOW_ID || null,
      mode: 'execution-only',
    };
  }

  const graph = readRawConfig().graph;
  if (!graph?.projectApiKey) {
    throw new Error(
      'Not authenticated for graph_* tools. Run graph_auth_login, or set PROJECT_API_KEY, PROJECT_ID and ENDPOINT env vars.'
    );
  }
  return { ...graph, mode: 'full' };
}


function getDocsConfig() {
  return {};
}


function getKitConfig() {
  return readRawConfig().kit || {};
}

function saveKitConfig(data) {
  saveNamespace('kit', data);
}


function clearAllConfig() {
  if (fs.existsSync(CONFIG_PATH)) fs.removeSync(CONFIG_PATH);
}

module.exports = {
  saveDevConfig, getDevConfig,
  saveGraphConfig, getGraphConfig,
  getDocsConfig,
  getKitConfig, saveKitConfig,
  clearAllConfig,
};
