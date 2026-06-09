const fs = require('fs');
const path = require('path');
const dir = './public';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('<style>') && content.includes('@apply')) {
    content = content.replace('<style>', '<style type="text/tailwindcss">');
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}`);
  }
});
