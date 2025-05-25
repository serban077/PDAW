import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import '../../AuthForm.css';
import './SubscriptionPurchase.css';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_test_key');

// Card input component styles
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Segoe UI", "Roboto", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  }
};

// Checkout Form Component
const CheckoutForm = ({ selectedPlan, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const stripe = useStripe();
  const elements = useElements();

  // Get client secret for the payment
  useEffect(() => {
    if (!selectedPlan) return;

    const getPaymentIntent = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.post(
          'http://localhost:5000/api/payment/create-payment-intent',
          { planId: selectedPlan.id },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setClientSecret(response.data.clientSecret);
      } catch (err) {
        setError(err.response?.data?.message || 'Eroare la inițializarea plății');
      } finally {
        setLoading(false);
      }
    };

    getPaymentIntent();
  }, [selectedPlan]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe hasn't loaded yet
      return;
    }

    if (!cardholderName) {
      setError('Vă rugăm să introduceți numele titularului cardului.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: cardholderName
        }
      }
    });

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
    } else if (result.paymentIntent.status === 'succeeded') {
      // Payment successful, update subscription on the backend
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          'http://localhost:5000/api/payment/payment-success',
          { paymentIntentId: result.paymentIntent.id },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        // Call the success callback
        onSuccess(response.data.subscription);
      } catch (err) {
        setError(err.response?.data?.message || 'Plata a fost procesată, dar a apărut o eroare la activarea abonamentului.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="form-section">
        <h3>Detalii abonament</h3>
        <div className="subscription-summary">
          <div className="summary-row">
            <span>Plan:</span>
            <span>{selectedPlan?.name}</span>
          </div>
          <div className="summary-row">
            <span>Preț:</span>
            <span>{selectedPlan?.price} RON</span>
          </div>
          <div className="summary-row">
            <span>Durată:</span>
            <span>{selectedPlan?.duration_days} zile</span>
          </div>
          {selectedPlan?.features && (
            <div className="plan-features-summary">
              <h4>Beneficii incluse:</h4>
              <ul>
                {selectedPlan.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="form-section">
        <h3>Detalii card</h3>
        <div className="form-group">
          <label>Nume titular card</label>
          <input
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="Nume complet"
            required
          />
        </div>

        <div className="form-group">
          <label>Detalii card</label>
          <div className="card-element-container">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="button-group">
        <button 
          type="button" 
          className="auth-button secondary" 
          onClick={onCancel}
          disabled={loading}
        >
          Anulează
        </button>
        <button 
          type="submit" 
          className="auth-button" 
          disabled={loading || !stripe}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Procesare...
            </>
          ) : (
            `Plătește ${selectedPlan?.price} RON`
          )}
        </button>
      </div>
      
      <div className="secure-payment-note">
        <i className="lock-icon">🔒</i>
        <span>Plată securizată prin Stripe. Datele cardului dvs. sunt criptate și securizate.</span>
      </div>
    </form>
  );
};

// Main Subscription Purchase Component
const SubscriptionPurchase = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [purchasedSubscription, setPurchasedSubscription] = useState(null);
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // Fetch subscription plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Try the new API endpoint first
        let response;
        try {
          response = await axios.get('http://localhost:5000/api/subscriptions/plans', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
        } catch (err) {
          // Fallback to payment endpoint if subscriptions endpoint fails
          response = await axios.get('http://localhost:5000/api/payment/plans', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
        }
        
        if (response.data.success && response.data.plans) {
          setPlans(response.data.plans);
          if (response.data.plans.length > 0) {
            setSelectedPlan(response.data.plans[0]);
          }
        } else {
          setError('Nu s-au putut încărca planurile de abonament');
        }
      } catch (err) {
        console.error('Eroare la încărcarea planurilor:', err);
        setError(err.response?.data?.message || 'Eroare la încărcarea planurilor de abonament');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Handle plan selection
  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  // Proceed to checkout
  const handleProceedToCheckout = () => {
    if (!selectedPlan) {
      setError('Vă rugăm să selectați un plan de abonament');
      return;
    }
    setShowCheckout(true);
  };

  // Handle successful purchase
  const handlePurchaseSuccess = (subscription) => {
    setPurchasedSubscription(subscription);
    setPurchaseComplete(true);
  };

  // Go back to plan selection
  const handleBackToPlans = () => {
    setShowCheckout(false);
  };

  // Go to dashboard after purchase
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Render success screen after purchase
  if (purchaseComplete) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="success-container">
            <div className="success-icon">✓</div>
            <h2>Mulțumim pentru achiziție!</h2>
            <p>Abonamentul dvs. a fost activat cu succes.</p>
            
            <div className="subscription-details">
              <div className="detail-row">
                <span>Plan:</span>
                <span>{purchasedSubscription.subscription_name || selectedPlan?.name}</span>
              </div>
              <div className="detail-row">
                <span>Valabil până la:</span>
                <span>{formatDate(purchasedSubscription.end_date)}</span>
              </div>
              <div className="detail-row">
                <span>Status:</span>
                <span className="status-active">Activ</span>
              </div>
            </div>
            
            <button 
              className="auth-button" 
              onClick={handleGoToDashboard}
            >
              Înapoi la Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card subscription-card">
        <h1 style={{ textAlign: 'center', color: 'var(--secondary)', marginBottom: '2rem' }}>
          🏋️♂️ UNILUX FITNESS
        </h1>
        
        {showCheckout ? (
          <>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Finalizare achiziție</h2>
            <Elements stripe={stripePromise}>
              <CheckoutForm 
                selectedPlan={selectedPlan}
                onSuccess={handlePurchaseSuccess}
                onCancel={handleBackToPlans}
              />
            </Elements>
          </>
        ) : (
          <>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Alege un abonament</h2>
            
            {loading ? (
              <div className="loading-spinner-container">
                <div className="spinner"></div>
                <p>Se încarcă planurile de abonament...</p>
              </div>
            ) : error ? (
              <div className="error-message">
                {error}
                <button 
                  className="auth-button secondary" 
                  style={{ marginTop: '1rem' }}
                  onClick={() => window.location.reload()}
                >
                  Reîncarcă
                </button>
              </div>
            ) : (
              <div className="subscription-plans-container">
                {plans.map((plan) => (
                  <div 
                    key={plan.id} 
                    className={`plan-card ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
                    onClick={() => handlePlanSelect(plan)}
                  >
                    <div className="plan-header">
                      <h3>{plan.name}</h3>
                      <div className="plan-price">{plan.price} <span>RON</span></div>
                    </div>
                    
                    <div className="plan-duration">
                      {plan.duration_days} {plan.duration_days === 1 ? 'zi' : 'zile'}
                    </div>

                    {plan.description && (
                      <p className="plan-description">{plan.description}</p>
                    )}
                    
                    <ul className="plan-features">
                      {plan.features && plan.features.map((feature, index) => (
                        <li key={index}>✓ {feature}</li>
                      ))}
                    </ul>
                    
                    <div className="plan-selection">
                      {selectedPlan?.id === plan.id ? (
                        <div className="selected-indicator">✓ Selectat</div>
                      ) : (
                        <button 
                          className="select-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlanSelect(plan);
                          }}
                        >
                          Selectează
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!loading && !error && (
              <div className="plan-action">
                <button 
                  className="auth-button"
                  onClick={handleProceedToCheckout}
                  disabled={!selectedPlan || loading}
                >
                  Continuă spre plată
                </button>
                
                <button 
                  className="auth-button secondary"
                  onClick={() => navigate('/dashboard')}
                >
                  Anulează
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPurchase;