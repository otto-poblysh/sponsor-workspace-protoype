const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const filesOutput = execSync('find . -name "*.html" -exec grep -l "subtitle-container" {} +').toString().trim();
if (!filesOutput) {
  console.log("No files with subtitle-container found.");
  process.exit(0);
}

const files = filesOutput.split('\n').filter(f => f && !f.includes('tests/'));

let count = 0;
files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove the div
  content = content.replace(/<div[^>]*id="subtitle-container"[^>]*>.*?<\/div>\n?/g, '');
  
  // Remove any line containing #subtitle-container
  const lines = content.split('\n');
  const filteredLines = lines.filter(line => !line.includes('#subtitle-container'));
  
  fs.writeFileSync(filePath, filteredLines.join('\n'), 'utf8');
  count++;
});

console.log(`Removed captions from ${count} files.`);
