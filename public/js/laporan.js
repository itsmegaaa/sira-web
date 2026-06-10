import { auth, db, collection, getDocs, doc, getDoc, query, orderBy, limit, startAfter, where, deleteDoc } from './firebase-config.js';
import { debounce, formatTanggalTampil, showToast, catatAktivitas, escapeHtml } from './utils.js';

// Get Query Params
const urlParams = new URLSearchParams(window.location.search);
const tahun = urlParams.get('tahun') || new Date().getFullYear().toString();

// DOM Elements
const appBarTitle = document.getElementById('appBarTitle');
const searchInput = document.getElementById('searchInput');
const filterBtn = document.getElementById('filterBtn');
const filterModal = document.getElementById('filterModal');
const filterOptionsContainer = document.getElementById('filterOptions');
const closeFilterBtn = document.getElementById('closeFilterBtn');
const summaryText = document.getElementById('summaryText');
const listContainer = document.getElementById('listContainer');
const emptyState = document.getElementById('emptyState');
const btnLoadMore = document.getElementById('btnLoadMore');
const btnSyncAppBar = document.getElementById('btnSyncAppBar');

const fabMain = document.getElementById('fabMain');
const fabIcon = document.getElementById('fabIcon');
const fabAdd = document.getElementById('fabAdd');
const fabLog = document.getElementById('fabLog');
const mobileFabAdd = document.getElementById('mobileFabAdd');

const deleteDialog = document.getElementById('deleteDialog');
const btnCancelDelete = document.getElementById('btnCancelDelete');
const btnConfirmDelete = document.getElementById('btnConfirmDelete');

let currentFilter = 'SEMUA';
let searchTerm = '';
let lastDocCursor = null;
let hasMore = true;
const PAGE_SIZE = 50;

let itemToDelete = null; // { id, namaDebitur, cardEl }

const filterList = ['SEMUA', 'PROSES', 'SELESAI', 'BATAL', 'PENDING', 'BERMASALAH'];

document.addEventListener('authReady', () => {
  initUI();
  initListeners();
  loadData(true);
});

function initUI() {
  appBarTitle.textContent = `LAPORAN ${tahun}`;
  
  // Set link for ADD buttons
  const addUrl = `/form.html?tahun=${tahun}`;
  fabAdd.href = addUrl;
  mobileFabAdd.href = addUrl;
  
  if (window.currentUser.role === 'ADMIN') {
    btnSyncAppBar.classList.remove('hidden');
  }

  // Render filter options
  filterOptionsContainer.innerHTML = filterList.map(opt => `
    <button class="filter-opt w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 flex items-center justify-between ${currentFilter === opt ? 'bg-white/10 text-[#D4AF37]' : 'text-white'}" data-val="${opt}">
      ${opt}
      ${currentFilter === opt ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' : ''}
    </button>
  `).join('');
}

function initListeners() {
  // Search
  searchInput.addEventListener('input', debounce((e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    loadData(true);
  }, 300));

  // Filter Modal
  filterBtn.addEventListener('click', () => {
    filterModal.classList.remove('hidden');
    // For mobile slide up
    const panel = filterModal.querySelector('.filter-panel');
    setTimeout(() => {
      panel.classList.remove('translate-y-full');
    }, 10);
  });

  const closeFilter = () => {
    const panel = filterModal.querySelector('.filter-panel');
    panel.classList.add('translate-y-full');
    setTimeout(() => {
      filterModal.classList.add('hidden');
    }, 300);
  };

  closeFilterBtn.addEventListener('click', closeFilter);
  filterModal.querySelector('.modal-backdrop').addEventListener('click', closeFilter);

  // Filter Options Click
  filterOptionsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-opt');
    if (btn) {
      currentFilter = btn.dataset.val;
      initUI(); // re-render filter options
      closeFilter();
      loadData(true);
    }
  });

  // Load More
  btnLoadMore.addEventListener('click', () => loadData(false));

  // FAB
  fabMain.addEventListener('click', () => {
    const isOpen = fabIcon.style.transform === 'rotate(45deg)';
    if (isOpen) {
      fabIcon.style.transform = 'rotate(0deg)';
      fabAdd.classList.add('hidden');
      fabLog.classList.add('hidden');
    } else {
      fabIcon.style.transform = 'rotate(45deg)';
      fabAdd.classList.remove('hidden');
      fabLog.classList.remove('hidden');
    }
  });

  // Delete Dialog
  btnCancelDelete.addEventListener('click', () => {
    deleteDialog.classList.add('hidden');
    // Reset swipe
    if (itemToDelete && itemToDelete.cardEl) {
      const front = itemToDelete.cardEl.querySelector('.swipe-front');
      const behind = itemToDelete.cardEl.querySelector('.swipe-behind');
      if (front) front.style.transform = `translateX(0px)`;
      if (behind) behind.style.opacity = '0';
    }
    itemToDelete = null;
  });

  btnConfirmDelete.addEventListener('click', async () => {
    if (!itemToDelete) return;
    
    try {
      btnConfirmDelete.disabled = true;
      btnConfirmDelete.textContent = 'Menghapus...';
      
      await deleteDoc(doc(db, `laporan_${tahun}`, itemToDelete.id));
      await catatAktivitas('HAPUS', `Hapus laporan ${itemToDelete.namaDebitur} (${itemToDelete.id})`, window.currentUser.email);
      
      showToast('Berkas berhasil dihapus', 'success');
      itemToDelete.cardEl.remove();
      
      // Update summary
      const currentCount = parseInt(summaryText.textContent.match(/\d+/)?.[0] || 0);
      if (currentCount > 0) {
        summaryText.textContent = `Total: ${currentCount - 1} Berkas • ${currentFilter}`;
      }

    } catch (error) {
      console.error(error);
      showToast('Gagal menghapus berkas', 'error');
    } finally {
      btnConfirmDelete.disabled = false;
      btnConfirmDelete.textContent = 'Hapus';
      deleteDialog.classList.add('hidden');
      itemToDelete = null;
    }
  });

  // Sync Btn
  btnSyncAppBar.addEventListener('click', () => {
    showToast('Silakan lakukan sync dari Dashboard', 'info');
  });
}

