import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyA0bmUPLo35bp1sIy94kixfdI4yTqSl_7M",
    authDomain: "cardiotrack-a9f7e.firebaseapp.com",
    projectId: "cardiotrack-a9f7e",
    storageBucket: "cardiotrack-a9f7e.firebasestorage.app",
    messagingSenderId: "211267433526",
    appId: "1:211267433526:web:159e812e63bbc87da71497",
    measurementId: "G-WHDH1S4LQD"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore instance
const db = getFirestore(app);
export { db };
