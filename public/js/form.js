import { db, doc, getDoc, collection, addDoc, updateDoc, getDocs, serverTimestamp } from './firebase-config.js';
import { currencyInputFormatter, parseRupiah, formatRupiah, showToast, hitungDiff, catatAktivitas } from './utils.js';

const urlParams = new URLSearchParams(window.location.search);
const docId = urlParams.get('id');
const qTahun = urlParams.get('tahun') || new Date().getFullYear().toString();
const isEditMode = !!docId;

let originalData = {};
let masterNotaris = [];
let masterBank = [];
let defaultSla = 30;

// Init LocalStorage Default SLA
const lsSla = localStorage.getItem('default_sla');
if (lsSla) defaultSla = parseInt(lsSla);

const form = document.getElementById('laporanForm');
const skeletonLoading = document.getElementById('skeletonLoading');
const submitBtn = document.getElementById('submitBtn');
const submitText = document.getElementById('submitText');

// Form fields
const f_namaDebitur = document.getElementById('namaDebitur');
const f_namaNotaris = document.getElementById('namaNotaris');
const f_namaBank = document.getElementById('namaBank');
const f_picBank = document.getElementById('picBank');
const f_noSuratOrder = document.getElementById('noSuratOrder');
const f_tanggalOrder = document.getElementById('tanggalOrder');
const f_jenis = document.getElementById('jenis');
const f_rincianOrder = document.getElementById('rincianOrder');
const f_noCovernote = document.getElementById('noCovernote');
const f_limitPlafon = document.getElementById('limitPlafon');
const f_nilaiHT = document.getElementById('nilaiHT');
const f_biayaNotaris = document.getElementById('biayaNotaris');
const f_tanggalPelaksanaan = document.getElementById('tanggalPelaksanaan');
const f_batasSla = document.getElementById('batasSla');
const f_umurPekerjaan = document.getElementById('umurPekerjaan');
const f_statusPekerjaan = document.getElementById('statusPekerjaan');
const f_progresDetail = document.getElementById('progresDetail');
const f_tanggalBast = document.getElementById('tanggalBast');
const f_kekurangan = document.getElementById('kekurangan');
const f_notes = document.getElementById('notes');
const f_picInternal = document.getElementById('picInternal');

const ddNotaris = document.getElementById('notarisDropdown');
const ddBank = document.getElementById('bankDropdown');

document.addEventListener('authReady', () => {
  if (window.currentUser.role !== 'ADMIN') {
    showToast('Akses ditolak', 'error');
    setTimeout(() => window.history.back(), 1000);
    return;
  }
  
  document.getElementById('appBarTitle').textContent = isEditMode ? 'EDIT LAPORAN' : 'TAMBAH LAPORAN';
  if (isEditMode) submitText.textContent = 'SIMPAN PERUBAHAN';
  
  initFormatters();
  loadMasterData().then(() => {
    if (isEditMode) {
      loadExistingData();
    } else {
      skeletonLoading.classList.add('hidden');
      form.classList.remove('hidden');
    }
  });
});

function initFormatters() {
  currencyInputFormatter(f_limitPlafon);
  currencyInputFormatter(f_nilaiHT);
  currencyInputFormatter(f_biayaNotaris);

  f_tanggalOrder.addEventListener('change', handleTanggalOrderChange);
  f_tanggalBast.addEventListener('change', handleTanggalBastChange);

  // Autocomplete bindings
  f_namaNotaris.addEventListener('input', () => showDropdown(f_namaNotaris, masterNotaris.map(n => ({label: n, value: n})), ddNotaris, (val) => f_namaNotaris.value = val));
  f_namaBank.addEventListener('input', () => showDropdown(f_namaBank, masterBank.map(b => ({label: `${b.namaBank} - ${b.namaPic}`, value: b.namaBank, pic: b.namaPic})), ddBank, (val, item) => {
    f_namaBank.value = val;
    f_picBank.value = item.pic || '';
  }));

  // Close dropdowns on blur with delay
  f_namaNotaris.addEventListener('blur', () => setTimeout(() => ddNotaris.classList.add('hidden'), 150));
  f_namaBank.addEventListener('blur', () => setTimeout(() => ddBank.classList.add('hidden'), 150));
}

