import { db, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from './firebase-config.js';
import { showToast, escapeHtml } from './utils.js';

const skeletonLoading = document.getElementById('skeletonLoading');
const dataContainer = document.getElementById('dataContainer');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');

const formModal = document.getElementById('formModal');
const bankForm = document.getElementById('bankForm');
const modalTitle = document.getElementById('modalTitle');
const fabAdd = document.getElementById('fabAdd');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnDelete = document.getElementById('btnDelete');
const btnSave = document.getElementById('btnSave');

const f_id = document.getElementById('editId');
const f_namaBank = document.getElementById('f_namaBank');
const f_namaPic = document.getElementById('f_namaPic');

let masterBankData = [];
let unsubscribe = null;

document.addEventListener('authReady', () => {
  if (window.currentUser.role !== 'ADMIN') {
    showToast('Akses ditolak', 'error');
    setTimeout(() => window.history.back(), 1000);
    return;
  }
  loadData();
});

function loadData() {
  const q = query(collection(db, 'master_bank'), orderBy('namaBank', 'asc'));
  
  unsubscribe = onSnapshot(q, (snapshot) => {
    masterBankData = [];
    snapshot.forEach(d => {
      masterBankData.push({ id: d.id, ...d.data() });
    });
    renderList(masterBankData);
  }, (error) => {
    console.error("Error loading master bank:", error);
    showToast('Gagal memuat data master bank', 'error');
  });
}

function renderList(dataToRender) {
  skeletonLoading.classList.add('hidden');
  
  if (dataToRender.length === 0) {
    emptyState.classList.remove('hidden');
    emptyState.classList.add('flex');
    dataContainer.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  dataContainer.classList.remove('hidden');
  dataContainer.classList.add('flex');
  dataContainer.innerHTML = '';

  dataToRender.forEach(item => {
    const div = document.createElement('div');
    div.className = 'glass-card p-4 hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between group';
    div.innerHTML = `
      <div>
        <h4 class="text-white font-bold text-lg">${escapeHtml(item.namaBank)}</h4>
        <p class="text-sm text-white/60 flex items-center gap-1 mt-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          PIC: ${escapeHtml(item.namaPic || '-')}
        </p>
      </div>
      <div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#D4AF37] group-hover:text-[#0F172A] transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
      </div>
    `;
    div.addEventListener('click', () => openModal(item));
    dataContainer.appendChild(div);
  });
}

searchInput.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  const filtered = masterBankData.filter(item => 
    item.namaBank.toLowerCase().includes(q) || 
    (item.namaPic && item.namaPic.toLowerCase().includes(q))
  );
  renderList(filtered);
});

// Modal Logic
function openModal(data = null) {
  formModal.classList.remove('hidden');
  // Trigger reflow
  void formModal.offsetWidth;
  
  const backdrop = formModal.querySelector('.modal-backdrop');
  const dialog = formModal.querySelector('.modal-dialog');
  
  backdrop.classList.remove('opacity-0');
  backdrop.classList.add('opacity-100');
  dialog.classList.remove('opacity-0', 'translate-y-full', 'sm:translate-y-4');
  dialog.classList.add('opacity-100', 'translate-y-0');

  if (data) {
    modalTitle.textContent = 'EDIT BANK';
    f_id.value = data.id;
    f_namaBank.value = data.namaBank;
    f_namaPic.value = data.namaPic || '';
    btnDelete.classList.remove('hidden');
    btnDelete.classList.add('flex');
  } else {
    modalTitle.textContent = 'TAMBAH BANK';
    f_id.value = '';
    f_namaBank.value = '';
    f_namaPic.value = '';
    btnDelete.classList.add('hidden');
    btnDelete.classList.remove('flex');
  }
}

function closeModal() {
  const backdrop = formModal.querySelector('.modal-backdrop');
  const dialog = formModal.querySelector('.modal-dialog');
  
  backdrop.classList.remove('opacity-100');
  backdrop.classList.add('opacity-0');
  dialog.classList.remove('opacity-100', 'translate-y-0');
  dialog.classList.add('opacity-0', 'translate-y-full', 'sm:translate-y-4');
  
  setTimeout(() => {
    formModal.classList.add('hidden');
    bankForm.reset();
  }, 300);
}

fabAdd.addEventListener('click', () => openModal());
btnCloseModal.addEventListener('click', closeModal);
formModal.querySelector('.modal-backdrop').addEventListener('click', closeModal);

bankForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const bankName = f_namaBank.value.trim();
  const picName = f_namaPic.value.trim();
  
  if (!bankName) {
    showToast('Nama bank wajib diisi', 'error');
    return;
  }

  const id = f_id.value;
  btnSave.disabled = true;
  btnSave.innerHTML = '<svg class="animate-spin h-5 w-5 text-[#0F172A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

  try {
    if (id) {
      await updateDoc(doc(db, 'master_bank', id), {
        namaBank: bankName,
        namaPic: picName
      });
      showToast('Data bank diperbarui', 'success');
    } else {
      await addDoc(collection(db, 'master_bank'), {
        namaBank: bankName,
        namaPic: picName
      });
      showToast('Data bank ditambahkan', 'success');
    }
    closeModal();
  } catch (error) {
    console.error(error);
    showToast('Gagal menyimpan data', 'error');
  } finally {
    btnSave.disabled = false;
    btnSave.innerHTML = 'SIMPAN';
  }
});

btnDelete.addEventListener('click', async () => {
  const id = f_id.value;
  if (!id) return;

  if (confirm('Apakah Anda yakin ingin menghapus bank ini?')) {
    try {
      btnDelete.disabled = true;
      btnDelete.innerHTML = '<svg class="animate-spin h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
      
      await deleteDoc(doc(db, 'master_bank', id));
      showToast('Data bank dihapus', 'success');
      closeModal();
    } catch (error) {
      console.error(error);
      showToast('Gagal menghapus data', 'error');
    } finally {
      btnDelete.disabled = false;
      btnDelete.innerHTML = 'HAPUS';
    }
  }
});

window.addEventListener('beforeunload', () => {
  if (unsubscribe) unsubscribe();
});
