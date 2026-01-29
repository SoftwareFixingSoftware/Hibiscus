import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import '../auth/styles/auth.css';

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

      // ---- intelligent error mapping ----
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
      console.error(err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-card"
        style={{ maxWidth: '480px' }}
      >
        <div className="form-wrapper">
          <div className="form-header">
            <div className="brand-logo">
              <div className="logo-icon">
                <span className="logo-text">H</span>
              </div>
              <h1 className="brand-title">Hibiscus</h1>
            </div>
            <h2 className="form-title">Reset Your Password</h2>
            <p className="form-switch">
              Remember your password? <Link to="/login" className="form-link">Sign in here</Link>
            </p>
          </div>

          <AnimatePresence>
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center p-8"
              >
                <div className="success-icon mx-auto mb-6">
                  <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Check Your Email</h3>
                <p className="text-gray-400 mb-6">
                  We've sent password reset instructions to <strong>{email}</strong>
                </p>
                <button
                  onClick={() => resetState()}
                  className="text-indigo-400 hover:text-indigo-300 text-sm"
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
                className="form"
              >
                {error && (
                  <div className="alert-error mb-4">
                    <div className="alert-content">
                      <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>{error}</p>
                    </div>
                  </div>
                )}

                {hint && (
                  <div className="alert-info mb-4">
                    <p>{hint}</p>
                    {hint.toLowerCase().includes('google') && (
                      <div className="mt-2 text-sm">
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
                          Continue to sign in →
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="form-input"
                    disabled={loading}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Password reset is only available for email/password accounts.
                  </p>
                </div>

                <button type="submit" disabled={loading} className="btn-primary mt-6">
                  {loading ? (
                    <div className="loading-container">
                      <div className="loading-spinner">
                        <svg className="spinner" viewBox="0 0 24 24">
                          <circle className="spinner-track" cx="12" cy="12" r="10" />
                          <circle className="spinner-indicator" cx="12" cy="12" r="10" />
                        </svg>
                      </div>
                      <span>Sending Reset Link...</span>
                    </div>
                  ) : 'Send Reset Link'}
                </button>

                <div className="mt-8 pt-6 border-t border-gray-800">
                  <Link to="/register" className="block text-center text-indigo-400 hover:text-indigo-300">
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
