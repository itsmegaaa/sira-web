const fs = require('fs');

// 1. Fix style.css swipe-behind
let style = fs.readFileSync('public/css/style.css', 'utf8');
if (!style.includes('opacity: 0; /* hidden by default */')) {
  style = style.replace('.swipe-behind {', '.swipe-behind {\n  opacity: 0; /* hidden by default */\n  transition: opacity 0.2s ease;');
  fs.writeFileSync('public/css/style.css', style);
}

// 2. Fix laporan.js touch logic and btnCancelDelete
let js = fs.readFileSync('public/js/laporan.js', 'utf8');

const oldTouch = `function initSwipeToDelete(cardEl, id, namaDebitur) {
  const front = cardEl.querySelector('.swipe-front');
  let startX = 0;
  let currentX = 0;
  const threshold = 80;

  cardEl.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    front.style.transition = 'none';
  }, {passive: true});

  cardEl.addEventListener('touchmove', (e) => {
    currentX = e.touches[0].clientX - startX;
    if (currentX < 0) { // Only swipe left
      // limit max swipe
      const val = Math.max(currentX, -100);
      front.style.transform = \`translateX(\${val}px)\`;
    }
  }, {passive: true});

  cardEl.addEventListener('touchend', (e) => {
    front.style.transition = 'transform 0.2s ease-out';
    if (currentX < -threshold) {
      front.style.transform = \`translateX(-100px)\`;
      // Trigger delete dialog
      itemToDelete = { id, namaDebitur, cardEl };
      deleteDialog.classList.remove('hidden');
    } else {
      front.style.transform = \`translateX(0px)\`;
    }
  });`;

const newTouch = `function initSwipeToDelete(cardEl, id, namaDebitur) {
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
      front.style.transform = \`translateX(\${val}px)\`;
    }
  }, {passive: true});

  cardEl.addEventListener('touchend', (e) => {
    front.style.transition = 'transform 0.2s ease-out';
    if (currentX < -threshold) {
      front.style.transform = \`translateX(-100px)\`;
      // Trigger delete dialog
      itemToDelete = { id, namaDebitur, cardEl };
      deleteDialog.classList.remove('hidden');
    } else {
      front.style.transform = \`translateX(0px)\`;
      if (behind) behind.style.opacity = '0';
    }
  });`;

js = js.replace(oldTouch, newTouch);

const oldCancel = `btnCancelDelete.addEventListener('click', () => {
    deleteDialog.classList.add('hidden');
    // Reset swipe
    if (itemToDelete && itemToDelete.cardEl) {
      const front = itemToDelete.cardEl.querySelector('.swipe-front');
      if (front) front.style.transform = \`translateX(0px)\`;
    }
    itemToDelete = null;
  });`;

const newCancel = `btnCancelDelete.addEventListener('click', () => {
    deleteDialog.classList.add('hidden');
    // Reset swipe
    if (itemToDelete && itemToDelete.cardEl) {
      const front = itemToDelete.cardEl.querySelector('.swipe-front');
      const behind = itemToDelete.cardEl.querySelector('.swipe-behind');
      if (front) front.style.transform = \`translateX(0px)\`;
      if (behind) behind.style.opacity = '0';
    }
    itemToDelete = null;
  });`;

js = js.replace(oldCancel, newCancel);

fs.writeFileSync('public/js/laporan.js', js);
console.log('Swipe fix applied.');
