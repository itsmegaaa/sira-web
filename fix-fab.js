const fs = require('fs');
const path = require('path');
const dir = './public';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Hide fabContainer on mobile (because mobile uses bottom nav)
  content = content.replace(/class="fixed bottom-24 right-6 md:bottom-8 z-40 flex flex-col items-end gap-3" id="fabContainer"/g, 'class="hidden md:flex fixed bottom-24 right-6 md:bottom-8 z-40 flex-col items-end gap-3" id="fabContainer"');
  
  fs.writeFileSync(filePath, content);
});

console.log('FAB mobile visibility fixed.');
