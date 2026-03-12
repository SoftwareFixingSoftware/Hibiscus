import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
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
    } catch (err) {
      console.error('Error:', err);
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
              <svg className="hib-w-16 hib-h-16 hib-text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
              <div className="hib-logo-icon">
                <span className="hib-logo-text">H</span>
              </div>
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
                  <svg className="hib-alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="hib-alert-success hib-mb-4">
                <div className="hib-alert-content">
                  <svg className="hib-alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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
                  placeholder="••••••••"
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
                  <svg className="hib-eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </>
                    )}
                  </svg>
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
                  placeholder="••••••••"
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
                  <svg className="hib-eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showConfirmPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </>
                    )}
                  </svg>
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