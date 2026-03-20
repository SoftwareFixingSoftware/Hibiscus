import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/auth.css';

const API_BASE = "https://api.breachpen.co.ke";

export default function GithubCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const requestSent = useRef(false);

  useEffect(() => {
    if (requestSent.current) return;
    requestSent.current = true;

    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');

      if (!code) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/github/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code })
        });

        if (!res.ok) {
          navigate('/login');
          return;
        }

        const verifyRes = await fetch(`${API_BASE}/api/auth/verify`, {
          credentials: 'include'
        });

        if (!verifyRes.ok) {
          navigate('/user');
          return;
        }

        const userData = await verifyRes.json();
        const isAdmin = userData?.isAdmin || false;

        if (isAdmin) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/user', { replace: true });
        }
      } catch (error) {
         navigate('/login');
      }
    };

    handleCallback();
  }, [location, navigate]);

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
            <h3 className="hib-text-lg hib-font-semibold hib-mb-2">Completing GitHub login...</h3>
            <p className="hib-text-muted hib-text-sm">Please wait while we authenticate you.</p>
          </div>
        </div>
      </div>
    </div>
  );
}