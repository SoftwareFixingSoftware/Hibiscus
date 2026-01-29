// GoogleCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = "http://localhost:9019";
const client_id = "366280838312-6uobsfi97m0556ustv7t6qko6isqeo9r.apps.googleusercontent.com";

export default function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const loadGoogleScript = () => {
      // Load Google Identity Services script
      const script = document.createElement('script');
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    };

    const handleGoogleLogin = () => {
      // Wait until Google script is loaded
      if (!window.google) {
        setTimeout(handleGoogleLogin, 100);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: client_id,
        callback: async (response) => {
          const idToken = response.credential;

          try {
            const res = await fetch(`${API_BASE}/api/auth/social`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ provider: 'google', idToken })
            });

            if (res.ok) {
              navigate('/'); // login success
            } else {
              navigate('/login'); // login failed
            }
          } catch (err) {
            console.error(err);
            navigate('/login');
          }
        }
      });

      // Render the Google Sign-In button
      window.google.accounts.id.prompt(); // or render button if you want
    };

    loadGoogleScript();
    handleGoogleLogin();
  }, [navigate]);

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4">
              <svg className="spinner" viewBox="0 0 24 24">
                <circle className="spinner-track" cx="12" cy="12" r="10" />
                <circle className="spinner-indicator" cx="12" cy="12" r="10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Completing Google login...</h3>
            <p className="text-gray-400">Please wait while we authenticate you.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
