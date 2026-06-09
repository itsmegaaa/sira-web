import { auth, onAuthStateChanged, db, doc, getDoc } from './firebase-config.js';

// Global object to store current user details
window.currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = '/login.html';
  } else {
    // Fetch user role
    try {
      const userDocRef = doc(db, 'users', user.email);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        window.currentUser = {
          email: user.email,
          uid: user.uid,
          ...userDocSnap.data()
        };
      } else {
        // Fallback if not in users collection
        window.currentUser = {
          email: user.email,
          uid: user.uid,
          role: 'STAFF', // default fallback
          nama: user.email.split('@')[0]
        };
      }
      
      // Dispatch an event so page scripts know auth is ready
      document.dispatchEvent(new Event('authReady'));
      
    } catch (err) {
      console.error("Error fetching user role", err);
      // fallback
      window.currentUser = {
          email: user.email,
          uid: user.uid,
          role: 'STAFF',
          nama: user.email.split('@')[0]
      };
      document.dispatchEvent(new Event('authReady'));
    }
  }
});
