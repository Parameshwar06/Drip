import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

const Register = ({ onLoginClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Registration successful! You are now logged in.');
    } catch (error) {
      alert('Registration failed: ' + error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Account</h1>
        <form className="auth-form" onSubmit={handleRegister}>
          <input
            type="email"
            className="auth-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="auth-input"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
          />
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        <div className="auth-link">
          Already have an account?{' '}
          <button 
            type="button"
            onClick={onLoginClick}
            style={{
              background: 'none',
              border: 'none',
              color: '#3a86ff',
              textDecoration: 'none',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
