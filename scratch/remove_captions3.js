const fs = require('fs');
const { execSync } = require('child_process');

const files = [
  './tutorial-video/compositions/beat-02-verify.html',
  './tutorial-video/compositions/beat-03-skills.html'
];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove the div based on id="subtitle-box" using [\s\S]*?
  content = content.replace(/<div[^>]*id="subtitle-box"[^>]*>[\s\S]*?<\/div>\n?/g, '');
  
  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Fixed multiline div removal.');
