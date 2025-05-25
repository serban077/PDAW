import React from 'react';

const Home = ({ onLogout }) => {
  return (
    <div className="home-container">
      <h1>Welcome to Your App!</h1>
      <p>You are successfully authenticated.</p>
      <button onClick={onLogout} className="auth-button logout-button">
        Logout
      </button>
    </div>
  );
};

export default Home;