function getStatusColor(status) {
  switch (status) {
    case 'SELESAI': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'PROSES': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'BATAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'PENDING': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default: return 'bg-pink-500/20 text-pink-400 border-pink-500/30'; // BERMASALAH
  }
}

function renderSla(docData) {
  const status = docData.statusPekerjaan || 'PROSES';
  if (status === 'SELESAI' || status === 'BATAL') return '';

  const batasSla = docData.batasSla;
  if (!batasSla) return '';
  
  // Calculate days left
  const today = new Date();
  today.setHours(0,0,0,0);
  
  let targetDate;
  if (batasSla.toDate) {
    targetDate = batasSla.toDate();
  } else {
    targetDate = new Date(batasSla); // assumes yyyy-mm-dd
  }
  targetDate.setHours(0,0,0,0);

  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `<div class="text-xs font-semibold text-red-400">Overdue ${Math.abs(diffDays)} hari</div>`;
  } else if (diffDays <= 3) {
    return `<div class="text-xs font-semibold text-orange-400">Sisa ${diffDays} hari</div>`;
  } else {
    return `<div class="text-xs font-semibold text-[#D4AF37]">Sisa ${diffDays} hari</div>`;
  }
}

function initSwipeToDelete(cardEl, id, namaDebitur) {
  const front = cardEl.querySelector('.swipe-front');
  const behind = cardEl.querySelector('.swipe-behind');
  let startX = 0;
  let currentX = 0;
  const threshold = 80;

  cardEl.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    front.style.transition = 'none';
    currentX = 0;
  }, {passive: true});

  cardEl.addEventListener('touchmove', (e) => {
    currentX = e.touches[0].clientX - startX;
    if (currentX < 0) { // Only swipe left
      if (currentX < -10 && behind) {
        behind.style.opacity = '1';
      }
      // limit max swipe
      const val = Math.max(currentX, -100);
      front.style.transform = `translateX(${val}px)`;
    }
  }, {passive: true});

  cardEl.addEventListener('touchend', (e) => {
    front.style.transition = 'transform 0.2s ease-out';
    if (currentX < -threshold) {
      front.style.transform = `translateX(-100px)`;
      // Trigger delete dialog
      itemToDelete = { id, namaDebitur, cardEl };
      deleteDialog.classList.remove('hidden');
    } else {
      front.style.transform = `translateX(0px)`;
      if (behind) behind.style.opacity = '0';
    }
  });

  // Desktop hover delete button
  const desktopDelBtn = cardEl.querySelector('.desktop-del-btn');
  if (desktopDelBtn) {
    desktopDelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      itemToDelete = { id, namaDebitur, cardEl };
      deleteDialog.classList.remove('hidden');
    });
  }
}

