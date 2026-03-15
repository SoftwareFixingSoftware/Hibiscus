import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

const API_BASE = "http://localhost:9019";
const client_id = "366280838312-6uobsfi97m0556ustv7t6qko6isqeo9r.apps.googleusercontent.com";

export default function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const loadGoogleScript = () => {
      const script = document.createElement('script');
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    };

    const handleGoogleLogin = () => {
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
              // After successful login, we should verify and redirect to appropriate dashboard
              const verifyRes = await fetch(`${API_BASE}/api/auth/verify`, {
                credentials: 'include'
              });

              if (verifyRes.ok) {
                const userData = await verifyRes.json();
                const isAdmin = userData?.isAdmin || false;
                navigate(isAdmin ? '/admin' : '/user', { replace: true });
              } else {
                navigate('/user', { replace: true }); // fallback
              }
            } else {
              navigate('/login');
            }
          } catch (err) {
             navigate('/login');
          }
        }
      });

      window.google.accounts.id.prompt();
    };

    loadGoogleScript();
    handleGoogleLogin();
  }, [navigate]);

  return (
    <div className="hib-auth-layout">
      <div className="hib-auth-card">
        <div className="hib-flex hib-items-center hib-justify-center hib-p-8">
          <div className="hib-text-center">
            <div className="hib-loading-spinner hib-mx-auto hib-mb-4">
              <svg className="hib-spinner" viewBox="0 0 24 24">
                <circle className="hib-spinner-track" cx="12" cy="12" r="10" />
                <circle className="hib-spinner-indicator" cx="12" cy="12" r="10" />
              </svg>
            </div>
            <h3 className="hib-text-lg hib-font-semibold hib-mb-2">Completing Google login...</h3>
            <p className="hib-text-muted hib-text-sm">Please wait while we authenticate you.</p>
          </div>
        </div>
      </div>
    </div>
  );
}