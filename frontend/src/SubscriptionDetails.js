import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AuthForm.css';

const SubscriptionDetails = ({ onLogout, userData }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/subscriptions/${userData.id}`);
        if (response.data) {
          setSubscription(response.data);
        } else {
          throw new Error('Nu există abonament activ');
        }
      } catch (error) {
        setError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    if (userData?.id) {
      fetchSubscription();
    }
  }, [userData]);

  const handleDelete = async () => {
    if (window.confirm('Sigur doriți să ștergeți abonamentul?')) {
      try {
        await axios.delete(`http://localhost:5000/subscriptions/${userData.id}`);
        navigate('/dashboard');
      } catch (error) {
        setError('Eroare la ștergerea abonamentului');
      }
    }
  };

  if (loading) return <div className="loading-message">Se încarcă...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>🔍 Detalii Abonament</h1>
        <button onClick={onLogout} className="auth-button danger">✖ Deconectare</button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {subscription && (
        <div className="subscription-card">
          <div className="subscription-info">
            <h2>Abonament {subscription.type.toUpperCase()}</h2>
            <div className="subscription-details">
              <p>
                <span className="detail-label">Start:</span>
                {new Date(subscription.start_date).toLocaleDateString('ro-RO')}
              </p>
              <p>
                <span className="detail-label">Expiră:</span>
                {new Date(subscription.expiry_date).toLocaleDateString('ro-RO')}
              </p>
              <p>
                <span className="detail-label">Plată cu:</span>
                {subscription.payment_method}
              </p>
              <p className="time-remaining">
                Zile rămase: {Math.ceil(
                  (new Date(subscription.expiry_date) - new Date()) / (1000 * 3600 * 24)
                )}
              </p>
            </div>
          </div>
          
          <div className="subscription-actions">
            <button 
              className="auth-button"
              onClick={() => navigate('/dashboard')}
            >
              ← Înapoi la Dashboard
            </button>
            <button
              className="auth-button danger"
              onClick={handleDelete}
            >
              🗑️ Șterge Abonament
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionDetails;