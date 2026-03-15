import { useState, useRef, useEffect } from 'react';
import AuthAvatar from '../components/AuthAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa'; // removed FaCheck
import '../styles/auth.css';


const API_BASE = "http://localhost:9019";

export default function SignUpAdmin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminCode: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarState, setAvatarState] = useState('idle');
  const [avatarEmotion, setAvatarEmotion] = useState('neutral');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState({ password: false, confirm: false, adminCode: false });
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const adminCodeRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (!form.username && form.email) {
      const candidate = form.email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 30);
      setForm(f => ({ ...f, username: candidate }));
    }
  }, [form.email]);

  const handleFocus = (field) => {
    setAvatarEmotion('curious');
    if (field === 'password' || field === 'confirmPassword') setIsPasswordFocused(true);
  };
  const handleBlur = () => {
    setIsPasswordFocused(false);
    setAvatarEmotion('neutral');
  };

  const validateForm = () => {
    setError('');
    if (!form.name?.trim() || !form.email?.trim() || !form.password || !form.confirmPassword || !form.adminCode) {
      setError('Please fill in all required fields, including the admin invite code.');
      setAvatarState('shake');
      setAvatarEmotion('sad');
      setTimeout(() => setAvatarState('idle'), 1000);
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError('Please enter a valid email address.');
      setAvatarState('shake');
      setAvatarEmotion('sad');
      setTimeout(() => setAvatarState('idle'), 1000);
      return false;
    }
    if (form.username && !/^[a-zA-Z0-9._-]{3,30}$/.test(form.username)) {
      setError('Username may contain letters, numbers, . _ - and must be 3–30 characters.');
      setAvatarState('shake');
      setAvatarEmotion('sad');
      setTimeout(() => setAvatarState('idle'), 1000);
      return false;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setAvatarState('shake');
      setAvatarEmotion('sad');
      setTimeout(() => setAvatarState('idle'), 1000);
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      setAvatarState('shake');
      setAvatarEmotion('sad');
      setTimeout(() => setAvatarState('idle'), 1000);
      return false;
    }
    if (form.adminCode.trim().length < 3) {
      setError('Admin invite code looks too short.');
      setAvatarState('shake');
      setAvatarEmotion('sad');
      setTimeout(() => setAvatarState('idle'), 1000);
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
    setAvatarEmotion('neutral');

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const payload = {
        name: form.name.trim(),
        username: form.username?.trim() || form.email.split('@')[0],
        email: form.email.trim().toLowerCase(),
        password: form.password,
        adminCode: form.adminCode.trim()
      };

      const res = await fetch(`${API_BASE}/api/auth/admin/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const body = await res.text().then(txt => {
        try { return JSON.parse(txt); } catch { return { raw: txt }; }
      });

      if (!res.ok) {
        let msg = body?.message || body?.error || body?.raw || 'Signup failed. Please try again.';
        if (res.status === 409) {
          msg = body?.message || 'Email or username already in use.';
        } else if (res.status === 400) {
          msg = body?.message || 'Invalid signup data.';
        } else if (res.status === 403) {
          msg = body?.message || 'Invalid admin invite code or admin registration disabled.';
        } else if (res.status >= 500) {
          msg = 'Server error. Please try again later.';
        }
        setError(msg);
        setAvatarState('shake');
        setAvatarEmotion('sad');
        setForm(f => ({ ...f, password: '', confirmPassword: '' }));
        passwordRef.current?.focus?.();
        setTimeout(() => { setAvatarState('idle'); setAvatarEmotion('neutral'); }, 1000);
      } else {
        setAvatarEmotion('happy');
        setAvatarState('nod');
        setSuccess('Admin account created! Check your email for the verification link.');
        setForm({ name: '', username: '', email: '', password: '', confirmPassword: '', adminCode: '' });
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 5000);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // ignore
      } else {
        setError('Network error. Please try again.');
        setAvatarState('shake');
        setAvatarEmotion('sad');
        setTimeout(() => { setAvatarState('idle'); setAvatarEmotion('neutral'); }, 1000);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="hib-auth-layout">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="hib-auth-card" role="main" aria-labelledby="signup-heading">
        <div className="hib-auth-grid">
          <div className="hib-form-container">
            <div className="hib-form-wrapper">
              <div className="hib-form-header">
                <div className="hib-brand-logo" aria-hidden>
                  <img src="/logo.png" alt="Hibiscus" className="hib-logo-image" />
                  <h1 className="hib-brand-title">Hibiscus</h1>
                </div>
                <h2 id="signup-heading" className="hib-form-title">Create Admin Account</h2>
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
                      onFocus={() => handleFocus('name')}
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
                      onFocus={() => handleFocus('username')}
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
                    onFocus={() => handleFocus('email')}
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
                        onFocus={() => handleFocus('password')}
                        onBlur={handleBlur}
                         className="hib-form-input"
                        disabled={loading}
                        required
                        autoComplete="new-password"
                        aria-invalid={!!error && error.toLowerCase().includes('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, password: !showPassword.password })}
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
                        ref={confirmPasswordRef}
                        type={showPassword.confirm ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        onFocus={() => handleFocus('confirmPassword')}
                        onBlur={handleBlur}
                         className="hib-form-input"
                        disabled={loading}
                        required
                        autoComplete="new-password"
                        aria-invalid={!!error && error.toLowerCase().includes('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
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
                  <label className="hib-form-label" htmlFor="adminCode">Admin Invite Code *</label>
                  <div className="hib-password-container">
                    <input
                      id="adminCode"
                      name="adminCode"
                      ref={adminCodeRef}
                      type={showPassword.adminCode ? 'text' : 'password'}
                      value={form.adminCode}
                      onChange={(e) => setForm({ ...form, adminCode: e.target.value })}
                      onFocus={() => handleFocus('adminCode')}
                      placeholder="Enter admin invite code"
                      className="hib-form-input"
                      disabled={loading}
                      required
                      autoComplete="off"
                      aria-describedby="adminCode-help"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, adminCode: !showPassword.adminCode })}
                      className="hib-password-toggle"
                      disabled={loading}
                      aria-label={showPassword.adminCode ? 'Hide admin code' : 'Show admin code'}
                    >
                      {showPassword.adminCode ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <p id="adminCode-help" className="hib-text-sm hib-text-muted">Provide the admin invite code you received from the system administrator. Keep it secret.</p>
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
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="hib-alert-error" id="form-error" role="alert" aria-live="assertive">
                      <div className="hib-alert-content">
                        <FaExclamationCircle className="hib-alert-icon" />
                        <p>{error}</p>
                      </div>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="hib-alert-success" role="status" aria-live="polite">
                      <div className="hib-alert-content">
                        <FaCheckCircle className="hib-alert-icon" />
                        <p>{success}</p>
                        <p className="hib-text-sm">You will be redirected to <Link to="/login">login</Link> shortly.</p>
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
                      <span>Creating Admin Account...</span>
                    </div>
                  ) : 'Create Admin Account'}
                </button>
              </form>

              <div className="hib-divider-section">
                <div className="hib-divider">
                  <span className="hib-divider-text">Admin accounts must be created with email & password</span>
                </div>
                <p className="hib-text-sm hib-text-muted">Social sign-ups are disabled for admin creation for security reasons.</p>
              </div>
            </div>
          </div>

          <div className="hib-avatar-container" aria-hidden={false}>
            <AuthAvatar
              username={form.name || form.username}
              eyesClosed={isPasswordFocused}
              state={avatarState}
              emotion={avatarEmotion}
            />

            <div className="hib-benefits-section">
              <h3 className="hib-benefits-title">Admin Access</h3>
              <p className="hib-benefits-subtitle">Granting admin access creates elevated privileges — proceed carefully.</p>

              <div className="hib-feature-list">
                <span className="hib-feature-item">Local-only authentication</span>
                <span className="hib-feature-item">Email verification required</span>
                <span className="hib-feature-item">Keep invite code confidential</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}