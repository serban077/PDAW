// App.js - Actualizat cu suport pentru Admin Dashboard
import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Import componentele
import Login from './Login';
import Register from './Register';
import MembershipDashboard from './MembershipDashboard';
import AdminDashboard from './components/AdminDashboard';
import Home from './Home';
import SubscriptionPurchase from './components/subscription/SubscriptionPurchase';
import PaymentSuccess from './components/payment/PaymentSuccess';
import './App.css';

// Creează AuthContext
export const AuthContext = createContext();

// AuthProvider Component
const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verifică autentificarea la încărcarea aplicației
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');

        if (token && userData) {
          // Verifică dacă token-ul este valid făcând un request la backend
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          try {
            const response = await axios.get('http://localhost:5000/api/auth/verify');
            if (response.data.success) {
              setIsAuthenticated(true);
              setUser({
                ...response.data.user,
                isAdmin: response.data.isAdmin || response.data.user.role === 'admin'
              });
            } else {
              // Token invalid, șterge-l
              localStorage.removeItem('token');
              localStorage.removeItem('userData');
              delete axios.defaults.headers.common['Authorization'];
            }
          } catch (error) {
            console.log('Token invalid sau expirat');
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            delete axios.defaults.headers.common['Authorization'];
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Funcție de login
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setIsAuthenticated(true);
    setUser({
      ...userData,
      isAdmin: userData.isAdmin || userData.role === 'admin'
    });
  };

  // Funcție de logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook pentru folosirea AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Componenta pentru protejarea rutelor
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Se verifică autentificarea...</p>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Componenta pentru rutele de admin
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Se verifică autentificarea...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.isAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Componenta pentru rutele publice (doar pentru utilizatorii neautentificați)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Se verifică autentificarea...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirecționează la dashboard-ul corespunzător în funcție de rol
    if (user?.isAdmin || user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

// Componenta principală App
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Rută principală - redirecționează către login sau dashboard */}
            <Route path="/" element={<RedirectRoute />} />
            
            {/* Rute publice - doar pentru utilizatorii neautentificați */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            
            <Route path="/home" element={
              <PublicRoute>
                <Home />
              </PublicRoute>
            } />
            
            {/* Rute protejate pentru admin */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            
            {/* Rute protejate pentru utilizatori normali */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <MembershipDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/subscribe" element={
              <ProtectedRoute>
                <SubscriptionPurchase />
              </ProtectedRoute>
            } />
            
            <Route path="/payment-success" element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            } />
            
            {/* Rută pentru cazurile neidentificate */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Componenta pentru redirecționarea de pe pagina principală
const RedirectRoute = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Se încarcă...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirecționează la dashboard-ul corespunzător în funcție de rol
    if (user?.isAdmin || user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Navigate to="/login" replace />;
};

export default App;