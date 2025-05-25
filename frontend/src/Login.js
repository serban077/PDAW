import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './App';
import './AuthForm.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState({ active: false, endTime: null });
  const [attempts, setAttempts] = useState(0);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const incrementAttempts = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    if (newAttempts >= 3) {
      const cooldownTime = 60000; // 1 minut
      setCooldown({
        active: true,
        endTime: Date.now() + cooldownTime
      });
      
      setTimeout(() => {
        setCooldown({ active: false, endTime: null });
        setAttempts(0);
      }, cooldownTime);
    }
  };

  const formatTime = (ms) => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getRemainingTime = () => {
    if (!cooldown.active || !cooldown.endTime) return 0;
    return Math.max(0, cooldown.endTime - Date.now());
  };

  const resetCooldown = () => {
    setCooldown({ active: false, endTime: null });
    setAttempts(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cooldown.active) {
      setMessage(`Prea multe încercări. Încercați peste ${formatTime(getRemainingTime())}`);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Folosește endpoint-ul de autentificare
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);

      if (response.data.success || response.data.userId) {
        // Pregătește datele utilizatorului
        const userData = {
          id: response.data.userId || response.data.user?.id,
          username: response.data.user?.username || formData.username,
          email: response.data.user?.email,
          firstName: response.data.user?.first_name,
          lastName: response.data.user?.last_name,
          isAdmin: response.data.isAdmin || response.data.user?.isAdmin || false
        };

        // Obține token-ul
        const token = response.data.token || response.data.accessToken;

        if (token) {
          // Folosește funcția login din AuthContext
          login(token, userData);
          
          resetCooldown();
          setMessage('Autentificare reușită! Vă redirecționăm...');
          
          // Navigarea se va face automat prin AuthContext
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } else {
          throw new Error('Token lipsă în răspunsul serverului');
        }
      } else {
        throw new Error(response.data.message || 'Eroare la autentificare');
      }
    } catch (error) {
      console.error('Login error:', error);
      incrementAttempts();
      
      let errorMessage = 'Eroare la autentificare';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 style={{ textAlign: 'center', color: 'var(--secondary)', marginBottom: '2rem' }}>
          🏋️♂️ UNILUX FITNESS
        </h1>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Autentificare</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nume utilizator</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading || cooldown.active}
              required
            />
          </div>
          
          <div className="input-group">
            <label>Parolă</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading || cooldown.active}
              required
            />
          </div>
          
          {message && (
            <div className={`status-message ${message.includes('reușită') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
          
          {cooldown.active && (
            <div className="status-message error">
              Prea multe încercări! Încercați peste {formatTime(getRemainingTime())}
            </div>
          )}
          
          <button
            type="submit"
            className="auth-button"
            disabled={loading || cooldown.active}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Se procesează...
              </>
            ) : (
              'Autentificare'
            )}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>
          Nu ai cont? <Link to="/register" style={{ color: 'var(--primary)' }}>Înregistrează-te</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;