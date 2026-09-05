const fs = require('fs');

const files = [
  './tutorial-video/compositions/beat-02-verify.html',
  './tutorial-video/compositions/beat-03-skills.html'
];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove the div based on id="subtitle-box"
  content = content.replace(/<div[^>]*id="subtitle-box"[^>]*>.*?<\/div>\n?/g, '');
  
  // Remove CSS block for .subtitle-container
  content = content.replace(/\.subtitle-container\s*{[^}]*}/g, '');
  
  // Remove any line containing #subtitle-box
  const lines = content.split('\n');
  const filteredLines = lines.filter(line => !line.includes('#subtitle-box'));
  
  fs.writeFileSync(filePath, filteredLines.join('\n'), 'utf8');
});
console.log('Removed from remaining files.');
