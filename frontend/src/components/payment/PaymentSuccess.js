// src/components/payment/PaymentSuccess.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        // Obține session_id din URL
        const urlParams = new URLSearchParams(location.search);
        const sessionId = urlParams.get('session_id');

        if (!sessionId) {
          setError('Sesiunea de plată nu a fost găsită');
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Verifică statusul plății și finalizează abonamentul
        const response = await axios.post(
          'http://localhost:5000/api/subscriptions/complete-purchase',
          { sessionId },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          setSubscription(response.data.subscription);
          setPaymentDetails({
            sessionId,
            amount: response.data.amount || 0,
            currency: 'RON'
          });
        } else {
          setError('A apărut o eroare la confirmarea plății');
        }
      } catch (err) {
        console.error('Eroare la confirmarea plății:', err);
        setError(err.response?.data?.message || 'A apărut o eroare la procesarea plății');
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [location, navigate]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleDownloadInvoice = () => {
    // Implementează descărcarea facturii
    console.log('Descarcă factura pentru:', subscription?.id);
  };

  if (loading) {
    return (
      <div className="payment-success-container">
        <div className="payment-status loading">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <h2>Se procesează plata...</h2>
          <p>Vă rugăm să așteptați confirmarea plății.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-success-container">
        <div className="payment-status error">
          <div className="status-icon error-icon">
            ❌
          </div>
          <h2>Eroare la procesarea plății</h2>
          <p>{error}</p>
          <div className="action-buttons">
            <button 
              onClick={() => navigate('/subscribe')} 
              className="btn btn-primary"
            >
              Încearcă din nou
            </button>
            <button 
              onClick={handleGoToDashboard} 
              className="btn btn-secondary"
            >
              Înapoi la Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-success-container">
      <div className="payment-status success">
        <div className="status-icon success-icon">
          ✅
        </div>
        <h2>Plată realizată cu succes!</h2>
        <p>Abonamentul dvs. a fost activat și este gata de utilizare.</p>
        
        {subscription && (
          <div className="subscription-details">
            <h3>Detalii abonament</h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Plan:</label>
                <span>{subscription.subscription_name}</span>
              </div>
              <div className="detail-item">
                <label>Data început:</label>
                <span>{formatDate(subscription.start_date)}</span>
              </div>
              <div className="detail-item">
                <label>Data expirare:</label>
                <span>{formatDate(subscription.end_date)}</span>
              </div>
              <div className="detail-item">
                <label>Status:</label>
                <span className="status-badge active">Activ</span>
              </div>
            </div>
            
            {subscription.features && (
              <div className="subscription-features">
                <h4>Beneficii incluse:</h4>
                <ul>
                  {subscription.features.map((feature, index) => (
                    <li key={index}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {paymentDetails && (
          <div className="payment-details">
            <h3>Detalii plată</h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>ID Tranzacție:</label>
                <span className="transaction-id">{paymentDetails.sessionId}</span>
              </div>
              <div className="detail-item">
                <label>Metodă de plată:</label>
                <span>Card bancar</span>
              </div>
              <div className="detail-item">
                <label>Data plății:</label>
                <span>{new Date().toLocaleDateString('ro-RO')}</span>
              </div>
            </div>
          </div>
        )}

        <div className="next-steps">
          <h3>Pași următori</h3>
          <ul>
            <li>Abonamentul dvs. este acum activ și puteți accesa sala</li>
            <li>Verificați dashboard-ul pentru detalii complete</li>
            <li>Contactați recepția pentru orice întrebări</li>
          </ul>
        </div>

        <div className="action-buttons">
          <button 
            onClick={handleGoToDashboard}
            className="btn btn-primary"
          >
            Înapoi la Dashboard
          </button>
          <button 
            onClick={handleDownloadInvoice}
            className="btn btn-secondary"
          >
            Descarcă Factura
          </button>
        </div>

        <div className="contact-info">
          <p>
            <strong>Aveți întrebări?</strong> Contactați-ne la: 
            <a href="tel:+40123456789"> +40 123 456 789</a> sau 
            <a href="mailto:support@uniluxfitness.ro"> support@uniluxfitness.ro</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;