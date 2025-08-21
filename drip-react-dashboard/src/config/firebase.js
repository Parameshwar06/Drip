// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyA3O_fsdj614KDUS1MV6ZGwijaLGwjo4HA",
  authDomain: "drip-anurag.firebaseapp.com",
  databaseURL: "https://drip-anurag-default-rtdb.firebaseio.com/",
  projectId: "drip-anurag",
  storageBucket: "drip-anurag.firebasestorage.app",
  messagingSenderId: "312422295524",
  appId: "1:312422295524:web:68804cf01448603b7c89f1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;
