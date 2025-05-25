import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../AuthForm.css';

const TwoFactorAuth = ({ userId, tempToken, onVerify, onCancel, devCode }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingTime, setRemainingTime] = useState(120); // 2 minutes
  const [resendDisabled, setResendDisabled] = useState(true);
  const navigate = useNavigate();

  // Countdown timer for code expiration
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Enable resend after 30 seconds
    const resendTimer = setTimeout(() => {
      setResendDisabled(false);
    }, 30000);

    return () => {
      clearInterval(timer);
      clearTimeout(resendTimer);
    };
  }, []);

  // Check for development code in URL or props
  useEffect(() => {
    // Check URL parameters for dev code
    const urlParams = new URLSearchParams(window.location.search);
    const urlDevCode = urlParams.get('devCode');
    
    if (urlDevCode) {
      setCode(urlDevCode);
      console.log('Dev code found in URL:', urlDevCode);
    } else if (devCode) {
      setCode(devCode);
      console.log('Dev code found in props:', devCode);
    }
    
    // Log hint for development mode
    if (process.env.NODE_ENV !== 'production') {
      console.log('Development mode active - you can use code 999999 for verification');
    }
  }, [devCode]);

  // Format time as MM:SS
  const formatTimeRemaining = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle code input
  const handleChange = (e) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    
    // Limit to 6 digits
    if (value.length <= 6) {
      setCode(value);
    }
  };

  // Verify 2FA code
  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      setError('Codul trebuie să aibă 6 cifre');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/verify-2fa', {
        userId,
        code
      }, {
        headers: tempToken ? {
          'Authorization': `Bearer ${tempToken}`
        } : {}
      });
      
      if (onVerify) {
        onVerify({
          userId: response.data.userId,
          token: response.data.token,
          isAdmin: response.data.isAdmin
        });
      } else {
        // Store auth data directly
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', response.data.isAdmin ? 'admin' : 'user');
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.userId);
        
        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError(error.response?.data?.message || 'Cod invalid. Încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  // Resend 2FA code
  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/resend-2fa', { userId });
      
      setResendDisabled(true);
      setRemainingTime(120);
      
      // Reset resend timer
      setTimeout(() => {
        setResendDisabled(false);
      }, 30000);
      
      // Check for development code
      if (response.data.devMode && response.data.devCode) {
        console.log('Development code received:', response.data.devCode);
        // Optionally set the code automatically in dev mode
        if (process.env.NODE_ENV !== 'production') {
          setCode(response.data.devCode);
        }
      }
      
      // Show success message
      setError('');
      
      // Display temporary success message
      const successMessage = document.createElement('div');
      successMessage.className = 'status-message success';
      successMessage.textContent = 'Codul a fost retrimis cu succes!';
      
      const form = document.querySelector('form');
      if (form) {
        form.appendChild(successMessage);
        
        setTimeout(() => {
          if (form.contains(successMessage)) {
            form.removeChild(successMessage);
          }
        }, 3000);
      }
      
    } catch (error) {
      console.error('Resend error:', error);
      setError(error.response?.data?.message || 'Eroare la retrimiterea codului');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Default behavior: return to login
      navigate('/login');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 style={{ textAlign: 'center', color: 'var(--secondary)', marginBottom: '2rem' }}>
          🏋️♂️ UNILUX FITNESS
        </h1>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Verificare în doi pași</h2>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
          Am trimis un cod de 6 cifre la adresa dvs. de email sau folosiți aplicația de autentificare.
        </p>

        <form onSubmit={handleVerify}>
          <div className="input-group" style={{ maxWidth: '300px', margin: '0 auto 1.5rem' }}>
            <input
              type="text"
              value={code}
              onChange={handleChange}
              placeholder="Cod de 6 cifre"
              style={{ 
                textAlign: 'center', 
                fontSize: '1.5rem', 
                letterSpacing: '0.5rem',
                fontWeight: 'bold' 
              }}
              disabled={loading || remainingTime === 0}
              autoFocus
              required
            />
            <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
              Codul expiră în {formatTimeRemaining(remainingTime)}
            </div>
          </div>

          {/* Development mode notice */}
          {process.env.NODE_ENV !== 'production' && (
            <div style={{
              margin: '0 auto 1.5rem',
              padding: '1rem',
              backgroundColor: '#fff3cd',
              borderRadius: '5px',
              maxWidth: '300px',
              textAlign: 'center',
              border: '1px solid #ffeeba'
            }}>
              <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Mod Dezvoltare</p>
              <p style={{ marginBottom: '0.5rem' }}>Puteți folosi codul <strong>999999</strong> pentru verificare</p>
              <p>Codul real apare în consola serverului</p>
            </div>
          )}

          {error && (
            <div className="status-message error">
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
            <button
              type="submit"
              className="auth-button"
              disabled={loading || code.length !== 6 || remainingTime === 0}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Verificare...
                </>
              ) : (
                'Verifică codul'
              )}
            </button>
            
            <button
              type="button"
              className={`auth-button ${resendDisabled ? 'secondary' : 'primary'}`}
              onClick={handleResendCode}
              disabled={loading || resendDisabled}
            >
              {resendDisabled ? 'Așteaptă pentru a retrimite' : 'Retrimite codul'}
            </button>
            
            <button
              type="button"
              className="auth-button danger"
              onClick={handleCancel}
              disabled={loading}
            >
              Anulează și întoarce-te
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorAuth;