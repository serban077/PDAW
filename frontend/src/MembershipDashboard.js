import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './App';
import { useNavigate } from 'react-router-dom';
import './MembershipDashboard.css';


// Adaugă această funcție după importuri
const parseFeatures = (features) => {
  if (!features) return [];
  
  try {
    if (typeof features === 'string') {
      return JSON.parse(features);
    }
    if (Array.isArray(features)) {
      return features;
    }
    return [];
  } catch (error) {
    console.error('Error parsing features:', error);
    return [];
  }
};

// Icon components using inline SVG (same as your original file)
const Icons = {
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  Activity: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  ),
  CreditCard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  ),
  BarChart2: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  Clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  LogOut: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  ),
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  ),
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  ),
  WorkoutIcon: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 17c0 .53-.21 1.04-.586 1.414S13.03 19 12.5 19s-1.04-.21-1.414-.586S10.5 17.53 10.5 17c0-.53.21-1.04.586-1.414S11.97 15 12.5 15s1.04.21 1.414.586S14.5 16.47 14.5 17Z"></path>
      <path d="m20.1 8.5-3.4 1.1-1.1-1.1"></path>
      <path d="m14.5 8.5-2.2 1.1-3-3.4"></path>
      <path d="m3.9 8.5 3.4 1.1 1.1-1.1"></path>
    </svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
  AlertTriangle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  )
};

