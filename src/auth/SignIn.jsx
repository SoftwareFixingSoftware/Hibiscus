 // SignIn.jsx
import { useState, useRef } from 'react';
import AuthAvatar from './AuthAvatar';
import SocialAuth from './SocialAuth';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.REACT_APP_API_BASE || '';

export default function SignIn() {
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
        setTimeout(() => { setAvatarState('walkAway'); }, 800);
        setTimeout(() => { window.location.href = '/'; }, 1500);
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-card"
        style={{ maxWidth: 960, width: '100%' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {/* Left side - Avatar */}
          <div style={{ flex: '1 1 40%', minWidth: 280 }} className="avatar-container">
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <div style={{ width: 48, height: 48, background: '#e11d48', borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: 20 }}>H</span>
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Hibiscus</h1>
              </div>
              <p style={{ color: '#4b5563', fontSize: 14 }}>Secure authentication system</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AuthAvatar
                username={email.split('@')[0]}
                eyesClosed={isPasswordFocused}
                state={avatarState}
                emotion={avatarEmotion}
              />
            </div>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Welcome Back</h3>
              <p style={{ color: '#6b7280', fontSize: 13 }}>Sign in to access your account</p>
            </div>
          </div>

          {/* Right side - Form */}
          <div style={{ flex: '1 1 60%', minWidth: 320, padding: 24 }}>
            <div style={{ maxWidth: 420, margin: '0 auto' }}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Sign In</h2>
                <p style={{ color: '#6b7280' }}>Don't have an account? <a href="/register" style={{ color: '#e11d48', fontWeight: 600 }}>Create one now</a></p>
              </div>

              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email Address</label>
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

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</label>
                  <div style={{ position: 'relative' }}>
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
                      style={{ position: 'absolute', right: 10, top: 10, background: 'transparent', border: 'none', cursor: 'pointer' }}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input type="checkbox" style={{ width: 16, height: 16 }} />
                    <span style={{ marginLeft: 8, fontSize: 13, color: '#6b7280' }}>Remember me</span>
                  </label>
                  <a href="#" style={{ color: '#e11d48', fontSize: 13 }}>Forgot password?</a>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="alert-error">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <svg style={{ width: 20, height: 20, marginRight: 8 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p style={{ fontSize: 13, color: '#7f1d1d' }}>{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={loading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              <div style={{ marginTop: 20 }}>
                <div style={{ position: 'relative', marginTop: 12 }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '100%', borderTop: '1px solid #e5e7eb' }} />
                  </div>
                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                    <span style={{ padding: '0 12px', background: 'white', color: '#6b7280', fontSize: 13 }}>Or continue with</span>
                  </div>
                </div>

                <SocialAuth />
              </div>

              <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
                <p>By signing in, you agree to our <a href="#" style={{ color: '#e11d48' }}>Terms</a> and <a href="#" style={{ color: '#e11d48' }}>Privacy Policy</a></p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
