const fs = require('fs');
const path = require('path');

const dir = 'public-administration/en';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Regex to remove the list item containing integrations.html
  content = content.replace(/.*href="integrations\.html".*\n?/g, '');
  
  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Removed integrations.html links.');
