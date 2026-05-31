#!/usr/bin/env node
/**
 * Auto-update Configuration Files
 * 
 * Reads .stripe-prices-{mode}.json and updates:
 * - src/config/plans-*.js
 * - test-stripe-integration.html
 * 
 * Usage:
 *   node scripts/update-config-files.js --mode=test
 *   node scripts/update-config-files.js --mode=live
 */

const fs = require('fs');
const path = require('path');

// Parse command line args
const args = process.argv.slice(2);
const modeArg = args.find(arg => arg.startsWith('--mode='));
const mode = modeArg ? modeArg.split('=')[1] : 'test';

if (!['test', 'live'].includes(mode)) {
  console.error('❌ Mode must be "test" or "live"');
  process.exit(1);
}

const pricesFile = path.join(__dirname, `../.stripe-prices-${mode}.json`);

if (!fs.existsSync(pricesFile)) {
  console.error(`❌ Price file not found: ${pricesFile}`);
  console.error('   Run: node scripts/setup-stripe-products.js --mode=' + mode);
  process.exit(1);
}

const prices = JSON.parse(fs.readFileSync(pricesFile, 'utf8'));

console.log(`\n🔧 Updating configuration files with ${mode.toUpperCase()} mode prices...\n`);

/**
 * Update plans-alphinium.js
 */
function updateAlphiniumConfig() {
  const filePath = path.join(__dirname, '../src/config/plans-alphinium.js');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update developer prices
  if (prices.alphinium.developer) {
    content = content.replace(
      /developer: \{[\s\S]*?prices: \{[\s\S]*?\}/m,
      `developer: {
      name: 'Developer',
      prices: {
        monthly: '${prices.alphinium.developer.monthly}',
        beta: '${prices.alphinium.developer.beta}',
        annual: '${prices.alphinium.developer.annual}'
      }`
    );
  }
  
  // Update team prices
  if (prices.alphinium.team) {
    content = content.replace(
      /team: \{[\s\S]*?prices: \{[\s\S]*?\}/m,
      `team: {
      name: 'Team',
      prices: {
        monthly: '${prices.alphinium.team.monthly}',
        beta: '${prices.alphinium.team.beta}',
        annual: '${prices.alphinium.team.annual}'
      }`
    );
  }
  
  fs.writeFileSync(filePath, content);
  console.log('✓ Updated src/config/plans-alphinium.js');
}

/**
 * Update plans-chatinstance.js
 */
function updateChatInstanceConfig() {
  const filePath = path.join(__dirname, '../src/config/plans-chatinstance.js');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update starter prices
  if (prices.chatinstance.starter) {
    content = content.replace(
      /starter: \{[\s\S]*?prices: \{[\s\S]*?\}/m,
      `starter: {
      name: 'Starter',
      prices: {
        monthly: '${prices.chatinstance.starter.monthly}',
        beta: '${prices.chatinstance.starter.beta}',
        annual: '${prices.chatinstance.starter.annual}'
      }`
    );
  }
  
  // Update professional prices
  if (prices.chatinstance.professional) {
    content = content.replace(
      /professional: \{[\s\S]*?prices: \{[\s\S]*?\}/m,
      `professional: {
      name: 'Professional',
      prices: {
        monthly: '${prices.chatinstance.professional.monthly}',
        beta: '${prices.chatinstance.professional.beta}',
        annual: '${prices.chatinstance.professional.annual}'
      }`
    );
  }
  
  // Update business prices
  if (prices.chatinstance.business) {
    content = content.replace(
      /business: \{[\s\S]*?prices: \{[\s\S]*?\}/m,
      `business: {
      name: 'Business',
      prices: {
        monthly: '${prices.chatinstance.business.monthly}',
        beta: '${prices.chatinstance.business.beta}',
        annual: '${prices.chatinstance.business.annual}'
      }`
    );
  }
  
  fs.writeFileSync(filePath, content);
  console.log('✓ Updated src/config/plans-chatinstance.js');
}

/**
 * Update plans-userpods.js
 */
function updateUserPodsConfig() {
  const filePath = path.join(__dirname, '../src/config/plans-userpods.js');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update hobby prices
  if (prices.userpods.hobby) {
    content = content.replace(
      /hobby: \{[\s\S]*?prices: \{[\s\S]*?\}/m,
      `hobby: {
      name: 'Hobby',
      prices: {
        monthly: '${prices.userpods.hobby.monthly}'
      }`
    );
  }
  
  // Update pro prices
  if (prices.userpods.pro) {
    content = content.replace(
      /pro: \{[\s\S]*?prices: \{[\s\S]*?\}/m,
      `pro: {
      name: 'Pro',
      prices: {
        monthly: '${prices.userpods.pro.monthly}'
      }`
    );
  }
  
  // Update business prices
  if (prices.userpods.business) {
    content = content.replace(
      /business: \{[\s\S]*?prices: \{[\s\S]*?\}/m,
      `business: {
      name: 'Business',
      prices: {
        monthly: '${prices.userpods.business.monthly}'
      }`
    );
  }
  
  fs.writeFileSync(filePath, content);
  console.log('✓ Updated src/config/plans-userpods.js');
}

/**
 * Update test-stripe-integration.html
 */
function updateTestHTML() {
  const filePath = path.join(__dirname, '../test-stripe-integration.html');
  if (!fs.existsSync(filePath)) {
    console.log('⚠ test-stripe-integration.html not found, skipping');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Build the priceIds object
  const priceIdsJS = `const priceIds = {
            ${mode}: {
                alphinium: ${JSON.stringify(prices.alphinium, null, 20).replace(/\n/g, '\n                ')},
                chatinstance: ${JSON.stringify(prices.chatinstance, null, 20).replace(/\n/g, '\n                ')},
                enterprise: ${JSON.stringify(prices.enterprise || {}, null, 20).replace(/\n/g, '\n                ')},
                userpods: ${JSON.stringify(prices.userpods, null, 20).replace(/\n/g, '\n                ')}
            }
        };`;
  
  // Replace the priceIds object in the HTML
  content = content.replace(
    /const priceIds = \{[\s\S]*?\};[\s\S]*?\/\/ Store/m,
    priceIdsJS + '\n        \n        // Store'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✓ Updated test-stripe-integration.html');
}

/**
 * Main execution
 */
try {
  updateAlphiniumConfig();
  updateChatInstanceConfig();
  updateUserPodsConfig();
  updateTestHTML();
  
  console.log(`\n✅ All configuration files updated with ${mode.toUpperCase()} mode prices!`);
  console.log('\n💡 Next steps:');
  console.log('   1. Review changes: git diff');
  console.log('   2. Start test server: npm run test:server');
  console.log('   3. Open: http://localhost:3456/test');
  console.log('   4. Test checkout flows\n');
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}
