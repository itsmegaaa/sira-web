import { db, doc, getDoc } from './firebase-config.js';
import { formatTanggalTampil, formatRupiah, showToast } from './utils.js';

// Get Query Params
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const tahun = urlParams.get('tahun');

if (!id || !tahun) {
  window.location.href = '/home.html';
}

const skeletonLoading = document.getElementById('skeletonLoading');
const dataContainer = document.getElementById('dataContainer');
const editBtnContainer = document.getElementById('editBtnContainer');
const btnEdit = document.getElementById('btnEdit');

document.addEventListener('authReady', () => {
  if (window.currentUser.role === 'ADMIN') {
    editBtnContainer.classList.remove('hidden');
    btnEdit.href = `/form.html?id=${id}&tahun=${tahun}`;
  }
  loadData();
});

function getStatusColor(status) {
  switch (status) {
    case 'SELESAI': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'PROSES': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'BATAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'PENDING': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default: return 'bg-pink-500/20 text-pink-400 border-pink-500/30'; // BERMASALAH
  }
}

function setVal(elementId, value, defaultVal = '-') {
  document.getElementById(elementId).textContent = value || defaultVal;
}

async function loadData() {
  try {
    const docRef = doc(db, `laporan_${tahun}`, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Header
      document.getElementById('debName').textContent = data.namaDebitur || '-';
      const badge = document.getElementById('badgeStatus');
      badge.textContent = data.statusPekerjaan || 'PROSES';
      badge.className = `px-4 py-1.5 rounded-full border text-xs font-bold tracking-widest ${getStatusColor(data.statusPekerjaan || 'PROSES')}`;

      // Info Umum
      setVal('valNotaris', data.namaNotaris);
      setVal('valBank', data.namaBank);
      setVal('valPicBank', data.picBank);

      // Detail Order
      setVal('valNoOrder', data.noSuratOrder);
      setVal('valTglOrder', formatTanggalTampil(data.tanggalOrder));
      setVal('valJenis', data.jenis);
      setVal('valRincian', data.rincianOrder);
      setVal('valCovernote', data.noCovernote);

      // Finansial
      setVal('valLimit', data.limitPlafon ? `Rp ${formatRupiah(data.limitPlafon)}` : '-');
      setVal('valNilaiHT', data.nilaiHT ? `Rp ${formatRupiah(data.nilaiHT)}` : '-');
      setVal('valBiaya', data.biayaNotaris ? `Rp ${formatRupiah(data.biayaNotaris)}` : '-');

      // Pelaksanaan
      setVal('valTglPelaksanaan', formatTanggalTampil(data.tanggalPelaksanaan));
      setVal('valBatasSLA', formatTanggalTampil(data.batasSla));
      setVal('valUmur', data.umurPekerjaan ? `${data.umurPekerjaan} Hari` : '-');
      setVal('valProgres', data.progresDetail);
      setVal('valTglBast', formatTanggalTampil(data.tanggalBast));

      // Catatan
      setVal('valKekurangan', data.kekurangan);
      setVal('valNotes', data.notes);
      setVal('valPicInternal', data.picInternal);

      // Updated At
      const updatedBy = data.updatedBy || 'Sistem';
      let wktUpdate = '';
      if (data.waktuUpdate && data.waktuUpdate.toDate) {
         wktUpdate = data.waktuUpdate.toDate().toLocaleString('id-ID');
      } else {
         wktUpdate = new Date().toLocaleString('id-ID');
      }
      setVal('valUpdated', `Terakhir diupdate oleh: ${updatedBy} pada ${wktUpdate}`);

      // Show Data
      skeletonLoading.classList.add('hidden');
      dataContainer.classList.remove('hidden');

    } else {
      showToast('Data tidak ditemukan', 'error');
      setTimeout(() => window.history.back(), 2000);
    }
  } catch (error) {
    console.error("Error loading detail:", error);
    showToast('Gagal memuat detail', 'error');
  }
}
