import { useState, useRef } from 'react';
import AuthAvatar from '../components/AuthAvatar';
import SocialAuth from '../components/SocialAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaExclamationCircle } from 'react-icons/fa';
import '../styles/auth.css';
import AuthService from '../services/AuthService';

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [avatarState, setAvatarState] = useState('idle');
  const [avatarEmotion, setAvatarEmotion] = useState('neutral');

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordRef = useRef(null);

  // compute preferred redirect target (priority: location.state.from -> query param -> sessionStorage)
  const getRedirectTarget = () => {
    const fromState = location.state?.from;
    if (fromState && fromState.pathname) {
      return fromState.pathname + (fromState.search || '');
    }
    const params = new URLSearchParams(location.search);
    const q = params.get('redirect');
    if (q) return q;
    const stored = sessionStorage.getItem('redirectAfterLogin');
    if (stored) return stored;
    return null;
  };

  const validateLocalRedirect = (path) => {
    if (!path) return null;
    try {
      const url = new URL(path, window.location.origin);
      if (url.origin !== window.location.origin) return null;
      return url.pathname + url.search + url.hash;
    } catch {
      if (path.startsWith('/')) return path;
      return null;
    }
  };

  const handleEmailFocus = () => setAvatarEmotion('neutral');
  const handlePasswordFocus = () => {
    setAvatarEmotion('neutral');
    setIsPasswordFocused(true);
  };
  const handlePasswordBlur = () => setIsPasswordFocused(false);

  const validateForm = () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      setAvatarState('shake');
      setAvatarEmotion('sad');
      setTimeout(() => setAvatarState('idle'), 1000);
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      setAvatarState('shake');
      setAvatarEmotion('sad');
      setTimeout(() => setAvatarState('idle'), 1000);
      return false;
    }
    return true;
  };

  const handleSocialError = (type, message) => {
    if (type === 'error') setError(message);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;

    setLoading(true);
    setAvatarEmotion('neutral');

    try {
      const response = await AuthService.login(email, password);

      let isAdmin = false;
      try {
        const verifyResponse = await AuthService.verify();
        isAdmin = verifyResponse?.isAdmin || false;
      } catch {
        isAdmin = response?.isAdmin || false;
      }

      setAvatarEmotion('happy');
      setAvatarState('nod');
      setTimeout(() => setAvatarState('walkAway'), 800);

      setTimeout(() => {
        const candidate = getRedirectTarget();
        const safe = validateLocalRedirect(candidate);
        sessionStorage.removeItem('redirectAfterLogin');

        if (safe) {
          navigate(safe, { replace: true });
        } else {
          if (isAdmin) navigate('/admin', { replace: true });
          else navigate('/user', { replace: true });
        }
      }, 1500);
    } catch (err) {
      const message = err?.message || (err?.data && err.data.message) || 'Network error. Please try again.';
      setError(message);
      setAvatarState('shake');
      setAvatarEmotion('sad');
      setTimeout(() => {
        setAvatarState('idle');
        setAvatarEmotion('neutral');
      }, 1000);
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
      >
        <div className="hib-auth-grid">
          <div className="hib-avatar-container">
            <div className="hib-brand-header">
              <div className="hib-brand-logo">
                <img src="/logo.png" alt="Hibiscus" className="hib-logo-image" />
                <h1 className="hib-brand-title">Hibiscus</h1>
              </div>
              <p className="hib-brand-subtitle">Secure authentication system</p>
            </div>

            <div className="hib-avatar-wrapper">
              <AuthAvatar
                username={email.split('@')[0]}
                eyesClosed={isPasswordFocused}
                state={avatarState}
                emotion={avatarEmotion}
              />
            </div>

            <div className="hib-welcome-section">
              <h3 className="hib-welcome-title">Welcome Back</h3>
              <p className="hib-welcome-subtitle">
                Sign in to access your account
              </p>
            </div>
          </div>

          <div className="hib-form-container">
            <div className="hib-form-wrapper">
              <div className="hib-form-header">
                <h2 className="hib-form-title">Sign In</h2>
                <p className="hib-form-switch">
                  Don&apos;t have an account?{' '}
                  <Link to="/register" className="hib-form-link">
                    Create one now
                  </Link>
                </p>
              </div>

              <form onSubmit={submit} className="hib-form">
                <div className="hib-form-group">
                  <label className="hib-form-label">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={handleEmailFocus}
                    placeholder="you@example.com"
                    className="hib-form-input"
                    disabled={loading}
                  />
                </div>

                <div className="hib-form-group">
                  <label className="hib-form-label">Password</label>
                  <div className="hib-password-container">
                    <input
                      ref={passwordRef}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={handlePasswordFocus}
                      onBlur={handlePasswordBlur}
                      placeholder="••••••••"
                      className="hib-form-input"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="hib-password-toggle"
                      disabled={loading}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="hib-form-options">
                  <label className="hib-checkbox-label">
                    <input type="checkbox" disabled={loading} className="hib-checkbox" />
                    <span className="hib-checkbox-text">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="hib-forgot-link">
                    Forgot password?
                  </Link>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="hib-alert-error"
                    >
                      <div className="hib-alert-content">
                        <FaExclamationCircle className="hib-alert-icon" />
                        <p>{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={loading} className="hib-btn-primary">
                  {loading ? 'Signing In…' : 'Sign In'}
                </button>
              </form>

              <div className="hib-divider-section">
                <div className="hib-divider">
                  <span className="hib-divider-text">Or continue with</span>
                </div>
                <SocialAuth disabled={loading} type="signin" onError={handleSocialError} />
              </div>

              <div className="hib-terms-section">
                <p>
                  By signing in, you agree to our{' '}
                  <a href="#" className="hib-terms-link">Terms</a> and{' '}
                  <a href="#" className="hib-terms-link">Privacy Policy</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}