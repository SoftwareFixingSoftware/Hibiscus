import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import '../styles/auth.css';

const API_BASE = "http://localhost:9019";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [location]);

  const validatePassword = () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) return;
    if (!token) {
      setError('Invalid reset link');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          newPassword: password 
        })
      });

      if (res.ok) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.message || 'Failed to reset password');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="hib-auth-layout">
        <div className="hib-auth-card" style={{ maxWidth: '480px' }}>
          <div className="hib-text-center hib-p-8">
            <div className="hib-error-icon hib-mx-auto hib-mb-6">
              <FaExclamationCircle className="hib-w-16 hib-h-16 hib-text-error" />
            </div>
            <h3 className="hib-text-xl hib-font-semibold hib-mb-2">Invalid Reset Link</h3>
            <p className="hib-text-muted hib-mb-6">
              This password reset link is invalid or has expired.
            </p>
            <button 
              onClick={() => navigate('/forgot-password')}
              className="hib-btn-primary"
            >
              Request New Reset Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hib-auth-layout">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="hib-auth-card"
        style={{ maxWidth: '480px' }}
      >
        <div className="hib-form-wrapper">
          <div className="hib-form-header">
            <div className="hib-brand-logo">
              <img src="/logo.png" alt="Hibiscus" className="hib-logo-image" />
              <h1 className="hib-brand-title">Hibiscus</h1>
            </div>
            <h2 className="hib-form-title">Create New Password</h2>
            <p className="hib-form-switch hib-text-muted">
              Your new password must be different from previously used passwords.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="hib-form">
            {error && (
              <div className="hib-alert-error hib-mb-4">
                <div className="hib-alert-content">
                  <FaExclamationCircle className="hib-alert-icon" />
                  <p>{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="hib-alert-success hib-mb-4">
                <div className="hib-alert-content">
                  <FaCheckCircle className="hib-alert-icon" />
                  <p>{success}</p>
                </div>
              </div>
            )}

            <div className="hib-form-group">
              <label className="hib-form-label">New Password</label>
              <div className="hib-password-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => validatePassword()}
                   className="hib-form-input"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hib-password-toggle"
                  aria-label="Toggle password visibility"
                  disabled={loading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <p className="hib-text-xs hib-text-muted hib-mt-2">
                Must be at least 6 characters long
              </p>
            </div>

            <div className="hib-form-group">
              <label className="hib-form-label">Confirm New Password</label>
              <div className="hib-password-container">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => validatePassword()}
                   className="hib-form-input"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="hib-password-toggle"
                  aria-label="Toggle password visibility"
                  disabled={loading}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="hib-btn-primary hib-mt-6">
              {loading ? (
                <div className="hib-loading-container">
                  <div className="hib-loading-spinner">
                    <svg className="hib-spinner" viewBox="0 0 24 24">
                      <circle className="hib-spinner-track" cx="12" cy="12" r="10" />
                      <circle className="hib-spinner-indicator" cx="12" cy="12" r="10" />
                    </svg>
                  </div>
                  <span>Resetting Password...</span>
                </div>
              ) : 'Reset Password'}
            </button>

            <div className="hib-mt-8 hib-pt-6 hib-border-t hib-border">
              <button 
                onClick={() => navigate('/login')}
                className="hib-block hib-text-center hib-w-full hib-text-muted hover:hib-text-primary"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}