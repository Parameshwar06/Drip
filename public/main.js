// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, onValue, set, query, limitToLast, get, orderByChild } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// TODO: Paste your Firebase config here
const firebaseConfig = {
  apiKey: "AIzaSyA3O_fsdj614KDUS1MV6ZGwijaLGwjo4HA",
  authDomain: "drip-anurag.firebaseapp.com",
  projectId: "drip-anurag",
  storageBucket: "drip-anurag.firebasestorage.app",
  messagingSenderId: "312422295524",
  appId: "1:312422295524:web:68804cf01448603b7c89f1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// UI Elements
const dashboard = document.getElementById('dashboard');
const moistureValue = document.getElementById('moisture-value');
const temperatureValue = document.getElementById('temperature-value');
const humidityValue = document.getElementById('humidity-value');
const valveStatus = document.getElementById('valve-status');
const openValveBtn = document.getElementById('open-valve');
const closeValveBtn = document.getElementById('close-valve');
const moistureChartCtx = document.getElementById('moistureChart').getContext('2d');
const authSection = document.getElementById('auth-section');
const loginForm = document.getElementById('login-form');
// No registerForm here; registration is on register.html
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');

let moistureChart;
let userId = null;

// Helper: Get user-specific path
function getUserNodePath() {
    return `SensorData/${userId}/node1/`;
}

// Auth State
onAuthStateChanged(auth, (user) => {
    if (user) {
        userId = user.uid;
        userInfo.textContent = `Logged in as: ${user.email}`;
        authSection.style.display = 'block';
        dashboard.style.display = 'block';
        logoutBtn.style.display = 'inline-block';
        loginForm.style.display = 'none';
        loadLiveData();
        loadMoistureHistory();
    } else {
        userId = null;
        userInfo.textContent = '';
        dashboard.style.display = 'none';
        logoutBtn.style.display = 'none';
        loginForm.style.display = 'flex';
    }
});



// Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    signInWithEmailAndPassword(auth, email, password)
        .catch(err => {
            alert('Login failed: ' + err.message);
        });
});

// Logout
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// Live Data
function loadLiveData() {
    const nodeRef = ref(db, getUserNodePath());
    onValue(nodeRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            moistureValue.textContent = data.moisture !== undefined ? data.moisture : '--';
            temperatureValue.textContent = data.temperature !== undefined ? data.temperature + ' °C' : '--';
            humidityValue.textContent = data.humidity !== undefined ? data.humidity + ' %' : '--';
            valveStatus.textContent = data.valveStatus || '--';
        } else {
            moistureValue.textContent = '--';
            temperatureValue.textContent = '--';
            humidityValue.textContent = '--';
            valveStatus.textContent = '--';
        }
    });
}

// Moisture Chart
function loadMoistureHistory() {
    const nodeRef = query(ref(db, getUserNodePath()), orderByChild('timestamp'), limitToLast(20));
    get(nodeRef).then(snapshot => {
        const dataArr = [];
        snapshot.forEach(child => {
            dataArr.push(child.val());
        });
        // Sort by timestamp ascending
        dataArr.sort((a, b) => a.timestamp - b.timestamp);
        const labels = dataArr.map(d => {
            const date = new Date(d.timestamp * 1000);
            return date.toLocaleTimeString();
        });
        const moistures = dataArr.map(d => d.moisture);
        if (moistureChart) moistureChart.destroy();
        moistureChart = new Chart(moistureChartCtx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Moisture',
                    data: moistures,
                    borderColor: '#3a86ff',
                    backgroundColor: 'rgba(58,134,255,0.1)',
                    tension: 0.3,
                    pointRadius: 2
                }]
            },
            options: {
                plugins: {
                    legend: { labels: { color: '#f1f1f1' } }
                },
                scales: {
                    x: { ticks: { color: '#f1f1f1' } },
                    y: { ticks: { color: '#f1f1f1' } }
                }
            }
        });
    });
}

// Valve Controls
openValveBtn.addEventListener('click', () => {
    if (!userId) return;
    set(ref(db, getUserNodePath() + 'valveStatus'), 'ON');
});
closeValveBtn.addEventListener('click', () => {
    if (!userId) return;
    set(ref(db, getUserNodePath() + 'valveStatus'), 'OFF');
});

// Optionally, reload chart every 10s for live updates
setInterval(() => {
    if (userId) loadMoistureHistory();
}, 10000);
