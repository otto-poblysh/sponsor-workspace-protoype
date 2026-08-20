const fs = require('fs');
const file = 'tools/build-video-i18n.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'out = translateSubtitles(out, video, { strict: true }).html;',
  'out = translateSubtitles(out, video, { strict: true }).html;\n\n    if (locale === \'fr\' && file === \'beat-00-intro.html\') {\n      out = out.replace(/<\\/head>/, \'<style>#title { font-size: 22px !important; }</style></head>\');\n    }'
);
fs.writeFileSync(file, content, 'utf8');
