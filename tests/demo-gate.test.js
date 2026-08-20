const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { rewriteGateScriptSrc, DEFAULT_PROTOTYPE_PAGES } = require('../tools/build-i18n.js');

const ROOT = path.resolve(__dirname, '..');

describe('demo access gate', () => {
  it('passcodes.json has five unique 6-digit codes', () => {
    const payload = JSON.parse(fs.readFileSync(path.join(ROOT, 'passcodes.json'), 'utf8'));
    assert.ok(Array.isArray(payload.codes));
    assert.equal(payload.codes.length, 5);
    const unique = new Set(payload.codes);
    assert.equal(unique.size, 5);
    for (const code of payload.codes) {
      assert.match(String(code), /^\d{6}$/);
    }
  });

  it('gate.js ships the same fallback codes as passcodes.json', () => {
    const payload = JSON.parse(fs.readFileSync(path.join(ROOT, 'passcodes.json'), 'utf8'));
    const gate = fs.readFileSync(path.join(ROOT, 'gate.js'), 'utf8');
    for (const code of payload.codes) {
      assert.ok(gate.includes(`'${code}'`), `gate.js should include fallback ${code}`);
    }
  });

  it('English source pages load gate.js', () => {
    for (const page of DEFAULT_PROTOTYPE_PAGES) {
      const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
      assert.ok(
        html.includes('<script src="gate.js"></script>'),
        `${page} should include the demo gate script`
      );
    }
  });

  it('rewrites gate.js src for a generated locale page', () => {
    const html = '<script src="gate.js"></script>';
    const outPage = path.join(ROOT, 'fr', 'index.html');
    const rewritten = rewriteGateScriptSrc(html, outPage, ROOT);
    assert.equal(rewritten, '<script src="../gate.js"></script>');
  });

  it('adds the lock class when the session is locked', () => {
    const classes = new Set();
    const documentElement = {
      classList: {
        add: (name) => classes.add(name),
        remove: (name) => classes.delete(name)
      },
      appendChild() {}
    };
    const context = {
      sessionStorage: {
        getItem: () => null,
        setItem() {}
      },
      document: {
        documentElement,
        head: documentElement,
        body: null,
        currentScript: { src: 'file:///tmp/gate.js' },
        createElement: () => ({
          setAttribute() {},
          textContent: '',
          parentNode: null
        }),
        addEventListener() {}
      },
      location: { protocol: 'file:' }
    };
    vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'gate.js'), 'utf8'), context);
    assert.ok(classes.has('demo-gated'));
  });

  it('does not lock the page after a successful session unlock', () => {
    const classes = new Set();
    const context = {
      sessionStorage: {
        getItem: (key) => (key === 'icubefarm-demo-unlocked' ? '1' : null),
        setItem() {}
      },
      document: {
        documentElement: {
          classList: {
            add: (name) => classes.add(name),
            remove: (name) => classes.delete(name)
          }
        },
        createElement() {
          throw new Error('gate should not mount when already unlocked');
        }
      },
      location: { protocol: 'file:' }
    };
    vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'gate.js'), 'utf8'), context);
    assert.equal(classes.has('demo-gated'), false);
  });
});
