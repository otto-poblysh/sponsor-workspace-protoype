const fs = require('fs');
const path = require('path');

const dir = 'public-administration/en';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/Agencies & Business Units/g, 'Government Agencies');
  content = content.replace(/Agency & Business Units/g, 'Government Agency');
  content = content.replace(/Ministry of Public Administration Talent Portal/g, 'Ministry of Public Administration');
  
  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Refinement replacements completed.');
