#!/usr/bin/env node
/**
 * Configure OAuth Providers in Strapi
 * For template deployments - automates OAuth provider setup
 * 
 * Usage:
 *   node configure-oauth.js --interactive  # Wizard mode
 *   node configure-oauth.js --from-env     # Load from .env
 *   node configure-oauth.js --enable github,google  # Enable specific providers
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const envPath = path.join(__dirname, '../backend/.env');

// Load environment variables
function loadEnv() {
  if (!fs.existsSync(envPath)) {
    console.error('❌ backend/.env not found!');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  });
  return env;
}

function makeRequest(url, method, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 1337,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      const body = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function loginAdmin(email, password) {
  const response = await makeRequest(`${STRAPI_URL}/admin/login`, 'POST', {
    email,
    password
  });
  
  if (response.status === 200 && response.data.data?.token) {
    return response.data.data.token;
  }
  
  throw new Error('Failed to login as admin');
}

async function getProviders(token) {
  const response = await makeRequest(
    `${STRAPI_URL}/users-permissions/providers`,
    'GET',
    null,
    { Authorization: `Bearer ${token}` }
  );
  return response.data;
}

async function updateProvider(token, providerName, config) {
  const response = await makeRequest(
    `${STRAPI_URL}/users-permissions/providers`,
    'PUT',
    { providers: { [providerName]: config } },
    { Authorization: `Bearer ${token}` }
  );
  return response;
}

function createProviderConfig(provider, env) {
  const baseURL = env.FRONTEND_URL || 'http://localhost:8081';
  
  const configs = {
    github: {
      enabled: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
      key: env.GITHUB_CLIENT_ID || '',
      secret: env.GITHUB_CLIENT_SECRET || '',
      callback: `${STRAPI_URL}/api/connect/github/callback`,
      scope: ['user', 'user:email']
    },
    google: {
      enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      key: env.GOOGLE_CLIENT_ID || '',
      secret: env.GOOGLE_CLIENT_SECRET || '',
      callback: `${STRAPI_URL}/api/connect/google/callback`,
      scope: ['email', 'profile']
    },
    facebook: {
      enabled: !!(env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET),
      key: env.FACEBOOK_APP_ID || '',
      secret: env.FACEBOOK_APP_SECRET || '',
      callback: `${STRAPI_URL}/api/connect/facebook/callback`,
      scope: ['email', 'public_profile']
    }
  };
  
  return configs[provider];
}

async function promptForCredentials(provider) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (query) => new Promise(resolve => rl.question(query, resolve));
  
  console.log(`\n🔑 Configure ${provider.toUpperCase()}`);
  
  const enabled = await question(`Enable ${provider}? (y/n): `);
  if (enabled.toLowerCase() !== 'y') {
    rl.close();
    return { enabled: false };
  }
  
  let key, secret;
  
  if (provider === 'github') {
    console.log('Create OAuth app at: https://github.com/settings/developers');
    key = await question('GitHub Client ID: ');
    secret = await question('GitHub Client Secret: ');
  } else if (provider === 'google') {
    console.log('Create OAuth app at: https://console.cloud.google.com/apis/credentials');
    key = await question('Google Client ID: ');
    secret = await question('Google Client Secret: ');
  } else if (provider === 'facebook') {
    console.log('Create app at: https://developers.facebook.com/apps');
    key = await question('Facebook App ID: ');
    secret = await question('Facebook App Secret: ');
  }
  
  rl.close();
  
  return {
    enabled: true,
    key,
    secret,
    callback: `${STRAPI_URL}/api/connect/${provider}/callback`,
    scope: provider === 'github' ? ['user', 'user:email'] : ['email']
  };
}

async function interactiveMode(env) {
  console.log('🧙 OAuth Setup Wizard\n');
  
  const providers = ['github', 'google', 'facebook'];
  const configs = {};
  
  for (const provider of providers) {
    configs[provider] = await promptForCredentials(provider);
  }
  
  // Save to .env
  console.log('\n💾 Updating backend/.env...');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  for (const [provider, config] of Object.entries(configs)) {
    if (config.enabled) {
      const keyVar = provider === 'facebook' ? 'FACEBOOK_APP_ID' : `${provider.toUpperCase()}_CLIENT_ID`;
      const secretVar = provider === 'facebook' ? 'FACEBOOK_APP_SECRET' : `${provider.toUpperCase()}_CLIENT_SECRET`;
      
      // Update or append
      const keyRegex = new RegExp(`^${keyVar}=.*$`, 'm');
      const secretRegex = new RegExp(`^${secretVar}=.*$`, 'm');
      
      if (keyRegex.test(envContent)) {
        envContent = envContent.replace(keyRegex, `${keyVar}=${config.key}`);
      } else {
        envContent += `\n${keyVar}=${config.key}`;
      }
      
      if (secretRegex.test(envContent)) {
        envContent = envContent.replace(secretRegex, `${secretVar}=${config.secret}`);
      } else {
        envContent += `\n${secretVar}=${config.secret}`;
      }
    }
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Environment variables saved!');
  
  return configs;
}

async function configureProviders(configs, token) {
  console.log('\n🔧 Configuring providers in Strapi...');
  
  for (const [provider, config] of Object.entries(configs)) {
    if (config.enabled) {
      console.log(`  • Enabling ${provider}...`);
      try {
        await updateProvider(token, provider, config);
        console.log(`    ✅ ${provider} configured`);
      } catch (error) {
        console.error(`    ❌ Failed to configure ${provider}:`, error.message);
      }
    }
  }
}

async function fromEnvMode(env) {
  console.log('📋 Loading OAuth credentials from .env\n');
  
  const configs = {
    github: createProviderConfig('github', env),
    google: createProviderConfig('google', env),
    facebook: createProviderConfig('facebook', env)
  };
  
  // Show what will be configured
  for (const [provider, config] of Object.entries(configs)) {
    const status = config.enabled ? '✅ ENABLED' : '⚠️  DISABLED (missing credentials)';
    console.log(`${provider.toUpperCase()}: ${status}`);
  }
  
  return configs;
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0];
  
  console.log('🔐 Strapi OAuth Provider Configuration\n');
  
  // Check Strapi is running
  try {
    await makeRequest(`${STRAPI_URL}/admin/init`, 'GET');
  } catch (error) {
    console.error('❌ Cannot connect to Strapi at', STRAPI_URL);
    console.error('💡 Start backend first: ./SCRIPTS/dev-backend.sh');
    process.exit(1);
  }
  
  const env = loadEnv();
  
  // Get admin credentials
  const adminEmail = env.STRAPI_ADMIN_EMAIL || 'admin@alphinium.local';
  const adminPassword = env.STRAPI_ADMIN_PASSWORD || 'Admin123!Dev';
  
  console.log('🔑 Logging in as admin...');
  const token = await loginAdmin(adminEmail, adminPassword);
  console.log('✅ Authenticated!\n');
  
  let configs;
  
  if (mode === '--interactive') {
    configs = await interactiveMode(env);
  } else if (mode === '--from-env') {
    configs = await fromEnvMode(env);
  } else if (mode?.startsWith('--enable')) {
    const providers = mode.split('=')[1]?.split(',') || args[1]?.split(',') || [];
    configs = {};
    for (const provider of providers) {
      configs[provider] = createProviderConfig(provider, env);
    }
  } else {
    console.log('Usage:');
    console.log('  node configure-oauth.js --interactive     # Wizard mode');
    console.log('  node configure-oauth.js --from-env        # Load from .env');
    console.log('  node configure-oauth.js --enable github,google  # Enable specific');
    process.exit(0);
  }
  
  await configureProviders(configs, token);
  
  console.log('\n✨ OAuth configuration complete!\n');
  console.log('🔗 Callback URLs for OAuth apps:');
  for (const [provider, config] of Object.entries(configs)) {
    if (config.enabled) {
      console.log(`  ${provider}: ${config.callback}`);
    }
  }
  console.log('\n🌐 Test login at: http://localhost:1337/admin');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
