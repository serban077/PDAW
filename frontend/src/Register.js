import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './App';
import './AuthForm.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setMessage('Parolele nu se potrivesc');
      return false;
    }
    
    if (formData.password.length < 6) {
      setMessage('Parola trebuie să aibă cel puțin 6 caractere');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage('Adresa de email nu este validă');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const registerData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName
      };

      // Folosește endpoint-ul de înregistrare
      const response = await axios.post('http://localhost:5000/api/auth/register', registerData);

      if (response.data.success || response.data.userId) {
        setMessage('Cont creat cu succes! Vă redirecționăm către pagina de autentificare...');
        
        // Opțional: loghează utilizatorul automat după înregistrare
        const userData = {
          id: response.data.userId || response.data.user?.id,
          username: formData.username,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          isAdmin: false
        };

        const token = response.data.token || response.data.accessToken;

        if (token) {
          // Loghează utilizatorul automat
          login(token, userData);
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          // Redirecționează către login dacă nu există token
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } else {
        throw new Error(response.data.message || 'Eroare la înregistrare');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Eroare la înregistrare';
      
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
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Înregistrare</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="input-row">
            <div className="input-group">
              <label>Prenume</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
            
            <div className="input-group">
              <label>Nume</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          </div>
          
          <div className="input-group">
            <label>Nume utilizator</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>
          
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
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
              disabled={loading}
              required
              minLength="6"
            />
          </div>
          
          <div className="input-group">
            <label>Confirmă parola</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              required
              minLength="6"
            />
          </div>
          
          {message && (
            <div className={`status-message ${message.includes('succes') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
          
          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Se procesează...
              </>
            ) : (
              'Înregistrare'
            )}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>
          Ai deja cont? <Link to="/login" style={{ color: 'var(--primary)' }}>Autentifică-te</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;