// Define tab components
const Dashboard = ({ subscriptions, loading, activeSubscription, handleRenewSubscription }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSubscriptionName = (type) => {
    const types = {
      'basic': 'Basic',
      'premium': 'Premium',
      'vip': 'VIP',
      'full': 'FULL'
    };
    return types[type] || type;
  };

  const getRemainingDays = (expiryDate) => {
    if (!expiryDate) return 0;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  const handleSubscribeNow = () => {
    navigate('/subscribe');
  };


  return (
    <div className="dashboard-content">
      {/* Subscription Card */}
      <div className="active-subscription-banner">
        <div className="subscription-status">
          <div className="status-icon">
            {activeSubscription ? <Icons.Shield /> : <Icons.Clock />}
          </div>
          <div className="status-details">
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Se încarcă informațiile abonamentului...</p>
              </div>
            ) : activeSubscription ? (
              <>
                <h3>Abonament Activ</h3>
                <p>Valabil până pe: {formatDate(activeSubscription.end_date)}</p>
                <p className="detail-value highlight">
                  {activeSubscription.subscription_name || getSubscriptionName(activeSubscription.name)}
                </p>
                <div className="subscription-progress">
                  <div className="progress-label">
                    <span>Zile rămase: {getRemainingDays(activeSubscription.end_date)}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${Math.min((getRemainingDays(activeSubscription.end_date) / 30) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
                <button 
                  className="auth-button" 
                  style={{ marginTop: '1rem' }}
                  onClick={handleRenewSubscription}
                >
                  Reînnoiește Abonamentul
                </button>
              </>
            ) : (
              <>
                <h3>Nu ai un abonament activ</h3>
                <p>Alege unul dintre abonamentele disponibile pentru a accesa facilitățile sălii.</p>
                <button 
                  className="auth-button" 
                  style={{ marginTop: '1rem' }}
                  onClick={handleSubscribeNow}
                >
                  Abonează-te Acum
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="subscription-plans">
        <div className="plan-card">
          <div className="fitness-icon">
            <Icons.WorkoutIcon />
          </div>
          <h3>Evoluție Antrenamente</h3>
          <p>Vezi progresul tău și statistici de antrenament.</p>
        </div>
        
        <div className="plan-card">
          <div className="fitness-icon">
            <Icons.CreditCard />
          </div>
          <h3>Facturi & Plăți</h3>
          <p>Accesează istoricul plăților și facturile tale.</p>
        </div>
        
        <div className="plan-card">
          <div className="fitness-icon">
            <Icons.BarChart2 />
          </div>
          <h3>Statistici Detaliate</h3>
          <p>Analizează performanța ta cu grafice avansate.</p>
        </div>
      </div>

      {/* Featured Article */}
      <div className="subscriptions-history-container">
        <h2>Articol Recomandat</h2>
        <div style={{ 
          position: 'relative',
          borderRadius: '15px',
          overflow: 'hidden',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <img 
            src="/api/placeholder/800/400" 
            alt="Sfaturi pentru Refacerea După Antrenament" 
            style={{ width: '100%', height: '250px', objectFit: 'cover' }}
          />
          <div style={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '2rem',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            color: 'white'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Sfaturi pentru Refacerea După Antrenament
            </h3>
            <button className="auth-button">
              Citește Articolul
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Subscribe tab
const Subscribe = ({ handlePurchaseSubscription, purchaseStatus }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Try the new API endpoint first
        let response;
        try {
          response = await axios.get('http://localhost:5000/api/subscriptions/plans', {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (err) {
          // Fallback to payment endpoint if subscriptions endpoint fails
          response = await axios.get('http://localhost:5000/api/payment/plans', {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        
        if (response.data.success && response.data.plans) {
          setSubscriptions(response.data.plans);
        } else {
          setError('Nu s-au putut încărca abonamentele');
        }
        setLoading(false);
      } catch (err) {
        console.error('Eroare la încărcarea abonamentelor:', err);
        setError(err.response?.data?.message || 'Eroare la încărcarea abonamentelor');
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  const handleSelectSubscription = (subscription) => {
    setSelectedSubscription(subscription);
  };

  const handlePurchase = async () => {
    if (!selectedSubscription) {
      setError('Vă rugăm selectați un abonament');
      return;
    }
    
    // Call the purchase function from parent component
    const success = await handlePurchaseSubscription(selectedSubscription.id);
    
    if (success) {
      // Navigate to success page or refresh data
      navigate('/dashboard');
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Se încarcă abonamentele disponibile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-content">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button 
            className="auth-button" 
            onClick={() => window.location.reload()}
          >
            Încearcă din nou
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Alege un Abonament</h2>
      
      {purchaseStatus.error && (
        <div className="error-container" style={{ marginBottom: '2rem' }}>
          <Icons.AlertTriangle />
          <p className="error-message">{purchaseStatus.error}</p>
        </div>
      )}
      
      <div className="subscription-plans">
        {subscriptions.length > 0 ? (
          subscriptions.map((subscription) => (
            <div 
              key={subscription.id} 
              className={`plan-card ${selectedSubscription?.id === subscription.id ? 'selected' : ''}`}
              onClick={() => handleSelectSubscription(subscription)}
            >
              <h3>{subscription.name}</h3>
              <div className="plan-price">{subscription.price} RON</div>
              <div className="plan-duration">
                {subscription.duration_days} {subscription.duration_days === 1 ? 'zi' : 'zile'}
              </div>
              {subscription.description && (
                <p className="plan-description">{subscription.description}</p>
              )}
              <ul className="plan-features">
                {parseFeatures(subscription.features).map((feature, index) => (
                  <li key={index}>✓ {feature}</li>
                ))}
              </ul>
              <button 
                className={`auth-button ${selectedSubscription?.id === subscription.id ? 'selected' : ''}`}
                onClick={() => handleSelectSubscription(subscription)}
              >
                {selectedSubscription?.id === subscription.id ? 'Selectat' : 'Selectează'}
              </button>
            </div>
          ))
        ) : (
          <div className="no-subscriptions">
            <p>Nu există abonamente disponibile momentan.</p>
          </div>
        )}
      </div>

      {subscriptions.length > 0 && selectedSubscription && (
        <div className="purchase-container">
          <div className="selected-plan-summary">
            <h3>Abonament Selectat:</h3>
            <p><strong>{selectedSubscription.name}</strong> - {selectedSubscription.price} RON</p>
            <p>Durată: {selectedSubscription.duration_days} zile</p>
          </div>
          
          <button 
            className="auth-button purchase-button"
            onClick={handlePurchase}
            disabled={purchaseStatus.loading}
          >
            {purchaseStatus.loading ? (
              <>
                <span className="spinner"></span>
                Se procesează...
              </>
            ) : (
              'Cumpără Abonament'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// History tab for subscription history
const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await axios.get('http://localhost:5000/api/subscriptions/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setHistory(response.data.history || []);
        } else {
          setError('Nu s-a putut încărca istoricul');
        }
      } catch (err) {
        console.error('Error fetching history:', err);
        setError(err.response?.data?.message || 'Eroare la încărcarea istoricului');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Se încarcă istoricul abonamentelor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-content">
        <div className="error-container">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Istoric Abonamente</h2>
      
      {history.length > 0 ? (
        <div className="history-list">
          {history.map((item, index) => (
            <div key={index} className="history-item">
              <div className="history-info">
                <h3>{item.subscription_name || item.name}</h3>
                <p>Perioada: {formatDate(item.start_date)} - {formatDate(item.end_date)}</p>
                <p>Preț: {item.price} RON</p>
                <p>Status: <span className={`status ${item.status}`}>{item.status}</span></p>
              </div>
              <div className="history-status">
                {item.status === 'active' ? <Icons.CheckCircle /> : <Icons.Clock />}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-history">
          <p>Nu ai încă abonamente în istoric.</p>
        </div>
      )}
    </div>
  );
};

// Security tab for managing 2FA
const Security = ({ userData }) => {
  const [has2FA, setHas2FA] = useState(userData?.has2FA || false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { logout } = useContext(AuthContext);
  
  const toggle2FA = async () => {
    if (has2FA) {
      // Disable 2FA with confirmation
      if (window.confirm('Ești sigur că vrei să dezactivezi autentificarea în doi pași? Aceasta reduce securitatea contului tău.')) {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          await axios.post('http://localhost:5000/api/auth/disable-2fa', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setHas2FA(false);
          setMessage('Autentificarea în doi pași a fost dezactivată cu succes.');
          
          // Update userData
          const updatedUserData = { ...userData, has2FA: false };
          localStorage.setItem('userData', JSON.stringify(updatedUserData));
          
        } catch (error) {
          setMessage(error.response?.data?.message || 'Eroare la dezactivarea 2FA');
        } finally {
          setLoading(false);
        }
      }
    } else {
      // Enable 2FA - get QR code
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:5000/api/auth/setup-2fa', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setQrCodeUrl(response.data.qrCodeUrl);
        setSecretKey(response.data.secretKey);
        setShowQRCode(true);
        
      } catch (error) {
        setMessage(error.response?.data?.message || 'Eroare la configurarea 2FA');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const verifyAndEnable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setMessage('Codul trebuie să aibă 6 cifre');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/verify-2fa', {
        code: verificationCode
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setHas2FA(true);
      setShowQRCode(false);
      setMessage('Autentificarea în doi pași a fost activată cu succes!');
      
      // Update userData
      const updatedUserData = { ...userData, has2FA: true };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      
    } catch (error) {
      setMessage(error.response?.data?.message || 'Cod invalid. Încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-content">
      <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Securitate Cont</h2>
      
      <div className="stats-container">
        <h3 style={{ marginBottom: '1.5rem' }}>Autentificare în Doi Pași</h3>
        
        <div className="info-box">
          <h4>Ce este Autentificarea în Doi Pași?</h4>
          <p>
            Autentificarea în doi pași adaugă un nivel suplimentar de securitate contului tău. 
            Pe lângă parolă, vei avea nevoie de un cod generat de o aplicație precum Google Authenticator.
          </p>
        </div>
        
        {message && (
          <div className={`status-message ${message.includes('succes') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
        
        {showQRCode ? (
          <div className="qr-container">
            <p style={{ marginBottom: '1rem', textAlign: 'center' }}>
              Scanează acest cod QR cu aplicația Google Authenticator sau o altă aplicație de autentificare:
            </p>
            
            <div className="qr-code">
              <img 
                src={qrCodeUrl} 
                alt="QR Code pentru 2FA" 
                style={{ 
                  maxWidth: '200px',
                  display: 'block',
                  margin: '0 auto'
                }} 
              />
            </div>
            
            <div className="secret-key">
              {secretKey}
            </div>
            
            <div style={{ marginTop: '2rem' }}>
              <p style={{ marginBottom: '1rem' }}>
                Introdu codul din aplicația de autentificare:
              </p>
              
              <input
                type="text"
                maxLength="6"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.2rem',
                  textAlign: 'center',
                  letterSpacing: '0.5rem',
                  marginBottom: '1rem',
                  borderRadius: '10px',
                  border: '2px solid #e0e0e0'
                }}
                placeholder="123456"
              />
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className="auth-button secondary"
                  onClick={() => setShowQRCode(false)}
                >
                  Anulează
                </button>
                <button
                  className="auth-button"
                  onClick={verifyAndEnable2FA}
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Verificare...
                    </>
                  ) : (
                    'Verifică și Activează'
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '2rem' }}>
            <div className="switch-container">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={has2FA}
                  onChange={toggle2FA}
                  disabled={loading}
                />
                <span className="slider"></span>
              </label>
              <span style={{ marginLeft: '1rem' }}>
                Autentificare în doi pași: <strong>{has2FA ? 'Activată' : 'Dezactivată'}</strong>
              </span>
            </div>
            
            <button
              className={`auth-button ${has2FA ? 'danger' : ''}`}
              onClick={toggle2FA}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Se procesează...
                </>
              ) : has2FA ? (
                'Dezactivează Autentificarea în Doi Pași'
              ) : (
                'Activează Autentificarea în Doi Pași'
              )}
            </button>
            
            <button
              className="auth-button danger"
              style={{ marginTop: '2rem' }}
              onClick={logout}
            >
              <Icons.LogOut style={{ marginRight: '0.5rem' }} />
              Deconectare
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Main dashboard component
const MembershipDashboard = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState({});
  const [userData, setUserData] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [purchaseStatus, setPurchaseStatus] = useState({ loading: false, error: null });
  
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  // Fetch user data and subscriptions
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Get user data from local storage
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          setUserData(JSON.parse(storedUserData));
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }
        
        // Fetch user profile
        try {
          const userResponse = await axios.get('http://localhost:5000/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (userResponse.data.success) {
            setUserProfile(userResponse.data.user || {});
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
        
        // Check for active subscription
        try {
          const subscriptionResponse = await axios.get('http://localhost:5000/api/subscriptions/check-active', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (subscriptionResponse.data.success && subscriptionResponse.data.hasActiveSubscription) {
            setActiveSubscription(subscriptionResponse.data.activeSubscription);
          }
        } catch (err) {
          console.error('Error checking active subscription:', err);
        }
        
        // Fetch all available subscriptions
        try {
          const subscriptionsResponse = await axios.get('http://localhost:5000/api/subscriptions/plans', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (subscriptionsResponse.data.success) {
            setSubscriptions(subscriptionsResponse.data.plans || []);
          }
        } catch (err) {
          console.error('Error fetching subscriptions:', err);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // If token is invalid, logout
        if (error.response?.status === 401) {
          logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [logout, navigate]);

  const handlePurchaseSubscription = async (subscriptionId) => {
    setPurchaseStatus({ loading: true, error: null });
    
    try {
      const token = localStorage.getItem('token');
      
      // First, try to create the subscription purchase
      const response = await axios.post(
        'http://localhost:5000/api/subscriptions/purchase',
        { subscription_id: subscriptionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update active subscription immediately
        setActiveSubscription(response.data.subscription);
        
        // Show success message
        setPurchaseStatus({ 
          loading: false, 
          error: null,
          success: true 
        });
        
        // Refresh the page data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
        return true;
      } else {
        throw new Error(response.data.message || 'Eroare la procesarea abonamentului');
      }
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      
      let errorMessage = 'Eroare la cumpărarea abonamentului';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setPurchaseStatus({ 
        loading: false, 
        error: errorMessage 
      });
      
      return false;
    }
  };

  const handleRenewSubscription = () => {
    setActiveTab('subscribe');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            subscriptions={subscriptions}
            loading={loading}
            activeSubscription={activeSubscription}
            handleRenewSubscription={handleRenewSubscription}
          />
        );
      case 'subscribe':
        return (
          <Subscribe 
            handlePurchaseSubscription={handlePurchaseSubscription}
            purchaseStatus={purchaseStatus}
          />
        );
      case 'history':
        return <History />;
      case 'security':
        return <Security userData={userData} />;
      default:
        return (
          <Dashboard 
            subscriptions={subscriptions}
            loading={loading}
            activeSubscription={activeSubscription}
            handleRenewSubscription={handleRenewSubscription}
          />
        );
    }
  };

  return (
    <div className="membership-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1>Bun venit, {userProfile.first_name || userData?.firstName || 'Membru'}!</h1>
            <p>Gestionează-ți abonamentul și urmărește-ți progresul</p>
          </div>
          <div className="user-info">
            <div className="user-avatar">
              <Icons.User />
            </div>
            <div className="user-details">
              <span className="user-name">
                {userProfile.first_name && userProfile.last_name 
                  ? `${userProfile.first_name} ${userProfile.last_name}`
                  : userData?.email || 'Utilizator'
                }
              </span>
              <span className="user-email">{userData?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-nav">
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Icons.Dashboard />
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-tab ${activeTab === 'subscribe' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscribe')}
          >
            <Icons.CreditCard />
            <span>Abonamente</span>
          </button>
          <button 
            className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Icons.Activity />
            <span>Istoric</span>
          </button>
          <button 
            className={`nav-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Icons.Settings />
            <span>Securitate</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {purchaseStatus.success && (
          <div className="success-message">
            <Icons.CheckCircle />
            <p>Abonamentul a fost cumpărat cu succes! Pagina se va actualiza în curând...</p>
          </div>
        )}
        
        {renderTabContent()}
      </div>
    </div>
  );
};

export default MembershipDashboard;