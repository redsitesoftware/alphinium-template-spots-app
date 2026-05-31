#!/usr/bin/env node
/**
 * Auto-create Strapi admin user on first run
 * Reads credentials from backend/.env
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '../backend/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const STRAPI_URL = 'http://localhost:1337';
const ADMIN_EMAIL = env.STRAPI_ADMIN_EMAIL || 'admin@alphinium.local';
const ADMIN_PASSWORD = env.STRAPI_ADMIN_PASSWORD || 'Admin123!Dev';
const ADMIN_FIRSTNAME = env.STRAPI_ADMIN_FIRSTNAME || 'Admin';
const ADMIN_LASTNAME = env.STRAPI_ADMIN_LASTNAME || 'User';

function makeRequest(url, method, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 1337,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
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

async function createAdmin() {
  try {
    console.log('�� Checking if Strapi admin exists...');
    
    // Check if admin registration is open
    const hasAdminRes = await makeRequest(`${STRAPI_URL}/admin/init`, 'GET');
    
    if (hasAdminRes.data.hasAdmin) {
      console.log('✅ Admin user already exists!');
      console.log(`📧 Email: ${ADMIN_EMAIL}`);
      console.log(`🔐 Password: ${ADMIN_PASSWORD}`);
      return;
    }
    
    // Create admin user
    console.log('📝 Creating admin user...');
    const response = await makeRequest(`${STRAPI_URL}/admin/register-admin`, 'POST', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      firstname: ADMIN_FIRSTNAME,
      lastname: ADMIN_LASTNAME,
    });
    
    if (response.status === 201 || response.status === 200) {
      console.log('✅ Admin user created successfully!');
      console.log('');
      console.log('📧 Email:', ADMIN_EMAIL);
      console.log('🔐 Password:', ADMIN_PASSWORD);
      console.log('🌐 Admin Panel:', `${STRAPI_URL}/admin`);
      console.log('');
      console.log('⚠️  Change the password after first login!');
    } else {
      console.log('ℹ️  Response:', response.status, response.data);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to Strapi at', STRAPI_URL);
      console.error('💡 Make sure Strapi backend is running first!');
      process.exit(1);
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

createAdmin();
