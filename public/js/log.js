import { db, collection, query, orderBy, limit, onSnapshot } from './firebase-config.js';
import { showToast, escapeHtml } from './utils.js';

const skeletonLoading = document.getElementById('skeletonLoading');
const dataContainer = document.getElementById('dataContainer');
const emptyState = document.getElementById('emptyState');

let unsubscribe = null;

document.addEventListener('authReady', () => {
  if (window.currentUser.role !== 'ADMIN') {
    showToast('Akses ditolak', 'error');
    setTimeout(() => window.history.back(), 1000);
    return;
  }
  loadLogs();
});

function getAksiStyle(aksi) {
  switch (aksi) {
    case 'TAMBAH': 
      return { 
        border: 'border-l-4 border-l-green-500', 
        bg: 'bg-green-500/20', 
        text: 'text-green-400',
        icon: '<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>'
      };
    case 'EDIT': 
      return { 
        border: 'border-l-4 border-l-blue-500', 
        bg: 'bg-blue-500/20', 
        text: 'text-blue-400',
        icon: '<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>'
      };
    case 'HAPUS': 
      return { 
        border: 'border-l-4 border-l-red-500', 
        bg: 'bg-red-500/20', 
        text: 'text-red-400',
        icon: '<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>'
      };
    case 'SYNC': 
      return { 
        border: 'border-l-4 border-l-teal-500', 
        bg: 'bg-teal-500/20', 
        text: 'text-teal-400',
        icon: '<svg class="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>'
      };
    default:
      return { 
        border: 'border-l-4 border-l-gray-500', 
        bg: 'bg-gray-500/20', 
        text: 'text-gray-400',
        icon: '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
      };
  }
}

function loadLogs() {
  const q = query(collection(db, 'logs_laporan'), orderBy('waktu', 'desc'), limit(100));
  
  unsubscribe = onSnapshot(q, (snapshot) => {
    skeletonLoading.classList.add('hidden');
    
    if (snapshot.empty) {
      emptyState.classList.remove('hidden');
      emptyState.classList.add('flex');
      dataContainer.classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    dataContainer.classList.remove('hidden');
    dataContainer.classList.add('flex');
    dataContainer.innerHTML = '';

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const style = getAksiStyle(data.aksi || 'INFO');
      
      let waktuStr = '';
      if (data.waktu && data.waktu.toDate) {
        const d = data.waktu.toDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = months[d.getMonth()];
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        waktuStr = `${dd} ${mm} ${yyyy} • ${hh}:${min}`;
      }

      const div = document.createElement('div');
      div.className = `glass-card p-4 ${style.border} overflow-hidden`;
      
      div.innerHTML = `
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full ${style.bg} flex items-center justify-center shrink-0">
            ${style.icon}
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold ${style.text} tracking-wider">${data.aksi || 'INFO'}</span>
              <span class="text-xs text-white/40">${waktuStr}</span>
            </div>
          </div>
        </div>
        <p class="text-sm text-white/80 mb-3 whitespace-pre-line leading-relaxed">${escapeHtml(data.detail || '-')}</p>
        <div class="border-t border-white/5 pt-2 mt-2">
          <p class="text-xs text-white/40 truncate">oleh: ${escapeHtml(data.oleh || 'Sistem')}</p>
        </div>
      `;
      
      dataContainer.appendChild(div);
    });
  }, (error) => {
    console.error("Error loading logs", error);
    showToast('Gagal memuat riwayat aktivitas', 'error');
  });
}

window.addEventListener('beforeunload', () => {
  if (unsubscribe) unsubscribe();
});
