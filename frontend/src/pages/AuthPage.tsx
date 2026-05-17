import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../index.css';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await axios.post(`http://${window.location.hostname}:8000/login`, formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        login(response.data.access_token);
        navigate('/');
      } else {
        await axios.post(`http://${window.location.hostname}:8000/register`, { username, password });
        setIsLogin(true); // Switch to login after successful register
        setError('Registration successful! Please login.');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred.');
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-bright)', marginBottom: '1.5rem', fontSize: '2rem' }}>
          {isLogin ? 'Login to RAGNAR' : 'Join RAGNAR'}
        </h2>
        
        {error && (
          <div className={`status-message ${error.includes('successful') ? 'status-success' : 'status-error'}`} style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="chat-input"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)' }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="chat-input"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)' }}
            required
          />
          <button type="submit" className="upload-btn" style={{ width: '100%' }}>
            {isLogin ? 'Enter the Hall' : 'Forge Account'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
          {isLogin ? "Don't have an account? " : "Already forged an account? "}
          <span 
            style={{ color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 'bold' }} 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
