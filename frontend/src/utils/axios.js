// Adaugă acest cod în src/utils/axios.js (nou fișier)
import axios from 'axios';

// Creează o instanță axios configurată
const apiClient = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor pentru a adăuga token-ul automat
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor pentru gestionarea erorilor globale
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject({
        message: 'Eroare de conexiune. Verificați conexiunea la internet.',
        type: 'network'
      });
    }

    // Handle rate limiting
    if (error.response.status === 429) {
      console.error('Rate limited:', error.response.data);
      return Promise.reject({
        message: error.response.data.message || 'Prea multe cereri. Încercați din nou mai târziu.',
        type: 'rate_limit'
      });
    }

    // Handle CORS errors
    if (error.response.status === 403 && error.response.data?.message?.includes('CORS')) {
      console.error('CORS Error:', error.response.data);
      return Promise.reject({
        message: 'Eroare de securitate. Vă rugăm să contactați administratorul.',
        type: 'cors'
      });
    }

    // Handle authentication errors
    if (error.response.status === 401) {
      // Clear stored auth data
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      delete axios.defaults.headers.common['Authorization'];
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
