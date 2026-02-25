import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/PayPalStyles.css';

const CancelPage = () => {
  return (
    <div className="page-container cancel-page">
      <h1>Payment Cancelled</h1>
      <p>You have cancelled the payment. No charges were made.</p>
      <p>If you changed your mind, you can try again.</p>
      <Link to="/user/buy-coins" className="try-again-link">Try Again</Link>
      <Link to="/user" className="home-link">Go to Home</Link>
    </div>
  );
};

export default CancelPage;