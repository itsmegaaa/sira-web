const fs = require('fs');

// 1. Fix laporan.html
let laporan = fs.readFileSync('public/laporan.html', 'utf8');
const bankIcon = `
      <a href="/master-bank.html" class="flex flex-col items-center justify-center w-full h-full text-white/50 hover:text-white/80 transition-colors">
        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
      </a>`;
if (!laporan.includes('master-bank.html" class="flex flex-col')) {
    laporan = laporan.replace(/<\/div>\s*<\/nav>/, bankIcon + '\n    </div>\n  </nav>');
    fs.writeFileSync('public/laporan.html', laporan);
}

// 2. Fix log.html
let logHtml = fs.readFileSync('public/log.html', 'utf8');
if (!logHtml.includes('<nav')) {
    const navCode = `
  <!-- Bottom Navigation (Mobile) -->
  <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F172A]/90 backdrop-blur-md border-t border-white/10 z-30 pb-safe">
    <div class="flex justify-around items-center h-16">
      <a href="/home.html" class="flex flex-col items-center justify-center w-full h-full text-white/50 hover:text-white/80 transition-colors">
        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
      </a>
      <a href="/laporan.html?tahun=2024" class="flex flex-col items-center justify-center w-full h-full text-white/50 hover:text-white/80 transition-colors" id="navLaporanLink">
        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
      </a>
      <div class="w-full flex justify-center relative">
        <a href="/form.html" class="absolute -top-5 w-14 h-14 bg-[#D4AF37] rounded-full flex items-center justify-center shadow-lg shadow-[#D4AF37]/30 text-[#0F172A] hover:scale-105 transition-transform border-4 border-[#0F172A]">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        </a>
      </div>
      <a href="/log.html" class="flex flex-col items-center justify-center w-full h-full text-[#D4AF37] relative">
        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        <div class="absolute bottom-1 w-1 h-1 rounded-full bg-[#D4AF37]"></div>
      </a>
      <a href="/master-bank.html" class="flex flex-col items-center justify-center w-full h-full text-white/50 hover:text-white/80 transition-colors">
        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
      </a>
    </div>
  </nav>
`;
    logHtml = logHtml.replace('</body>', navCode + '\n</body>');
    fs.writeFileSync('public/log.html', logHtml);
}
