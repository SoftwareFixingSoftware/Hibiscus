import { useState, useRef } from 'react';
import AuthAvatar from './AuthAvatar';
import SocialAuth from './SocialAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import '../auth/styles/auth.css';

const API_BASE = "http://localhost:9019";

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarState, setAvatarState] = useState('idle');
  const [avatarEmotion, setAvatarEmotion] = useState('neutral');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef(null);

  const handleEmailFocus = () => setAvatarEmotion('neutral');
  const handlePasswordFocus = () => { setAvatarEmotion('neutral'); setIsPasswordFocused(true); };
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
    if (type === 'error') {
      setError(message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;

    setLoading(true);
    setAvatarEmotion('neutral');

    try {
      const res = await fetch(API_BASE + '/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || 'Invalid email or password');
        setAvatarState('shake');
        setAvatarEmotion('sad');
        setTimeout(() => { setAvatarState('idle'); setAvatarEmotion('neutral'); }, 1000);
      } else {
        setAvatarEmotion('happy');
        setAvatarState('nod');
        setTimeout(() => { 
          setAvatarState('walkAway'); 
        }, 800);
        setTimeout(() => { 
          navigate('/');
        }, 1500);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setAvatarState('shake');
      setAvatarEmotion('sad');
      setTimeout(() => { setAvatarState('idle'); setAvatarEmotion('neutral'); }, 1000);
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
      >
        <div className="auth-grid">
          <div className="avatar-container">
            <div className="brand-header">
              <div className="brand-logo">
                <div className="logo-icon">
                  <span className="logo-text">H</span>
                </div>
                <h1 className="brand-title">Hibiscus</h1>
              </div>
              <p className="brand-subtitle">Secure authentication system</p>
            </div>

            <div className="avatar-wrapper">
              <AuthAvatar
                username={email.split('@')[0]}
                eyesClosed={isPasswordFocused}
                state={avatarState}
                emotion={avatarEmotion}
              />
            </div>

            <div className="welcome-section">
              <h3 className="welcome-title">Welcome Back</h3>
              <p className="welcome-subtitle">Sign in to access your account</p>
            </div>
          </div>

          <div className="form-container">
            <div className="form-wrapper">
              <div className="form-header">
                <h2 className="form-title">Sign In</h2>
                <p className="form-switch">
                  Don't have an account? <Link to="/register" className="form-link">Create one now</Link>
                </p>
              </div>

              <form onSubmit={submit} className="form">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={handleEmailFocus}
                      placeholder="you@example.com"
                      className="form-input"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="password-container">
                    <input
                      ref={passwordRef}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={handlePasswordFocus}
                      onBlur={handlePasswordBlur}
                      placeholder="••••••••"
                      className="form-input"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                      aria-label="Toggle password visibility"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <svg className="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="form-options">
                  <label className="checkbox-label">
                    <input type="checkbox" className="checkbox" disabled={loading} />
                    <span className="checkbox-text">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0 }} 
                      className="alert-error"
                    >
                      <div className="alert-content">
                        <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? (
                    <div className="loading-container">
                      <div className="loading-spinner">
                        <svg className="spinner" viewBox="0 0 24 24">
                          <circle className="spinner-track" cx="12" cy="12" r="10" />
                          <circle className="spinner-indicator" cx="12" cy="12" r="10" />
                        </svg>
                      </div>
                      <span>Signing In...</span>
                    </div>
                  ) : 'Sign In'}
                </button>
              </form>

              <div className="divider-section">
                <div className="divider">
                  <span className="divider-text">Or continue with</span>
                </div>
                <SocialAuth disabled={loading} type="signin" onError={handleSocialError} />
              </div>

              <div className="terms-section">
                <p>By signing in, you agree to our <a href="#" className="terms-link">Terms</a> and <a href="#" className="terms-link">Privacy Policy</a></p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}