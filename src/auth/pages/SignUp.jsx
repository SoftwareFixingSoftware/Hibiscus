import { useState, useRef, useEffect } from 'react';
import SocialAuth from '../components/SocialAuth';
import TurnstileWidget from '../components/TurnstileWidget';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import '../styles/auth.css';
import SEO from "../../components/SEO";

const API_BASE = process.env.REACT_APP_API_BASE || "https://api.breachpen.co.ke";

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({ password: false, confirm: false });
  const [turnstileToken, setTurnstileToken] = useState('');
  const passwordRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (!form.username && form.email) {
      const candidate = form.email
        .split('@')[0]
        .replace(/[^a-zA-Z0-9._-]/g, '')
        .slice(0, 30);

      setForm(f => ({ ...f, username: candidate }));
    }
  }, [form.email, form.username]);

  const handleSocialError = (type, message) => {
    if (type === 'error') {
      setError(message);
    }
  };

  const validateForm = () => {
    setError('');

    if (!form.name?.trim() || !form.email?.trim() || !form.password || !form.confirmPassword) {
      setError('Please fill in all required fields.');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (form.username && !/^[a-zA-Z0-9._-]{3,30}$/.test(form.username)) {
      setError('Username may contain letters, numbers, . _ - and must be 3–30 characters.');
      return false;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    if (!turnstileToken) {
      setError('Please complete the security check.');
      return false;
    }

    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const verifyRes = await fetch(`${API_BASE}/api/auth/cloudflare-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
        signal: controller.signal
      });

      const verifyBody = await verifyRes.text().then(txt => {
        try {
          return JSON.parse(txt);
        } catch {
          return { raw: txt };
        }
      });

      if (!verifyRes.ok) {
        const verifyMsg =
          verifyBody?.message ||
          verifyBody?.error ||
          verifyBody?.raw ||
          'Security check failed. Please try again.';
        setError(verifyMsg);
        return;
      }

      const payload = {
        name: form.name.trim(),
        username: form.username?.trim() || form.email.split('@')[0],
        email: form.email.trim().toLowerCase(),
        password: form.password
      };

      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const body = await res.text().then(txt => {
        try {
          return JSON.parse(txt);
        } catch {
          return { raw: txt };
        }
      });

      if (!res.ok) {
        let msg = body?.message || body?.error || body?.raw || 'Signup failed. Please try again.';
        if (res.status === 409) {
          msg = body?.message || 'Email or username already in use.';
        } else if (res.status === 400) {
          msg = body?.message || 'Invalid signup data.';
        } else if (res.status >= 500) {
          msg = 'Server error. Please try again later.';
        }

        setError(msg);
        setForm(f => ({ ...f, password: '', confirmPassword: '' }));
        passwordRef.current?.focus?.();
      } else {
        setSuccess('Account created! Check your email for the verification link.');
        setForm({ name: '', username: '', email: '', password: '', confirmPassword: '' });
        setTurnstileToken('');

        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 5000);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <>
      <SEO
        title="Create Account | Hibiscus"
        description="Join Hibiscus to access premium audio podcasts, playbooks, and personalized listening experiences."
        keywords="hibiscus register, create account, audio platform signup"
        url="https://hibiscus.breachpen.co.ke/register"
        image="https://hibiscus.breachpen.co.ke/logo.png"
      />

      <div className="hib-auth-layout">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="hib-auth-card"
          role="main"
          aria-labelledby="signup-heading"
        >
          <div className="hib-auth-grid">
            <div className="hib-form-container">
              <div className="hib-form-wrapper">
                <div className="hib-form-header">
                  <div className="hib-brand-logo" aria-hidden>
                    <img src="/logo.png" alt="Hibiscus" className="hib-logo-image" />
                    <h1 className="hib-brand-title">Hibiscus</h1>
                  </div>
                  <h2 id="signup-heading" className="hib-form-title">Create Account</h2>
                  <p className="hib-form-switch">
                    Already have an account? <Link to="/login" className="hib-form-link">Sign in here</Link>
                  </p>
                </div>

                <form onSubmit={submit} className="hib-form" aria-describedby={error ? 'form-error' : undefined}>
                  <div className="hib-form-grid">
                    <div className="hib-form-group">
                      <label className="hib-form-label" htmlFor="name">Full Name *</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="haka luke"
                        className="hib-form-input"
                        disabled={loading}
                        required
                        autoComplete="name"
                      />
                    </div>

                    <div className="hib-form-group">
                      <label className="hib-form-label" htmlFor="username">Username (optional)</label>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        placeholder="luke"
                        className="hib-form-input"
                        disabled={loading}
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="hib-form-group">
                    <label className="hib-form-label" htmlFor="email">Email Address *</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="hib-form-input"
                      disabled={loading}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="hib-form-grid">
                    <div className="hib-form-group">
                      <label className="hib-form-label" htmlFor="password">Password *</label>
                      <div className="hib-password-container">
                        <input
                          id="password"
                          name="password"
                          ref={passwordRef}
                          type={showPassword.password ? 'text' : 'password'}
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          className="hib-form-input"
                          disabled={loading}
                          required
                          autoComplete="new-password"
                          aria-invalid={!!error && error.toLowerCase().includes('password')}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword({ ...showPassword, password: !showPassword.password })
                          }
                          className="hib-password-toggle"
                          disabled={loading}
                          aria-label={showPassword.password ? 'Hide password' : 'Show password'}
                        >
                          {showPassword.password ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className="hib-form-group">
                      <label className="hib-form-label" htmlFor="confirmPassword">Confirm Password *</label>
                      <div className="hib-password-container">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showPassword.confirm ? 'text' : 'password'}
                          value={form.confirmPassword}
                          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                          className="hib-form-input"
                          disabled={loading}
                          required
                          autoComplete="new-password"
                          aria-invalid={!!error && error.toLowerCase().includes('password')}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword({ ...showPassword, confirm: !showPassword.confirm })
                          }
                          className="hib-password-toggle"
                          disabled={loading}
                          aria-label={showPassword.confirm ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="hib-form-group">
                    <label className="hib-form-label">Security Check</label>
                    <TurnstileWidget onToken={(token) => setTurnstileToken(token)} />
                  </div>

                  <div className="hib-form-checkbox">
                    <input id="tos" type="checkbox" required className="hib-checkbox" disabled={loading} />
                    <label htmlFor="tos" className="hib-checkbox-text">
                      I agree to the{' '}
                      <Link to="/terms" className="hib-checkbox-link">Terms of Service</Link>,{' '}
                      <Link to="/privacy" className="hib-checkbox-link">Privacy Policy</Link>, and{' '}
                      <Link to="/cookies" className="hib-checkbox-link">Cookie Policy</Link>.
                    </label>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="hib-alert-error"
                        id="form-error"
                        role="alert"
                        aria-live="assertive"
                      >
                        <div className="hib-alert-content">
                          <FaExclamationCircle className="hib-alert-icon" />
                          <p>{error}</p>
                        </div>
                      </motion.div>
                    )}

                    {success && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="hib-alert-success"
                        role="status"
                        aria-live="polite"
                      >
                        <div className="hib-alert-content">
                          <FaCheckCircle className="hib-alert-icon" />
                          <p>{success}</p>
                          <p className="hib-text-sm">
                            You will be redirected to <Link to="/login">login</Link> shortly.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button type="submit" disabled={loading} className="hib-btn-primary" aria-busy={loading}>
                    {loading ? (
                      <div className="hib-loading-container" aria-hidden>
                        <div className="hib-loading-spinner">
                          <svg className="hib-spinner" viewBox="0 0 24 24">
                            <circle className="hib-spinner-track" cx="12" cy="12" r="10" />
                            <circle className="hib-spinner-indicator" cx="12" cy="12" r="10" />
                          </svg>
                        </div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </form>

                <div className="hib-divider-section">
                  <div className="hib-divider">
                    <span className="hib-divider-text">Or sign up with</span>
                  </div>
                  <SocialAuth disabled={loading} type="signup" onError={handleSocialError} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}