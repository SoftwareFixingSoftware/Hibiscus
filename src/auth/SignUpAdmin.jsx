import { useState, useRef, useEffect } from 'react';
import AuthAvatar from './AuthAvatar';
// SocialAuth intentionally not used for admin signups
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import '../auth/styles/auth.css';

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
      // cancel pending request when component unmounts
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // derive a safe username when user hasn't typed one
  useEffect(() => {
    if (!form.username && form.email) {
      const candidate = form.email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 30);
      setForm(f => ({ ...f, username: candidate }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.email]); // only re-run when email changes

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

    // Abort previous if any
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

      // try to parse JSON body (may fail if server returns HTML)
      const body = await res.text().then(txt => {
        try { return JSON.parse(txt); } catch { return { raw: txt }; }
      });

      if (!res.ok) {
        // prefer server-provided message
        let msg = body?.message || body?.error || body?.raw || 'Signup failed. Please try again.';
        // map common statuses to nicer messages
        if (res.status === 409) {
          msg = body?.message || 'Email or username already in use.';
        } else if (res.status === 400) {
          msg = body?.message || 'Invalid signup data.';
        } else if (res.status === 403) {
          // invalid admin code or admin registration disabled
          msg = body?.message || 'Invalid admin invite code or admin registration disabled.';
        } else if (res.status >= 500) {
          msg = 'Server error. Please try again later.';
        }
        setError(msg);
        setAvatarState('shake');
        setAvatarEmotion('sad');
        // clear sensitive fields for safety
        setForm(f => ({ ...f, password: '', confirmPassword: '' }));
        passwordRef.current?.focus?.();
        setTimeout(() => { setAvatarState('idle'); setAvatarEmotion('neutral'); }, 1000);
      } else {
        setAvatarEmotion('happy');
        setAvatarState('nod');
        setSuccess('Admin account created! Check your email for the verification link.');

        // on success, clear only non-essential fields quickly and navigate to login
        setForm({ name: '', username: '', email: '', password: '', confirmPassword: '', adminCode: '' });

        // navigate after short delay to let animations show
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 5000);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // request was aborted (likely unmount or new submit), ignore
        console.log('Admin signup request aborted');
      } else {
        console.error(err);
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
    <div className="auth-layout">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="auth-card" role="main" aria-labelledby="signup-heading">
        <div className="auth-grid">
          <div className="form-container">
            <div className="form-wrapper">
              <div className="form-header">
                <div className="brand-logo" aria-hidden>
                  <div className="logo-icon">
                    <span className="logo-text">H</span>
                  </div>
                  <h1 className="brand-title">Hibiscus</h1>
                </div>
                <h2 id="signup-heading" className="form-title">Create Admin Account</h2>
                <p className="form-switch">
                  Already have an account? <Link to="/login" className="form-link">Sign in here</Link>
                </p>
              </div>

              <form onSubmit={submit} className="form" aria-describedby={error ? 'form-error' : undefined}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">Full Name *</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      onFocus={() => handleFocus('name')}
                      placeholder="John Doe"
                      className="form-input"
                      disabled={loading}
                      required
                      autoComplete="name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="username">Username (optional)</label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      onFocus={() => handleFocus('username')}
                      placeholder="johndoe"
                      className="form-input"
                      disabled={loading}
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    onFocus={() => handleFocus('email')}
                    placeholder="you@example.com"
                    className="form-input"
                    disabled={loading}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="password">Password *</label>
                    <div className="password-container">
                      <input
                        id="password"
                        name="password"
                        ref={passwordRef}
                        type={showPassword.password ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        onFocus={() => handleFocus('password')}
                        onBlur={handleBlur}
                        placeholder="••••••••"
                        className="form-input"
                        disabled={loading}
                        required
                        autoComplete="new-password"
                        aria-invalid={!!error && error.toLowerCase().includes('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, password: !showPassword.password })}
                        className="password-toggle"
                        disabled={loading}
                        aria-label={showPassword.password ? 'Hide password' : 'Show password'}
                      >
                        <svg className="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          {showPassword.password ? (
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

                  <div className="form-group">
                    <label className="form-label" htmlFor="confirmPassword">Confirm Password *</label>
                    <div className="password-container">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        ref={confirmPasswordRef}
                        type={showPassword.confirm ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        onFocus={() => handleFocus('confirmPassword')}
                        onBlur={handleBlur}
                        placeholder="••••••••"
                        className="form-input"
                        disabled={loading}
                        required
                        autoComplete="new-password"
                        aria-invalid={!!error && error.toLowerCase().includes('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                        className="password-toggle"
                        disabled={loading}
                        aria-label={showPassword.confirm ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        <svg className="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          {showPassword.confirm ? (
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
                </div>

                {/* ADMIN CODE FIELD */}
                <div className="form-group">
                  <label className="form-label" htmlFor="adminCode">Admin Invite Code *</label>
                  <div className="password-container">
                    <input
                      id="adminCode"
                      name="adminCode"
                      ref={adminCodeRef}
                      type={showPassword.adminCode ? 'text' : 'password'}
                      value={form.adminCode}
                      onChange={(e) => setForm({ ...form, adminCode: e.target.value })}
                      onFocus={() => handleFocus('adminCode')}
                      placeholder="Enter admin invite code"
                      className="form-input"
                      disabled={loading}
                      required
                      autoComplete="off"
                      aria-describedby="adminCode-help"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, adminCode: !showPassword.adminCode })}
                      className="password-toggle"
                      disabled={loading}
                      aria-label={showPassword.adminCode ? 'Hide admin code' : 'Show admin code'}
                    >
                      <svg className="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        {showPassword.adminCode ? (
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
                  <p id="adminCode-help" className="small-note">Provide the admin invite code you received from the system administrator. Keep it secret.</p>
                </div>

                <div className="form-checkbox">
                  <input id="tos" type="checkbox" required className="checkbox" disabled={loading} />
                  <label htmlFor="tos" className="checkbox-text">
                    I agree to the <a href="#" className="checkbox-link">Terms of Service</a> and <a href="#" className="checkbox-link">Privacy Policy</a>
                  </label>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="alert-error" id="form-error" role="alert" aria-live="assertive">
                      <div className="alert-content">
                        <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>{error}</p>
                      </div>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="alert-success" role="status" aria-live="polite">
                      <div className="alert-content">
                        <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>{success}</p>
                        <p className="small-note">You will be redirected to <Link to="/login">login</Link> shortly.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={loading} className="btn-primary" aria-busy={loading}>
                  {loading ? (
                    <div className="loading-container" aria-hidden>
                      <div className="loading-spinner">
                        <svg className="spinner" viewBox="0 0 24 24">
                          <circle className="spinner-track" cx="12" cy="12" r="10" />
                          <circle className="spinner-indicator" cx="12" cy="12" r="10" />
                        </svg>
                      </div>
                      <span>Creating Admin Account...</span>
                    </div>
                  ) : 'Create Admin Account'}
                </button>
              </form>

              <div className="divider-section">
                <div className="divider">
                  <span className="divider-text">Admin accounts must be created with email & password</span>
                </div>
                <p className="small-note">Social sign-ups are disabled for admin creation for security reasons.</p>
              </div>
            </div>
          </div>

          <div className="avatar-container" aria-hidden={false}>
            <AuthAvatar
              username={form.name || form.username}
              eyesClosed={isPasswordFocused}
              state={avatarState}
              emotion={avatarEmotion}
            />

            <div className="benefits-section">
              <h3 className="benefits-title">Admin Access</h3>
              <p className="benefits-subtitle">Granting admin access creates elevated privileges — proceed carefully.</p>

              <ul className="benefits-list">
                <li className="benefit-item">
                  <svg className="benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  Local-only authentication
                </li>
                <li className="benefit-item">
                  <svg className="benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  Email verification required
                </li>
                <li className="benefit-item">
                  <svg className="benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  Keep invite code confidential
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
