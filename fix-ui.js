const fs = require('fs');
const path = require('path');
const dir = './public';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Fix lag: Reduce blur and increase opacity for glass cards
  content = content.replace(/bg-white\/5 backdrop-blur-xl/g, 'bg-white/10 backdrop-blur-sm');
  content = content.replace(/backdrop-blur-xl/g, 'backdrop-blur-md');
  content = content.replace(/backdrop-blur-lg/g, 'backdrop-blur-md');
  
  // 2. Fix drawer role badge visibility
  content = content.replace(/bg-\[\#D4AF37\]\/20 text-\[\#D4AF37\] border border-\[\#D4AF37\]\/30/g, 'bg-[#D4AF37] text-[#0F172A] font-bold border-none');
  
  // 3. Fix bottom nav overlapping by increasing body padding
  content = content.replace(/pb-20 md:pb-0/g, 'pb-28 md:pb-0');
  
  // 4. Fix Bottom Nav FAB Layout: balance the items
  const navRegex = /<nav class="md:hidden[^>]+>([\s\S]*?)<\/nav>/g;
  content = content.replace(navRegex, (match, inner) => {
    // If it already has 5 items or is missing the FAB, skip
    if (inner.includes('master-bank.html') || !inner.includes('form.html')) return match;
    
    // Add master-bank icon to balance the 5-item layout
    const masterBankIcon = `
      <a href="/master-bank.html" class="flex flex-col items-center justify-center w-full h-full text-white/50 hover:text-white/80 transition-colors">
        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
      </a>`;
      
    // Insert it before the closing div of the flex container
    const updatedInner = inner.replace(/<\/div>\s*$/, masterBankIcon + '\n    </div>');
    return match.replace(inner, updatedInner);
  });
  
  fs.writeFileSync(filePath, content);
});

console.log('Mobile UI fixes applied successfully.');