function handleTanggalOrderChange() {
  const tglOrder = f_tanggalOrder.value;
  if (!tglOrder) {
    f_tanggalPelaksanaan.value = '';
    f_batasSla.value = '';
    f_umurPekerjaan.value = '';
    return;
  }

  // Set Tanggal Pelaksanaan
  f_tanggalPelaksanaan.value = tglOrder;

  // Calculate SLA
  const dOrder = new Date(tglOrder);
  const dSla = new Date(dOrder);
  dSla.setDate(dSla.getDate() + defaultSla);
  f_batasSla.value = dSla.toISOString().split('T')[0];

  // Calculate Umur
  const today = new Date();
  today.setHours(0,0,0,0);
  const dOrderZ = new Date(tglOrder);
  dOrderZ.setHours(0,0,0,0);
  
  const diffTime = Math.abs(today - dOrderZ);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  f_umurPekerjaan.value = diffDays;

  // Auto Status if not Edit Mode or if status is not SELESAI/BATAL
  const curStatus = f_statusPekerjaan.value;
  if (!isEditMode || (curStatus !== 'SELESAI' && curStatus !== 'BATAL')) {
    if (diffDays < 25) {
      f_statusPekerjaan.value = 'PROSES';
    } else if (diffDays >= 25 && diffDays <= 39) {
      f_statusPekerjaan.value = 'PENDING';
    } else {
      f_statusPekerjaan.value = 'BERMASALAH';
    }
  }
}

function handleTanggalBastChange() {
  if (f_tanggalBast.value) {
    f_statusPekerjaan.value = 'SELESAI';
  }
}

function showDropdown(inputEl, listObj, dropdownEl, onSelect) {
  const query = inputEl.value.toLowerCase();
  dropdownEl.innerHTML = '';
  
  if (!query) {
    dropdownEl.classList.add('hidden');
    return;
  }

  const filtered = listObj.filter(item => item.label.toLowerCase().includes(query));
  
  if (filtered.length === 0) {
    dropdownEl.classList.add('hidden');
    return;
  }

  filtered.slice(0, 10).forEach(item => {
    const div = document.createElement('div');
    div.className = 'px-4 py-3 hover:bg-white/10 cursor-pointer text-sm text-white border-b border-white/5 last:border-0';
    div.textContent = item.label;
    div.addEventListener('click', () => {
      onSelect(item.value, item);
      dropdownEl.classList.add('hidden');
    });
    dropdownEl.appendChild(div);
  });

  dropdownEl.classList.remove('hidden');
}

async function loadMasterData() {
  try {
    // Notaris
    const notarisDoc = await getDoc(doc(db, 'master_data', 'notaris'));
    if (notarisDoc.exists() && notarisDoc.data().items) {
      masterNotaris = notarisDoc.data().items;
    }
    
    // Bank
    const bankSnap = await getDocs(collection(db, 'master_bank'));
    masterBank = [];
    bankSnap.forEach(d => masterBank.push(d.data()));
  } catch (err) {
    console.error("Master data load error", err);
  }
}

async function loadExistingData() {
  skeletonLoading.classList.remove('hidden');
  try {
    const docSnap = await getDoc(doc(db, `laporan_${qTahun}`, docId));
    if (docSnap.exists()) {
      originalData = docSnap.data();
      populateForm(originalData);
      skeletonLoading.classList.add('hidden');
      form.classList.remove('hidden');
    } else {
      showToast('Data tidak ditemukan', 'error');
      setTimeout(() => window.history.back(), 1500);
    }
  } catch (err) {
    console.error(err);
    showToast('Gagal memuat data form', 'error');
  }
}

function fmtDateToInput(dateObj) {
  if (!dateObj) return '';
  if (typeof dateObj === 'string') return dateObj;
  if (dateObj.toDate) {
    const d = dateObj.toDate();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  }
  return '';
}