async function loadData(isRefresh = true) {
  if (isRefresh) {
    listContainer.innerHTML = `
      <div class="skeleton-card mb-3 glass-card p-4 animate-pulse">
        <div class="flex justify-between items-start mb-2"><div class="h-5 bg-white/10 rounded w-2/3"></div><div class="h-5 bg-white/10 rounded w-16"></div></div>
        <div class="h-4 bg-white/10 rounded w-1/2 mb-4"></div>
        <div class="border-t border-white/5 pt-3 flex justify-between"><div class="h-4 bg-white/10 rounded w-1/3"></div><div class="h-4 bg-white/10 rounded w-1/4"></div></div>
      </div>
      <div class="skeleton-card mb-3 glass-card p-4 animate-pulse">
        <div class="flex justify-between items-start mb-2"><div class="h-5 bg-white/10 rounded w-3/4"></div><div class="h-5 bg-white/10 rounded w-16"></div></div>
        <div class="h-4 bg-white/10 rounded w-1/2 mb-4"></div>
        <div class="border-t border-white/5 pt-3 flex justify-between"><div class="h-4 bg-white/10 rounded w-1/3"></div><div class="h-4 bg-white/10 rounded w-1/4"></div></div>
      </div>
    `;
    lastDocCursor = null;
    btnLoadMore.classList.add('hidden');
    emptyState.classList.add('hidden');
    summaryText.textContent = `Memuat...`;
  } else {
    btnLoadMore.textContent = 'Memuat...';
    btnLoadMore.disabled = true;
  }

  try {
    const collRef = collection(db, `laporan_${tahun}`);
    let constraints = [];

    // where() must precede orderBy() for composite index usage
    if (currentFilter !== 'SEMUA') {
      constraints.push(where('statusPekerjaan', '==', currentFilter));
    }

    // Default order
    constraints.push(orderBy('waktuUpdate', 'desc'));

    // When searching, fetch all matching docs so client-side search is comprehensive
    if (!searchTerm) {
      constraints.push(limit(PAGE_SIZE));
    }

    if (lastDocCursor && !searchTerm) {
      constraints.push(startAfter(lastDocCursor));
    }

    const q = query(collRef, ...constraints);
    const snapshot = await getDocs(q);

    if (isRefresh) {
      listContainer.innerHTML = '';
      // Approximate total
      summaryText.textContent = `Total: ${snapshot.size}${snapshot.size === PAGE_SIZE ? '+' : ''} Berkas • ${currentFilter}`;
    }

    let results = [];
    snapshot.forEach(doc => {
      results.push({ id: doc.id, ...doc.data() });
    });

    // Client-side search for namaDebitur, namaBank, noCovernote
    if (searchTerm) {
      results = results.filter(item => {
        const namad = (item.namaDebitur || '').toLowerCase();
        const namab = (item.namaBank || '').toLowerCase();
        const cover = (item.noCovernote || '').toLowerCase();
        return namad.includes(searchTerm) || namab.includes(searchTerm) || cover.includes(searchTerm);
      });
      if (isRefresh) summaryText.textContent = `Pencarian: ${results.length} Berkas • ${currentFilter}`;
    }

    if (results.length === 0 && isRefresh) {
      emptyState.classList.remove('hidden');
      emptyState.classList.add('flex');
    }

    results.forEach(item => {
      const isAdmin = window.currentUser.role === 'ADMIN';
      const statusColor = getStatusColor(item.statusPekerjaan || 'PROSES');
      const syncWarning = item.sudahSyncSheet === false 
        ? `<svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Belum Sync"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>` 
        : '';
      
      const tglPelaksanaan = formatTanggalTampil(item.tanggalPelaksanaan);
      
      const div = document.createElement('div');
      div.className = isAdmin ? 'swipe-card-container group' : 'mb-3 group';
      
      let innerHTML = '';
      
      if (isAdmin) {
        innerHTML += `
          <div class="swipe-behind">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </div>
        `;
      }
      
      innerHTML += `
        <a href="/detail.html?id=${item.id}&tahun=${tahun}" class="${isAdmin ? 'swipe-front block' : 'glass-card block p-4'} p-4 active:scale-[0.98] transition-transform">
          <div class="flex justify-between items-start mb-2 gap-2">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <h3 class="font-bold uppercase truncate">${escapeHtml(item.namaDebitur || '-')}</h3>
              ${syncWarning}
            </div>
            <div class="shrink-0 flex items-center gap-2">
              <span class="text-[10px] font-bold px-2 py-1 rounded-full border ${statusColor}">
                ${item.statusPekerjaan || 'PROSES'}
              </span>
              ${isAdmin ? `
              <button class="desktop-del-btn hidden md:flex opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-400/20 rounded transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
              ` : ''}
            </div>
          </div>
          
          <div class="text-sm text-white/50 mb-3 truncate">
            ${escapeHtml(item.namaBank || '-')} &bull; ${escapeHtml(item.namaNotaris || '-')}
          </div>
          
          <div class="border-t border-white/10 pt-3 flex justify-between items-center">
            <div class="flex items-center gap-2 text-xs text-white/70">
              <svg class="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              ${tglPelaksanaan}
            </div>
            ${renderSla(item)}
          </div>
        </a>
      `;
      
      div.innerHTML = innerHTML;
      listContainer.appendChild(div);

      if (isAdmin) {
        initSwipeToDelete(div, item.id, item.namaDebitur);
      }
    });

    // Pagination logic
    if (snapshot.docs.length === PAGE_SIZE && !searchTerm) {
      lastDocCursor = snapshot.docs[snapshot.docs.length - 1];
      btnLoadMore.classList.remove('hidden');
    } else {
      btnLoadMore.classList.add('hidden');
    }

  } catch (error) {
    console.error("Error loading data:", error);
    showToast("Gagal memuat data", "error");
  } finally {
    btnLoadMore.textContent = 'Muat Lebih Banyak';
    btnLoadMore.disabled = false;
  }
}
