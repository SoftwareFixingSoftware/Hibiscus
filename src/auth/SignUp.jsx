
// SignUp.jsx
import { useState, useRef } from 'react';
import AuthAvatar from './AuthAvatar';
import SocialAuth from './SocialAuth';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.REACT_APP_API_BASE || '';

export default function SignUp() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarState, setAvatarState] = useState('idle');
  const [avatarEmotion, setAvatarEmotion] = useState('neutral');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState({ password: false, confirm: false });
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const handleFocus = (field) => { setAvatarEmotion('neutral'); if (field === 'password' || field === 'confirmPassword') setIsPasswordFocused(true); };
  const handleBlur = () => setIsPasswordFocused(false);

  const validateForm = () => {
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError('Please fill in all required fields');
      setAvatarState('shake');
      setAvatarEmotion('sad');
      setTimeout(() => setAvatarState('idle'), 1000);
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError('Please enter a valid email address');
      setAvatarState('shake');
      setAvatarEmotion('sad');
      setTimeout(() => setAvatarState('idle'), 1000);
      return false;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setAvatarState('shake');
      setAvatarEmotion('sad');
      setTimeout(() => setAvatarState('idle'), 1000);
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
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

    try {
      const res = await fetch(API_BASE + '/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, username: form.username || form.email.split('@')[0], email: form.email, password: form.password })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || 'Signup failed. Please try again.');
        setAvatarState('shake');
        setAvatarEmotion('sad');
        setTimeout(() => { setAvatarState('idle'); setAvatarEmotion('neutral'); }, 1000);
      } else {
        setAvatarEmotion('happy');
        setAvatarState('nod');
        setSuccess('Account created successfully! Please check your email for verification.');
        setTimeout(() => setForm({ name: '', username: '', email: '', password: '', confirmPassword: '' }), 2000);
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="auth-card" style={{ maxWidth: 960, width: '100%' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {/* Left side - Form */}
          <div style={{ flex: '1 1 60%', minWidth: 320, padding: 24 }}>
            <div style={{ maxWidth: 520, margin: '0 auto' }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, background: '#e11d48', borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <span style={{ color: 'white', fontWeight: 700 }}>H</span>
                  </div>
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Hibiscus</h1>
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Create Account</h2>
                <p style={{ color: '#6b7280' }}>Already have an account? <a href="/login" style={{ color: '#e11d48', fontWeight: 600 }}>Sign in here</a></p>
              </div>

              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Full Name *</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onFocus={() => handleFocus('name')} placeholder="John Doe" className="form-input" disabled={loading} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Username (optional)</label>
                    <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} onFocus={() => handleFocus('username')} placeholder="johndoe" className="form-input" disabled={loading} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email Address *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} onFocus={() => handleFocus('email')} placeholder="you@example.com" className="form-input" disabled={loading} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input ref={passwordRef} type={showPassword.password ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} onFocus={() => handleFocus('password')} onBlur={handleBlur} placeholder="••••••••" className="form-input" disabled={loading} />
                      <button type="button" onClick={() => setShowPassword({ ...showPassword, password: !showPassword.password })} style={{ position: 'absolute', right: 10, top: 10, background: 'transparent', border: 'none', cursor: 'pointer' }}>{showPassword.password ? 'Hide' : 'Show'}</button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Confirm Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input ref={confirmPasswordRef} type={showPassword.confirm ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} onFocus={() => handleFocus('confirmPassword')} onBlur={handleBlur} placeholder="••••••••" className="form-input" disabled={loading} />
                      <button type="button" onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })} style={{ position: 'absolute', right: 10, top: 10, background: 'transparent', border: 'none', cursor: 'pointer' }}>{showPassword.confirm ? 'Hide' : 'Show'}</button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" required style={{ width: 16, height: 16 }} />
                  <span style={{ marginLeft: 8, fontSize: 13, color: '#6b7280' }}>I agree to the <a href="#" style={{ color: '#e11d48' }}>Terms of Service</a> and <a href="#" style={{ color: '#e11d48' }}>Privacy Policy</a></span>
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

                  {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="alert-success">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <svg style={{ width: 20, height: 20, marginRight: 8 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p style={{ fontSize: 13, color: '#065f46' }}>{success}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 6 }}>{loading ? 'Creating Account...' : 'Create Account'}</button>
              </form>

              <div style={{ marginTop: 16 }}>
                <div style={{ position: 'relative', marginTop: 12 }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '100%', borderTop: '1px solid #e5e7eb' }} />
                  </div>
                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                    <span style={{ padding: '0 12px', background: 'white', color: '#6b7280', fontSize: 13 }}>Or sign up with</span>
                  </div>
                </div>

                <SocialAuth />
              </div>
            </div>
          </div>

          {/* Right side - Avatar */}
          <div style={{ flex: '1 1 40%', minWidth: 280 }} className="avatar-container">
            <AuthAvatar username={form.name || form.username} eyesClosed={isPasswordFocused} state={avatarState} emotion={avatarEmotion} />

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Join Our Community</h3>
              <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 12 }}>Create your account in seconds</p>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left', fontSize: 13, color: '#374151' }}>
                <li style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <svg style={{ width: 18, height: 18, marginRight: 8 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  Secure authentication
                </li>
                <li style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <svg style={{ width: 18, height: 18, marginRight: 8 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  Email verification
                </li>
                <li style={{ display: 'flex', alignItems: 'center' }}>
                  <svg style={{ width: 18, height: 18, marginRight: 8 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  Social login options
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

 