const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');

const ROOT_DIR = path.resolve(__dirname, '..');

const ENGLISH_PAGES = [
  'index.html',
  'entities.html',
  'skill-gap.html',
  'jobs-applications.html',
  'general-report.html',
  'users-management.html',
  'activity-logs.html',
  'report-recipients.html',
  'notification-preferences.html',
  'tenant-branding.html',
  'supported-countries.html'
];

const PAGES_WITH_DYNAMIC_STRINGS = [
  'entities.html',
  'skill-gap.html',
  'jobs-applications.html',
  'general-report.html',
  'users-management.html',
  'report-recipients.html',
  'notification-preferences.html',
  'tenant-branding.html',
  'supported-countries.html'
];

describe('English Source Integrity (Task 3)', () => {
  describe('File existence and basic structure', () => {
    for (const pageName of ENGLISH_PAGES) {
      it(`${pageName} exists and has valid basic HTML shell`, () => {
        const filePath = path.join(ROOT_DIR, pageName);
        assert.ok(fs.existsSync(filePath), `File ${pageName} should exist in root directory`);

        const content = fs.readFileSync(filePath, 'utf-8');
        assert.ok(content.includes('<!DOCTYPE html>'), `${pageName} must have DOCTYPE`);
        assert.ok(content.includes('<html lang="en">'), `${pageName} must have <html lang="en">`);
        assert.ok(content.includes('</html>'), `${pageName} must have closing </html>`);
        assert.ok(content.includes('<head>'), `${pageName} must have <head>`);
        assert.ok(content.includes('</head>'), `${pageName} must have </head>`);
        assert.ok(content.includes('<body>'), `${pageName} must have <body>`);
        assert.ok(content.includes('</body>'), `${pageName} must have </body>`);
        assert.ok(!content.includes('</html>tml>'), `${pageName} must not contain malformed trailing tags`);
      });
    }
  });

  describe('Language toggle markup', () => {
    for (const pageName of ENGLISH_PAGES) {
      it(`${pageName} contains valid language toggle in .sidebar-foot`, () => {
        const filePath = path.join(ROOT_DIR, pageName);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Check .sidebar-foot exists
        assert.ok(content.includes('sidebar-foot'), `${pageName} must have .sidebar-foot`);

        // Check .lang-toggle exists with correct attributes
        assert.ok(
          content.includes('<div class="lang-toggle" role="group" aria-label="Language">') ||
          content.includes('class="lang-toggle"'),
          `${pageName} must contain .lang-toggle`
        );

        // Check EN link
        const enPattern = new RegExp(`<a class="[^"]*lang-opt[^"]*is-active[^"]*" hreflang="en" href="${pageName}">EN<\\/a>`);
        assert.match(content, enPattern, `${pageName} must have active EN link pointing to ${pageName}`);

        // Check FR link
        const frPattern = new RegExp(`<a class="[^"]*lang-opt[^"]*" hreflang="fr" href="fr/${pageName}">FR<\\/a>`);
        assert.match(content, frPattern, `${pageName} must have FR link pointing to fr/${pageName}`);

        // Check ES link
        const esPattern = new RegExp(`<a class="[^"]*lang-opt[^"]*" hreflang="es" href="es/${pageName}">ES<\\/a>`);
        assert.match(content, esPattern, `${pageName} must have ES link pointing to es/${pageName}`);
      });
    }
  });

  describe('Language toggle CSS styling', () => {
    for (const pageName of ENGLISH_PAGES) {
      it(`${pageName} contains CSS rules for .lang-toggle and .lang-opt in <style>`, () => {
        const filePath = path.join(ROOT_DIR, pageName);
        const content = fs.readFileSync(filePath, 'utf-8');

        assert.ok(content.includes('.lang-toggle'), `${pageName} must have .lang-toggle CSS`);
        assert.ok(content.includes('.lang-opt'), `${pageName} must have .lang-opt CSS`);
        assert.ok(content.includes('.lang-opt.is-active'), `${pageName} must have .lang-opt.is-active CSS`);
      });
    }
  });

  describe('Dynamic STR blocks and script validity', () => {
    for (const pageName of PAGES_WITH_DYNAMIC_STRINGS) {
      it(`${pageName} contains /* i18n:STR:start */ block and fmt() helper`, () => {
        const filePath = path.join(ROOT_DIR, pageName);
        const content = fs.readFileSync(filePath, 'utf-8');

        assert.ok(
          content.includes('/* i18n:STR:start */'),
          `${pageName} must contain /* i18n:STR:start */ block`
        );
        assert.ok(
          content.includes('/* i18n:STR:end */'),
          `${pageName} must contain /* i18n:STR:end */ block`
        );
        assert.ok(
          content.includes('const STR = {'),
          `${pageName} must declare const STR = { ... }`
        );
        assert.ok(
          content.includes('const fmt ='),
          `${pageName} must declare const fmt helper`
        );
      });
    }

    for (const pageName of ENGLISH_PAGES) {
      it(`${pageName} all inline scripts parse without syntax errors`, () => {
        const filePath = path.join(ROOT_DIR, pageName);
        const content = fs.readFileSync(filePath, 'utf-8');

        const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
        let match;
        let scriptCount = 0;

        while ((match = scriptRegex.exec(content)) !== null) {
          const attrs = match[1];
          const code = match[2];

          // Skip external script tags or module imports with URLs that node VM can't resolve directly
          if (attrs.includes('src=') || attrs.includes('type="module"')) {
            continue;
          }

          if (code.trim().length > 0) {
            scriptCount++;
            assert.doesNotThrow(() => {
              new vm.Script(code, { filename: `${pageName}-inline-script-${scriptCount}.js` });
            }, `Inline script in ${pageName} must parse without syntax errors`);
          }
        }
      });
    }
  });

  describe('index.html Hyperframes data-hf-id preservation', () => {
    it('index.html preserves data-hf-id attributes', () => {
      const filePath = path.join(ROOT_DIR, 'index.html');
      const content = fs.readFileSync(filePath, 'utf-8');

      const matches = content.match(/data-hf-id="[^"]+"/g);
      assert.ok(matches && matches.length >= 300, `index.html should retain its data-hf-id attributes (found ${matches ? matches.length : 0})`);
    });
  });
});
