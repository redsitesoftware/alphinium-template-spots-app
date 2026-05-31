#!/usr/bin/env node
/**
 * Update test HTML with real price IDs
 * Merges test and live price IDs into the same HTML file
 */

const fs = require('fs');
const path = require('path');

const mode = process.argv[2];

if (!mode || !['test', 'live'].includes(mode)) {
  console.error('Usage: node scripts/update-test-html.js <test|live>');
  process.exit(1);
}

const pricesFile = path.join(__dirname, `../.stripe-prices-${mode}.json`);

if (!fs.existsSync(pricesFile)) {
  console.error(`❌ Price file not found: ${pricesFile}`);
  console.error(`   Run: npm run setup:stripe:${mode}`);
  process.exit(1);
}

const newPrices = JSON.parse(fs.readFileSync(pricesFile, 'utf8'));
const htmlFile = path.join(__dirname, '../test-stripe-integration.html');
let html = fs.readFileSync(htmlFile, 'utf8');

// Extract existing priceIds object
const priceIdsMatch = html.match(/const priceIds = (\{[\s\S]*?\});[\s\S]*?\/\/ Store/);
if (!priceIdsMatch) {
  console.error('❌ Could not find priceIds object in HTML');
  process.exit(1);
}

let existingPriceIds;
try {
  // Clean up the JSON for parsing
  const jsonStr = priceIdsMatch[1]
    .replace(/(\w+):/g, '"$1":')  // Quote keys
    .replace(/'/g, '"');           // Single to double quotes
  existingPriceIds = JSON.parse(jsonStr);
} catch (e) {
  console.error('❌ Could not parse existing priceIds:', e.message);
  console.error('   Creating new structure...');
  existingPriceIds = { test: {}, live: {} };
}

// Update the specific mode
existingPriceIds[mode] = newPrices;

// Convert to formatted JavaScript
const jsCode = `const priceIds = ${JSON.stringify(existingPriceIds, null, 12)};`;

// Replace in HTML
html = html.replace(/const priceIds = \{[\s\S]*?\};[\s\S]*?\/\/ Store/, jsCode + '\n        \n        // Store');

fs.writeFileSync(htmlFile, html);
console.log(`✅ Updated test-stripe-integration.html with ${mode.toUpperCase()} mode prices`);
console.log(`   Test mode: ${existingPriceIds.test.alphinium ? '✅ Configured' : '⚠️ Not configured'}`);
console.log(`   Live mode: ${existingPriceIds.live.alphinium ? '✅ Configured' : '⚠️ Not configured'}`);
