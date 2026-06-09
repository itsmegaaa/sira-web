import { db, addDoc, collection, serverTimestamp } from './firebase-config.js';

// Format Indonesian Rupiah
export function formatRupiah(angka) {
  if (!angka && angka !== 0) return '';
  const number_string = angka.toString().replace(/[^,\d]/g, '');
  const split = number_string.split(',');
  const sisa = split[0].length % 3;
  let rupiah = split[0].substr(0, sisa);
  const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

  if (ribuan) {
    const separator = sisa ? '.' : '';
    rupiah += separator + ribuan.join('.');
  }
  return split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
}

// Live formatting on input event
export function currencyInputFormatter(inputEl) {
  inputEl.addEventListener('input', function(e) {
    let value = this.value.replace(/[^,\d]/g, '');
    this.value = formatRupiah(value);
  });
}

// Strip currency format to raw integer
export function parseRupiah(rupiahStr) {
  if (!rupiahStr) return 0;
  return parseInt(rupiahStr.replace(/[^0-9]/g, '')) || 0;
}

// Date greeting
export function getSapaanWaktu() {
  const hour = new Date().getHours();
  if (hour >= 3 && hour < 11) return 'Selamat Pagi';
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  if (hour >= 15 && hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

// Parse flexible date (ISO or dd-MM-yyyy fallback)
export function parseFlexibleDate(dateStr) {
  if (!dateStr) return new Date();
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 4) return new Date(dateStr); // yyyy-mm-dd
    if (parts[2].length === 4) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // dd-mm-yyyy
  }
  return new Date(dateStr);
}

// Format date display: dd MMM yyyy (Indonesian locale)
export function formatTanggalTampil(dateInput) {
  if (!dateInput) return 'Belum Pelaksanaan';
  let dateObj = (typeof dateInput === 'string') ? parseFlexibleDate(dateInput) : dateInput;
  if (dateInput.toDate) { // Check if Firestore timestamp
      dateObj = dateInput.toDate();
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`;
}

// Diff checker for edit mode
export function hitungDiff(oldData, newData) {
  let changes = [];
  for (let key in newData) {
    if (oldData[key] !== newData[key]) {
      changes.push(`${key} berubah`);
    }
  }
  return changes.length > 0 ? changes.join(', ') : 'Tidak ada perubahan field utama';
}

// Debounce helper
export function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Touch swipe detector (for swipe-to-delete on mobile)
export function onSwipeLeft(element, callback) {
  let startX = 0;
  element.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  }, {passive: true});
  element.addEventListener('touchend', e => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (diff > 80) { // swipe threshold 80px
      callback(element);
    }
  });
}

// Global Toast System
export function showToast(message, type = 'success') {
  const existingToast = document.getElementById('global-toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.id = 'global-toast';
  
  // Colors based on type
  let bgClass = 'bg-[#10B981]'; // success green
  let icon = '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
  
  if (type === 'error') {
    bgClass = 'bg-[#EF4444]'; // red
    icon = '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
  } else if (type === 'info') {
    bgClass = 'bg-[#3B82F6]'; // blue
    icon = '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
  }

  toast.className = `fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${bgClass} text-white font-medium text-sm toast-enter max-w-[90vw] whitespace-nowrap`;
  toast.innerHTML = `${icon} <span>${message}</span>`;
  
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300); // Wait for exit animation
  }, 3000);
}

// Activity logging function
export async function catatAktivitas(aksi, detail, userEmail) {
  try {
    await addDoc(collection(db, 'logs_laporan'), {
      aksi,
      detail,
      oleh: userEmail || 'Sistem',
      waktu: serverTimestamp()
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}
