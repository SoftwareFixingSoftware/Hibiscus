import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import '../styles/auth.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:9019';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState(''); // contextual help (google/github etc)

  const resetState = () => {
    setError('');
    setHint('');
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetState();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        body = { message: text };
      }

      if (res.ok) {
        setSuccess(true);
        return;
      }

      const msg = body?.message || 'Failed to send reset link';

      if (res.status === 400) {
        setError(msg);
        setHint('This account was created using Google or GitHub. Please sign in using that provider.');
      } else if (res.status === 403) {
        setError(msg);
        setHint('Please verify your email address before resetting your password.');
      } else if (res.status === 404) {
        setError('No account found with this email address.');
      } else {
        setError(msg);
      }
    } catch (err) {
       setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <h2 className="hib-form-title">Reset Your Password</h2>
            <p className="hib-form-switch">
              Remember your password? <Link to="/login" className="hib-form-link">Sign in here</Link>
            </p>
          </div>

          <AnimatePresence>
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="hib-text-center hib-p-8"
              >
                <div className="hib-success-icon hib-mx-auto hib-mb-6">
                  <svg className="hib-w-16 hib-h-16 hib-text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="hib-text-xl hib-font-semibold hib-mb-2">Check Your Email</h3>
                <p className="hib-text-muted hib-mb-6">
                  We've sent password reset instructions to <strong>{email}</strong>
                </p>
                <button
                  onClick={() => resetState()}
                  className="hib-text-accent hover:hib-text-accent-hover hib-text-sm"
                >
                  Try a different email
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hib-form"
              >
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

                {hint && (
                  <div className="hib-alert-info hib-mb-4">
                    <p>{hint}</p>
                    {hint.toLowerCase().includes('google') && (
                      <div className="hib-mt-2 hib-text-sm">
                        <Link to="/login" className="hib-text-accent hover:hib-text-accent-hover">
                          Continue to sign in →
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <div className="hib-form-group">
                  <label className="hib-form-label">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="hib-form-input"
                    disabled={loading}
                    required
                  />
                  <p className="hib-text-sm hib-text-muted hib-mt-2">
                    Password reset is only available for email/password accounts.
                  </p>
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
                      <span>Sending Reset Link...</span>
                    </div>
                  ) : 'Send Reset Link'}
                </button>

                <div className="hib-mt-8 hib-pt-6 hib-border-t hib-border">
                  <Link to="/register" className="hib-block hib-text-center hib-text-accent hover:hib-text-accent-hover">
                    Don't have an account? Sign up
                  </Link>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}