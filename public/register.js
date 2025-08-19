// register.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// TODO: Paste your Firebase config here (same as main.js)
const firebaseConfig = {
  apiKey: "AIzaSyA3O_fsdj614KDUS1MV6ZGwijaLGwjo4HA",
  authDomain: "drip-anurag.firebaseapp.com",
  projectId: "drip-anurag",
  storageBucket: "drip-anurag.firebasestorage.app",
  messagingSenderId: "312422295524",
  appId: "1:312422295524:web:68804cf01448603b7c89f1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const registerForm = document.getElementById('register-form');

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
            alert('Registration successful! Please login.');
            window.location.href = 'index.html';
        })
        .catch(err => alert(err.message));
});
