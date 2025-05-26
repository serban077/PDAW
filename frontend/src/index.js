import React from 'react';
import ReactDOM from 'react-dom/client';  // Folosește ReactDOM pentru React 18
import App from './App';
import './index.css';  // Importă fișierul CSS pentru stiluri globale

// Creați un root pentru aplicație
const root = ReactDOM.createRoot(document.getElementById('root'));

// Folosiți metoda `render` pe root
root.render(
  <React.StrictMode>
    <App />  {/* Componenta principală a aplicației */}
  </React.StrictMode>
);
