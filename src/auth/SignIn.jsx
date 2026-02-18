import { useState, useRef } from 'react';
import AuthAvatar from './AuthAvatar';
import SocialAuth from './SocialAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import '../auth/styles/auth.css';
import AuthService from './AuthService'; 

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

  /* ------------------ Avatar helpers ------------------ */
  const handleEmailFocus = () => setAvatarEmotion('neutral');

  const handlePasswordFocus = () => {
    setAvatarEmotion('neutral');
    setIsPasswordFocused(true);
  };

  const handlePasswordBlur = () => setIsPasswordFocused(false);

  /* ------------------ Validation ------------------ */
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

      /* ------------------ Submit ------------------ */
      // In the submit function of SignIn.js - update the try block:
    const submit = async (e) => {
      e.preventDefault();
      setError('');
      if (!validateForm()) return;

      setLoading(true);
      setAvatarEmotion('neutral');

      try {
        // Use AuthService wrapper method
        const response = await AuthService.login(email, password);

        // The backend response likely has: message, userId, isAdmin
        const { userId, isAdmin, message } = response || {};

        console.log('SignIn response:', response);

        // Store user info in localStorage
        // Note: The backend might not send username/email in signin response
        // We'll get these from the verify endpoint instead
        localStorage.setItem('isAdmin', String(Boolean(isAdmin)));
        
        // Try to get user details from verify endpoint
        try {
          const verifyResponse = await AuthService.verify();
          console.log('Verify response after signin:', verifyResponse);
          
          if (verifyResponse?.username) {
            localStorage.setItem('username', verifyResponse.username);
          }
          if (verifyResponse?.email) {
            localStorage.setItem('userEmail', verifyResponse.email);
          }
          if (verifyResponse?.role) {
            localStorage.setItem('userRole', verifyResponse.role);
          }
          if (verifyResponse?.isAdmin !== undefined) {
            localStorage.setItem('isAdmin', String(verifyResponse.isAdmin));
          }
        } catch (verifyErr) {
          console.warn('Could not verify user after signin:', verifyErr);
        }

        setAvatarEmotion('happy');
        setAvatarState('nod');

        setTimeout(() => {
          setAvatarState('walkAway');
        }, 800);

        // Final navigate after UI animations
        setTimeout(() => {
          console.log('SignIn - localStorage snapshot', {
            isAdmin: localStorage.getItem('isAdmin'),
            username: localStorage.getItem('username')
          });

          if (localStorage.getItem('isAdmin') === 'true') {
            navigate('/admin', { replace: true });
            console.log('Redirecting to admin');
          } else {
            navigate('/user/dashboard', { replace: true });
            console.log('Redirecting to user home');
          }
        }, 1500);
        console.log('login worked')

      } catch (err) {
        console.error('SignIn error:', err);
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

  /* ------------------ UI ------------------ */
  return (
    <div className="auth-layout">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-card"
      >
        <div className="auth-grid">

          {/* ---------- LEFT / AVATAR ---------- */}
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
              <p className="welcome-subtitle">
                Sign in to access your account
              </p>
            </div>
          </div>

          {/* ---------- RIGHT / FORM ---------- */}
          <div className="form-container">
            <div className="form-wrapper">

              <div className="form-header">
                <h2 className="form-title">Sign In</h2>
                <p className="form-switch">
                  Don&apos;t have an account?{' '}
                  <Link to="/register" className="form-link">
                    Create one now
                  </Link>
                </p>
              </div>

              <form onSubmit={submit} className="form">

                {/* Email */}
                <div className="form-group">
                  <label className="form-label">Email Address</label>
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

                {/* Password */}
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
                      disabled={loading}
                    >
                      👁
                    </button>
                  </div>
                </div>

                {/* Options */}
                <div className="form-options">
                  <label className="checkbox-label">
                    <input type="checkbox" disabled={loading} />
                    <span>Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="alert-error"
                    >
                      <p>{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Signing In…' : 'Sign In'}
                </button>
              </form>

              {/* Social */}
              <div className="divider-section">
                <div className="divider">
                  <span>Or continue with</span>
                </div>
                <SocialAuth
                  disabled={loading}
                  type="signin"
                  onError={handleSocialError}
                />
              </div>

              <div className="terms-section">
                <p>
                  By signing in, you agree to our{' '}
                  <a href="#" className="terms-link">Terms</a> and{' '}
                  <a href="#" className="terms-link">Privacy Policy</a>
                </p>
              </div>

            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
