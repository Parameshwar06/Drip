import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="app">
        <Dashboard user={user} />
      </div>
    );
  }

  return (
    <div className="app">
      {showRegister ? (
        <Register onLoginClick={() => setShowRegister(false)} />
      ) : (
        <Login onRegisterClick={() => setShowRegister(true)} />
      )}
    </div>
  );
}

export default App;
