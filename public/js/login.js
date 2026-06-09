import { auth, signInWithEmailAndPassword, onAuthStateChanged } from './firebase-config.js';

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('errorMsg');
const submitBtn = document.getElementById('submitBtn');

// Redirect if already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = '/home.html';
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  errorMsg.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<svg class="animate-spin h-5 w-5 text-[#0F172A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle the redirect
  } catch (error) {
    console.error('Login error:', error);
    errorMsg.textContent = 'Email atau password salah.';
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      errorMsg.textContent = 'Email atau password salah.';
    } else {
      errorMsg.textContent = error.message;
    }
    errorMsg.classList.remove('hidden');
    
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>MASUK KE SISTEM</span>';
  }
});
