'use strict';
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

const PRIVACY_HTML = `<!DOCTYPE html><html><head><title>Privacy Policy - Trivia Night</title></head><body>
<h1>Privacy Policy</h1><p>Trivia Night collects your name and email via Facebook Login to personalise your game experience. We do not sell your data. Contact: zx10r06@live.com.au</p>
</body></html>`;

const TOS_HTML = `<!DOCTYPE html><html><head><title>Terms of Service - Trivia Night</title></head><body>
<h1>Terms of Service</h1><p>By using Trivia Night you agree to play fair and have fun. This is a personal project. No warranties. Contact: zx10r06@live.com.au</p>
</body></html>`;

const DATA_DELETION_HTML = `<!DOCTYPE html><html><head><title>Data Deletion - Trivia Night</title></head><body>
<h1>Data Deletion Instructions</h1>
<p>To request deletion of your data from Trivia Night:</p>
<ol>
<li>Email <a href="mailto:zx10r06@live.com.au">zx10r06@live.com.au</a> with the subject "Data Deletion Request"</li>
<li>Include the email address or Facebook name associated with your account</li>
<li>We will delete your account and all associated data within 30 days and confirm by email</li>
</ol>
<p>Alternatively, you can disconnect Trivia Night from your Facebook account at any time via Facebook Settings &rarr; Apps and Websites.</p>
</body></html>`;

module.exports = () => {
  return async (ctx, next) => {
    if (ctx.method === 'GET' && ctx.path === '/') {
      const indexPath = join(process.cwd(), 'public', 'index.html');
      if (existsSync(indexPath)) {
        ctx.type = 'text/html';
        ctx.body = readFileSync(indexPath, 'utf8');
        return;
      }
    }
    if (ctx.method === 'GET' && ctx.path === '/privacy') {
      ctx.type = 'text/html';
      ctx.body = PRIVACY_HTML;
      return;
    }
    if (ctx.method === 'GET' && ctx.path === '/tos') {
      ctx.type = 'text/html';
      ctx.body = TOS_HTML;
      return;
    }
    if (ctx.method === 'GET' && (ctx.path === '/data-deletion' || ctx.path === '/data-deletion-instructions')) {
      ctx.type = 'text/html';
      ctx.body = DATA_DELETION_HTML;
      return;
    }
    await next();
  };
};
