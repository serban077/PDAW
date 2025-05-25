// src/components/payment/PaymentPage.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PaymentSuccess.css';

const PaymentPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Verifică autentificarea
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Obține detaliile abonamentului din state sau URL
    const init = async () => {
      try {
        const subscriptionId = location.state?.subscriptionId;
        
        if (!subscriptionId) {
          setError('Detalii abonament lipsă. Vă rugăm să selectați un abonament.');
          setLoading(false);
          return;
        }

        // Obține detaliile abonamentului
        const response = await axios.get(
          `/api/subscriptions/${subscriptionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success && response.data.subscription) {
          setSubscription(response.data.subscription);
          setLoading(false);
        } else {
          setError('Nu s-au putut încărca detaliile abonamentului');
          setLoading(false);
        }
      } catch (err) {
        console.error('Eroare la obținerea detaliilor abonamentului:', err);
        setError('A apărut o eroare. Vă rugăm să încercați din nou.');
        setLoading(false);
      }
    };

    init();
  }, [location, navigate]);

  const handlePayment = async () => {
    if (!subscription) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Procesează plata
      const response = await axios.post(
        '/api/payment/process',
        { subscriptionId: subscription.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && response.data.checkoutUrl) {
        // Redirecționează către pagina de checkout Stripe
        window.location.href = response.data.checkoutUrl;
      } else {
        setError('Nu s-a putut inițializa plata');
        setLoading(false);
      }
    } catch (err) {
      console.error('Eroare la procesarea plății:', err);
      setError(err.response?.data?.message || 'A apărut o eroare la procesarea plății');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="payment-container">
        <div className="payment-status loading">
          <h2>Se încarcă...</h2>
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-container">
        <div className="payment-status error">
          <h2>Eroare</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/subscriptions')} 
            className="action-button"
          >
            Înapoi la abonamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-card">
        <h2>Finalizează achiziția</h2>
        
        <div className="payment-details">
          <h3>Detalii abonament</h3>
          <div className="subscription-info">
            <p className="subscription-name">{subscription.name}</p>
            <p className="subscription-price">{subscription.price} RON</p>
            <p className="subscription-description">{subscription.description}</p>
          </div>
        </div>
        
        <div className="payment-actions">
          <button 
            onClick={handlePayment}
            className="pay-button"
            disabled={loading}
          >
            {loading ? 'Se procesează...' : 'Plătește acum'}
          </button>
          
          <button 
            onClick={() => navigate('/subscriptions')}
            className="cancel-button"
          >
            Anulează
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;