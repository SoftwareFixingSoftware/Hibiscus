import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/PayPalStyles.css';

const SuccessPage = () => {
  return (
    <div className="user-page-container user-success-page">
      <h1>Payment Successful!</h1>
      <p>Thank you for your purchase. Your coins will be added to your account shortly.</p>
      <p>You can check your balance in your profile.</p>
      <Link to="/user" className="user-home-link">Go to Home</Link>
    </div>
  );
};

export default SuccessPage;