function populateForm(data) {
  f_namaDebitur.value = data.namaDebitur || '';
  f_namaNotaris.value = data.namaNotaris || '';
  f_namaBank.value = data.namaBank || '';
  f_picBank.value = data.picBank || '';
  f_noSuratOrder.value = data.noSuratOrder || '';
  f_tanggalOrder.value = fmtDateToInput(data.tanggalOrder);
  if(data.jenis) f_jenis.value = data.jenis;
  f_rincianOrder.value = data.rincianOrder || '';
  f_noCovernote.value = data.noCovernote || '';
  f_limitPlafon.value = formatRupiah(data.limitPlafon || 0);
  f_nilaiHT.value = formatRupiah(data.nilaiHT || 0);
  f_biayaNotaris.value = formatRupiah(data.biayaNotaris || 0);
  f_tanggalPelaksanaan.value = fmtDateToInput(data.tanggalPelaksanaan);
  f_batasSla.value = fmtDateToInput(data.batasSla);
  f_umurPekerjaan.value = data.umurPekerjaan || '';
  if(data.statusPekerjaan) f_statusPekerjaan.value = data.statusPekerjaan;
  f_progresDetail.value = data.progresDetail || '';
  f_tanggalBast.value = fmtDateToInput(data.tanggalBast);
  f_kekurangan.value = data.kekurangan || '';
  f_notes.value = data.notes || '';
  f_picInternal.value = data.picInternal || '';
}

function getFormData() {
  return {
    namaDebitur: f_namaDebitur.value.trim().toUpperCase(),
    namaNotaris: f_namaNotaris.value.trim(),
    namaBank: f_namaBank.value.trim(),
    picBank: f_picBank.value.trim(),
    noSuratOrder: f_noSuratOrder.value.trim(),
    tanggalOrder: f_tanggalOrder.value,
    jenis: f_jenis.value,
    rincianOrder: f_rincianOrder.value.trim(),
    noCovernote: f_noCovernote.value.trim(),
    limitPlafon: parseRupiah(f_limitPlafon.value),
    nilaiHT: parseRupiah(f_nilaiHT.value),
    biayaNotaris: parseRupiah(f_biayaNotaris.value),
    tanggalPelaksanaan: f_tanggalPelaksanaan.value,
    batasSla: f_batasSla.value,
    umurPekerjaan: parseInt(f_umurPekerjaan.value) || 0,
    statusPekerjaan: f_statusPekerjaan.value,
    progresDetail: f_progresDetail.value.trim(),
    tanggalBast: f_tanggalBast.value,
    kekurangan: f_kekurangan.value.trim(),
    notes: f_notes.value.trim(),
    picInternal: f_picInternal.value.trim(),
    sudahSyncSheet: false,
    updatedBy: window.currentUser.email,
    waktuUpdate: serverTimestamp()
  };
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!f_namaDebitur.value.trim()) {
    showToast('Nama debitur wajib diisi', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<svg class="animate-spin h-5 w-5 text-[#0F172A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

  const newData = getFormData();
  const email = window.currentUser.email;

  try {
    if (isEditMode) {
      await updateDoc(doc(db, `laporan_${qTahun}`, docId), newData);
      
      // Hitung diff excluding some fields
      const diffDataNew = {...newData};
      delete diffDataNew.waktuUpdate;
      delete diffDataNew.updatedBy;
      delete diffDataNew.sudahSyncSheet;
      
      const diffDataOld = {...originalData};
      delete diffDataOld.waktuUpdate;
      delete diffDataOld.updatedBy;
      delete diffDataOld.sudahSyncSheet;
      delete diffDataOld.id;

      const diffMsg = hitungDiff(diffDataOld, diffDataNew);
      await catatAktivitas('EDIT', `Edit laporan ${newData.namaDebitur} (${docId}): ${diffMsg}`, email);

      showToast('Berkas berhasil diperbarui', 'success');
      setTimeout(() => window.history.back(), 1500);

    } else {
      const docRef = await addDoc(collection(db, `laporan_${qTahun}`), newData);
      await catatAktivitas('TAMBAH', `Tambah laporan baru: ${newData.namaDebitur} (${docRef.id})`, email);
      
      showToast('Berkas berhasil ditambahkan', 'success');
      setTimeout(() => window.location.replace(`/detail.html?id=${docRef.id}&tahun=${qTahun}`), 1500);
    }
  } catch (error) {
    console.error("Error saving doc:", error);
    showToast(error.message, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = isEditMode ? 'SIMPAN PERUBAHAN' : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span>SIMPAN BERKAS</span>';
  }
});
