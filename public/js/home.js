import { auth, signOut, db, collection, getDocs, doc, getDoc, onSnapshot } from './firebase-config.js';
import { getSapaanWaktu, showToast } from './utils.js';

// DOM Elements
const menuBtn = document.getElementById('menuBtn');
const drawer = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const logoutBtn = document.getElementById('logoutBtn');
const greetingText = document.getElementById('greetingText');
const adminMenuContainer = document.getElementById('adminMenuContainer');
const btnSync = document.getElementById('btnSync');
const confirmDialog = document.getElementById('confirmDialog');
const btnCancelDialog = document.getElementById('btnCancelDialog');
const btnConfirmDialog = document.getElementById('btnConfirmDialog');

// Stats Elements
const statTotal = document.getElementById('statTotal');
const statProses = document.getElementById('statProses');
const statPending = document.getElementById('statPending');
const statBermasalah = document.getElementById('statBermasalah');
const syncBanner = document.getElementById('syncBanner');
const syncStatusText = document.getElementById('syncStatusText');

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2]; // Similar to Flutter 2023-2026

let unsubscribeStats = null;
let unsubscribeSync = null;

// Initialize Page when Auth is ready
document.addEventListener('authReady', () => {
  initUI();
  initListeners();
  loadStats();
  listenSyncStatus();
});

function initUI() {
  const user = window.currentUser;
  
  // Drawer Info
  const drawerName = document.getElementById('drawerName');
  const drawerRole = document.getElementById('drawerRole');
  const drawerEmail = document.getElementById('drawerEmail');
  
  drawerName.textContent = user.nama || user.email.split('@')[0];
  drawerName.classList.remove('skeleton');
  drawerRole.textContent = user.role === 'ADMIN' ? 'ADMINISTRATOR' : 'STAFF';
  drawerRole.classList.remove('skeleton');
  drawerEmail.textContent = user.email;
  drawerEmail.classList.remove('skeleton');

  // Greeting
  greetingText.textContent = `${getSapaanWaktu()}, ${user.nama || user.email.split('@')[0]}!`;

  // Admin Features
  if (user.role === 'ADMIN') {
    btnSync.classList.remove('hidden');
    btnSync.classList.add('flex');
    
    adminMenuContainer.innerHTML = `
      <a href="/log.html" class="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        LOG AKTIVITAS
      </a>
      <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-xl text-[#D4AF37] hover:bg-white/5 transition-colors" onclick="document.getElementById('btnSync').click(); return false;">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        SYNC KE GOOGLE SHEET
      </a>
    `;
  }

  // Render Arsip List
  const arsipContainer = document.getElementById('arsipContainer');
  arsipContainer.innerHTML = '';
  years.forEach(year => {
    const isCurrent = year === currentYear;
    arsipContainer.innerHTML += `
      <a href="/laporan.html?tahun=${year}" class="glass-card p-4 flex items-center justify-between hover:bg-white/10 transition-colors ${isCurrent ? 'border-[#D4AF37]/50 shadow-lg shadow-[#D4AF37]/5' : ''}">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full ${isCurrent ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/5 text-white/50'} flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
          </div>
          <div>
            <div class="font-bold">Arsip ${year}</div>
            <div class="text-xs text-white/50">${isCurrent ? 'Tahun Berjalan' : 'Riwayat Data'}</div>
          </div>
        </div>
        <svg class="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
      </a>
    `;
  });
}

function initListeners() {
  // Drawer Toggles
  menuBtn.addEventListener('click', toggleDrawer);
  drawerOverlay.addEventListener('click', toggleDrawer);
  
  // Logout
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      window.location.href = '/login.html';
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  // Sync Confirm Dialog
  btnSync.addEventListener('click', () => {
    confirmDialog.classList.remove('hidden');
  });
  
  btnCancelDialog.addEventListener('click', () => {
    confirmDialog.classList.add('hidden');
  });

  btnConfirmDialog.addEventListener('click', () => {
    confirmDialog.classList.add('hidden');
    triggerSync();
  });
}

function toggleDrawer() {
  const isClosed = drawer.classList.contains('-translate-x-full');
  if (isClosed) {
    drawer.classList.remove('-translate-x-full');
    drawerOverlay.classList.remove('hidden');
    // slight delay for opacity transition
    setTimeout(() => drawerOverlay.classList.remove('opacity-0'), 10);
  } else {
    drawer.classList.add('-translate-x-full');
    drawerOverlay.classList.add('opacity-0');
    setTimeout(() => drawerOverlay.classList.add('hidden'), 300);
  }
}

function loadStats() {
  // We'll calculate stats for the current year
  const collRef = collection(db, `laporan_${currentYear}`);
  
  unsubscribeStats = onSnapshot(collRef, (snapshot) => {
    let total = 0, proses = 0, pending = 0, bermasalah = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      total++;
      if (data.statusPekerjaan === 'PROSES') proses++;
      if (data.statusPekerjaan === 'PENDING') pending++;
      if (data.statusPekerjaan === 'BERMASALAH') bermasalah++;
    });

    statTotal.textContent = total;
    statProses.textContent = proses;
    statPending.textContent = pending;
    statBermasalah.textContent = bermasalah;

    // Remove skeleton
    [statTotal, statProses, statPending, statBermasalah].forEach(el => {
      el.classList.remove('skeleton', 'h-10', 'h-8', 'w-20', 'w-12', 'rounded');
    });
  }, (error) => {
    console.error("Error loading stats:", error);
    showToast("Gagal memuat statistik", "error");
  });
}

function listenSyncStatus() {
  const docRef = doc(db, 'sync_metadata', 'status');
  unsubscribeSync = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.isSyncing) {
        syncBanner.classList.remove('hidden');
        syncStatusText.textContent = data.message || 'Sinkronisasi sedang berjalan...';
      } else {
        syncBanner.classList.add('hidden');
      }
    }
  });
}

async function triggerSync() {
  try {
    const configDoc = await getDoc(doc(db, 'master_data', 'config'));
    if (!configDoc.exists() || !configDoc.data().webAppUrl) {
      showToast('URL Apps Script tidak ditemukan di master_data/config', 'error');
      return;
    }
    
    const webAppUrl = configDoc.data().webAppUrl;
    showToast('Memulai sinkronisasi...', 'info');
    
    // Fire and forget, UI updates via onSnapshot
    fetch(webAppUrl, {
      method: 'POST',
      body: JSON.stringify({ action: 'sync_from_firebase', tahun: currentYear.toString() }),
      mode: 'no-cors' // required for simple trigger
    });
    
  } catch (err) {
    console.error("Sync trigger error:", err);
    showToast('Gagal memicu sinkronisasi', 'error');
  }
}

// Cleanup listeners on leave
window.addEventListener('beforeunload', () => {
  if (unsubscribeStats) unsubscribeStats();
  if (unsubscribeSync) unsubscribeSync();
});
