const fs = require('fs');
const path = require('path');

const dir = 'public-administration/video-en/compositions';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace colors
  content = content.replace(/#2563eb/gi, '#0f766e');
  content = content.replace(/#1E3A5F/gi, '#0f766e');
  
  // Branding terminology
  content = content.replace(/Corporate Talent Portal/g, 'Ministry of Public Administration');
  content = content.replace(/Corporate Multinational Group LTD/g, 'Ministry of Public Administration');
  content = content.replace(/Demo for Multi-subsidiary talent management/g, 'Demo for Government Agency talent management');
  content = content.replace(/Subsidiaries/g, 'Agencies');
  content = content.replace(/subsidiaries/g, 'agencies');
  content = content.replace(/Subsidiary/g, 'Agency');
  content = content.replace(/subsidiary/g, 'agency');

  // Fix beat IDs since we shifted them down by 1
  if (f === 'beat-03-skill-gap.html') {
    content = content.replace(/beat-04/g, 'beat-03');
  } else if (f === 'beat-04-audit.html') {
    content = content.replace(/beat-05/g, 'beat-04');
  } else if (f === 'beat-05-outro.html') {
    content = content.replace(/beat-06/g, 'beat-05');
  }

  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Beats refactored.');
