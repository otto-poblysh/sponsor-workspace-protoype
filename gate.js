/**
 * Demo access cover. Not real security — keeps a shared URL from
 * opening the prototype unless a salesperson shares a passcode.
 */
(function () {
  var STORAGE_KEY = 'icubefarm-demo-unlocked';
  var FALLBACK_CODES = ['482917', '736048', '159263', '604851', '927314'];

  function alreadyUnlocked() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (err) {
      return false;
    }
  }

  function rememberUnlock() {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch (err) {
      /* ignore quota / private-mode failures */
    }
  }

  if (alreadyUnlocked()) {
    return;
  }

  document.documentElement.classList.add('demo-gated');

  var freeze = document.createElement('style');
  freeze.setAttribute('data-demo-gate-freeze', '');
  freeze.textContent = [
    'html.demo-gated body > *:not(#demo-gate-root) { visibility: hidden !important; pointer-events: none !important; }',
    'html.demo-gated body { overflow: hidden; }',
    '#demo-gate-root { visibility: visible !important; pointer-events: auto !important; }'
  ].join('');
  (document.head || document.documentElement).appendChild(freeze);

  function codesFrom(payload) {
    var list = payload && Array.isArray(payload.codes) ? payload.codes : [];
    return list.map(function (code) {
      return String(code).replace(/\D/g, '');
    }).filter(function (code) {
      return code.length === 6;
    });
  }

  function loadCodes(done) {
    var script = document.currentScript;
    var src = script && script.src ? script.src : '';
    var jsonUrl = src ? src.replace(/gate\.js(?:\?.*)?$/i, 'passcodes.json') : 'passcodes.json';

    function finish(codes) {
      done(codes.length ? codes : FALLBACK_CODES);
    }

    if (typeof fetch !== 'function' || location.protocol === 'file:') {
      finish(FALLBACK_CODES);
      return;
    }

    fetch(jsonUrl, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('passcodes missing');
        }
        return res.json();
      })
      .then(function (payload) {
        finish(codesFrom(payload));
      })
      .catch(function () {
        finish(FALLBACK_CODES);
      });
  }

  function unlock(root) {
    rememberUnlock();
    document.documentElement.classList.remove('demo-gated');
    if (root && root.parentNode) {
      root.parentNode.removeChild(root);
    }
    if (freeze.parentNode) {
      freeze.parentNode.removeChild(freeze);
    }
  }

  function mount(codes) {
    var allowed = {};
    codes.forEach(function (code) {
      allowed[code] = true;
    });

    var root = document.createElement('div');
    root.id = 'demo-gate-root';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'demo-gate-title');
    root.innerHTML =
      '<style>' +
      '#demo-gate-root{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:#f7f6f3;font-family:"Geist Sans","SF Pro Display",-apple-system,BlinkMacSystemFont,sans-serif;color:#111}' +
      '#demo-gate-root .demo-gate-card{width:100%;max-width:420px;background:#fff;border:1px solid #eaeaea;border-radius:14px;padding:32px 28px 28px;box-shadow:0 8px 32px rgba(0,0,0,.06)}' +
      '#demo-gate-root .demo-gate-brand{display:flex;align-items:center;gap:12px;margin-bottom:28px}' +
      '#demo-gate-root .demo-gate-mark{width:36px;height:36px;border-radius:6px;background:#1E3A5F;color:#fff;display:grid;place-items:center;flex-shrink:0}' +
      '#demo-gate-root .demo-gate-mark svg{display:block}' +
      '#demo-gate-root .demo-gate-name{font-size:15px;font-weight:600;letter-spacing:-.01em;line-height:1.2}' +
      '#demo-gate-root .demo-gate-sub{font-size:12px;color:#787774;margin-top:2px}' +
      '#demo-gate-root h1{font-size:22px;font-weight:600;letter-spacing:-.02em;margin:0 0 8px}' +
      '#demo-gate-root .demo-gate-copy{font-size:14px;color:#787774;margin:0 0 24px;line-height:1.5}' +
      '#demo-gate-root .demo-gate-pins{display:flex;gap:8px;justify-content:space-between;margin-bottom:12px}' +
      '#demo-gate-root .demo-gate-pins input{width:48px;height:56px;text-align:center;font-size:22px;font-weight:600;font-family:ui-monospace,"Geist Mono",monospace;border:1px solid #eaeaea;border-radius:10px;background:#f9f9f8;color:#111;outline:none;caret-color:#1E3A5F}' +
      '#demo-gate-root .demo-gate-pins input:focus{border-color:#1E3A5F;background:#fff;box-shadow:0 0 0 3px rgba(30,58,95,.12)}' +
      '#demo-gate-root .demo-gate-error{min-height:20px;font-size:13px;color:#9f2f2d;margin:0 0 16px}' +
      '#demo-gate-root button{width:100%;padding:12px 16px;border:0;border-radius:6px;background:#1E3A5F;color:#fff;font:inherit;font-size:14px;font-weight:600;cursor:pointer}' +
      '#demo-gate-root button:hover{background:#172E4C}' +
      '#demo-gate-root button:active{transform:scale(.98)}' +
      '@media (max-width:480px){#demo-gate-root .demo-gate-pins input{width:40px;height:48px;font-size:18px}}' +
      '</style>' +
      '<form class="demo-gate-card" autocomplete="off">' +
      '<div class="demo-gate-brand">' +
      '<div class="demo-gate-mark" aria-hidden="true">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none">' +
      '<rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '</svg></div>' +
      '<div><div class="demo-gate-name">iCUBEFARM</div>' +
      '<div class="demo-gate-sub">Private preview</div></div></div>' +
      '<h1 id="demo-gate-title">Enter access code</h1>' +
      '<p class="demo-gate-copy">This prototype is for invited reviewers. Ask your iCUBEFARM contact for a 6-digit code.</p>' +
      '<div class="demo-gate-pins" role="group" aria-label="6-digit access code">' +
      '<input inputmode="numeric" maxlength="1" aria-label="Digit 1" autocomplete="one-time-code">' +
      '<input inputmode="numeric" maxlength="1" aria-label="Digit 2" autocomplete="off">' +
      '<input inputmode="numeric" maxlength="1" aria-label="Digit 3" autocomplete="off">' +
      '<input inputmode="numeric" maxlength="1" aria-label="Digit 4" autocomplete="off">' +
      '<input inputmode="numeric" maxlength="1" aria-label="Digit 5" autocomplete="off">' +
      '<input inputmode="numeric" maxlength="1" aria-label="Digit 6" autocomplete="off">' +
      '</div>' +
      '<p class="demo-gate-error" role="status" aria-live="polite"></p>' +
      '<button type="submit">Continue</button>' +
      '</form>';

    var host = document.body || document.documentElement;
    host.appendChild(root);

    var form = root.querySelector('form');
    var inputs = Array.prototype.slice.call(root.querySelectorAll('.demo-gate-pins input'));
    var errorEl = root.querySelector('.demo-gate-error');

    function currentCode() {
      return inputs.map(function (input) {
        return input.value.replace(/\D/g, '');
      }).join('');
    }

    function showError(message) {
      errorEl.textContent = message;
      inputs.forEach(function (input) {
        input.value = '';
      });
      inputs[0].focus();
    }

    function submitCode() {
      var code = currentCode();
      if (code.length !== 6) {
        showError('Enter all 6 digits.');
        return;
      }
      if (!allowed[code]) {
        showError('That code is not valid.');
        return;
      }
      unlock(root);
    }

    inputs.forEach(function (input, index) {
      input.addEventListener('input', function () {
        var digit = input.value.replace(/\D/g, '').slice(-1);
        input.value = digit;
        errorEl.textContent = '';
        if (digit && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
        if (currentCode().length === 6) {
          submitCode();
        }
      });

      input.addEventListener('keydown', function (event) {
        if (event.key === 'Backspace' && !input.value && index > 0) {
          inputs[index - 1].focus();
        }
      });

      input.addEventListener('paste', function (event) {
        event.preventDefault();
        var pasted = (event.clipboardData || window.clipboardData).getData('text') || '';
        var digits = pasted.replace(/\D/g, '').slice(0, 6).split('');
        inputs.forEach(function (pin, pinIndex) {
          pin.value = digits[pinIndex] || '';
        });
        errorEl.textContent = '';
        if (digits.length === 6) {
          submitCode();
        } else if (digits.length > 0) {
          inputs[Math.min(digits.length, inputs.length - 1)].focus();
        }
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      submitCode();
    });

    inputs[0].focus();
  }

  function start() {
    loadCodes(function (codes) {
      if (!document.body) {
        document.addEventListener('DOMContentLoaded', function () {
          mount(codes);
        });
        return;
      }
      mount(codes);
    });
  }

  start();
})();
