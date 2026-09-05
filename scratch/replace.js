const fs = require('fs');
const path = require('path');

const dir = 'public-administration/en';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');

  // Global replacements
  content = content.replace(/Corporate Talent Portal/g, 'Ministry of Public Administration');
  content = content.replace(/Corporate Multinational Group LTD/g, 'Ministry of Public Administration');
  content = content.replace(/entities\.html/g, 'agencies.html');
  content = content.replace(/Subsidiaries/g, 'Agencies');
  content = content.replace(/subsidiaries/g, 'agencies');
  content = content.replace(/Subsidiary/g, 'Agency');
  content = content.replace(/subsidiary/g, 'agency');
  content = content.replace(/--accent: #1E3A5F;/g, '--accent: #0f766e;');
  content = content.replace(/--accent-hover: #172E4C;/g, '--accent-hover: #115e59;');
  
  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Global replacements completed.');
