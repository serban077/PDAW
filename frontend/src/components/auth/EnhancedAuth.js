import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../../AuthForm.css';

// Two-factor authentication component
const TwoFactorAuth = ({ userId, tempToken, onVerify, onCancel }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingTime, setRemainingTime] = useState(120); // 2 minutes
  const [resendDisabled, setResendDisabled] = useState(true);

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
        headers: {
          'Authorization': `Bearer ${tempToken}`
        }
      });
      
      onVerify({
        userId: response.data.userId,
        token: response.data.token,
        isAdmin: response.data.isAdmin
      });
    } catch (error) {
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
      await axios.post('http://localhost:5000/resend-2fa', { userId });
      setResendDisabled(true);
      setRemainingTime(120);
      
      // Reset resend timer
      setTimeout(() => {
        setResendDisabled(false);
      }, 30000);
      
    } catch (error) {
      setError(error.response?.data?.message || 'Eroare la retrimiterea codului');
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
              onClick={onCancel}
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

// Enhanced login component with 2FA support
const EnhancedLogin = ({
  setIsAuthenticated,
  setUserRole,
  setUserData,
  cooldown,
  incrementAttempts,
  formatTime,
  getRemainingTime,
  resetCooldown,
  init2FAVerification
}) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      const response = await axios.post('http://localhost:5000/login', formData);
      
      // Check if 2FA is required
      if (response.data.has2FA) {
        // Initialize 2FA verification
        init2FAVerification(response.data.userId, response.data.tempToken);
      } else {
        // Complete login without 2FA
        const userData = {
          id: response.data.userId,
          isAdmin: response.data.isAdmin || false,
          has2FA: false
        };
        
        // Update application state
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', response.data.isAdmin ? 'admin' : 'user');
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userId', response.data.userId);
        localStorage.setItem('token', response.data.token);
        
        setIsAuthenticated(true);
        setUserRole(response.data.isAdmin ? 'admin' : 'user');
        setUserData(userData);
        resetCooldown();
      }
    } catch (error) {
      incrementAttempts();
      setMessage(error.response?.data?.message || 'Eroare la autentificare');
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
            <label>Nume utilizator sau Email</label>
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
            <div className="status-message error">
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

// Enhanced register component with 2FA setup
const EnhancedRegister = ({ 
  setIsAuthenticated, 
  setUserRole,
  setUserData,
  cooldown, 
  formatTime, 
  getRemainingTime,
  resetCooldown,
  init2FAVerification
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    enable2FA: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cooldown.active) {
      setMessage(`Prea multe încercări. Încercați peste ${formatTime(getRemainingTime())}`);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setMessage('Parolele nu coincid!');
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage('Adresa de email nu este validă!');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post('http://localhost:5000/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        enable2FA: formData.enable2FA
      });
      
      if (formData.enable2FA) {
        // Initialize 2FA setup and verification
        init2FAVerification(response.data.userId, response.data.tempToken);
      } else {
        // Complete registration without 2FA
        const userData = {
          id: response.data.userId,
          isAdmin: response.data.isAdmin || false,
          has2FA: false
        };
        
        // Update application state
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', response.data.isAdmin ? 'admin' : 'user');
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userId', response.data.userId);
        localStorage.setItem('token', response.data.token);
        
        setIsAuthenticated(true);
        setUserRole(response.data.isAdmin ? 'admin' : 'user');
        setUserData(userData);
        resetCooldown();
        
        // Redirect to dashboard
        navigate('/dashboard');
      }
      
    } catch (error) {
      setMessage(error.response?.data?.message || 'Eroare la înregistrare');
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
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
              Vom trimite codul de verificare la această adresă
            </div>
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
            />
          </div>

          <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="enable2FA"
                checked={formData.enable2FA}
                onChange={handleChange}
                disabled={loading}
                style={{ marginRight: '0.5rem' }}
              />
              Activează Autentificarea în Doi Pași (Recomandată)
            </label>
          </div>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px', 
            padding: '1rem', 
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            color: '#495057'
          }}>
            <p>
              <strong>Autentificarea în doi pași</strong> adaugă un nivel suplimentar de securitate contului tău. 
              Vei avea nevoie de o aplicație precum Google Authenticator.
            </p>
          </div>

          {message && (
            <div className={`status-message ${message.includes('succes') ? 'success' : 'error'}`}>
              {message}
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

// Setup 2FA component
const TwoFactorSetup = ({ userId, tempToken, onComplete, onCancel }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  useEffect(() => {
    const setup2FA = async () => {
      try {
        const response = await axios.post('http://localhost:5000/setup-2fa', {
          userId
        }, {
          headers: {
            'Authorization': `Bearer ${tempToken}`
          }
        });
        
        setQrCodeUrl(response.data.qrCodeUrl);
        setSecretKey(response.data.secretKey);
      } catch (error) {
        setError(error.response?.data?.message || 'Eroare la configurarea 2FA');
      } finally {
        setLoading(false);
      }
    };

    setup2FA();
  }, [userId, tempToken]);

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      setVerifyError('Codul trebuie să aibă 6 cifre');
      return;
    }
    
    setVerifyLoading(true);
    setVerifyError('');
    
    try {
      await axios.post('http://localhost:5000/verify-2fa', {
        userId,
        code: verificationCode
      }, {
        headers: {
          'Authorization': `Bearer ${tempToken}`
        }
      });
      
      onComplete();
    } catch (error) {
      setVerifyError(error.response?.data?.message || 'Cod invalid. Încercați din nou.');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 style={{ textAlign: 'center', color: 'var(--secondary)', marginBottom: '2rem' }}>
          🏋️♂️ UNILUX FITNESS
        </h1>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Configurare Autentificare în Doi Pași</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <span className="spinner"></span>
            <p>Se configurează...</p>
          </div>
        ) : error ? (
          <div className="status-message error">
            {error}
            <button 
              className="auth-button" 
              style={{ marginTop: '1rem' }}
              onClick={onCancel}
            >
              Întoarce-te
            </button>
          </div>
        ) : (
          <>
            <p style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              Scanați acest cod QR cu aplicația Google Authenticator sau o altă aplicație de autentificare:
            </p>
            
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              {qrCodeUrl && (
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code pentru 2FA" 
                  style={{ 
                    maxWidth: '200px', 
                    margin: '0 auto',
                    border: '1px solid #ddd',
                    borderRadius: '10px',
                    padding: '10px',
                    backgroundColor: 'white'
                  }} 
                />
              )}
            </div>
            
            {secretKey && (
              <div style={{ 
                marginBottom: '2rem', 
                padding: '1rem', 
                backgroundColor: '#f5f5f5',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Sau introduceți manual acest cod secret:</p>
                <p style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '1.2rem',
                  letterSpacing: '0.2rem',
                  marginTop: '0.5rem'
                }}>
                  {secretKey}
                </p>
              </div>
            )}
            
            <form onSubmit={handleVerify}>
              <div className="input-group">
                <label>Cod de verificare</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength="6"
                  placeholder="Introduceți codul din aplicație"
                  required
                />
              </div>
              
              {verifyError && (
                <div className="status-message error">
                  {verifyError}
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <button
                  type="button"
                  className="auth-button danger"
                  onClick={onCancel}
                  disabled={verifyLoading}
                >
                  Anulează
                </button>
                
                <button
                  type="submit"
                  className="auth-button"
                  disabled={verifyLoading || verificationCode.length !== 6}
                >
                  {verifyLoading ? (
                    <>
                      <span className="spinner"></span>
                      Se verifică...
                    </>
                  ) : (
                    'Verifică și activează'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export { EnhancedLogin, EnhancedRegister, TwoFactorAuth, TwoFactorSetup };