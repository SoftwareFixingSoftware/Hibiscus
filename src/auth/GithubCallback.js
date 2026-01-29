import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE = "http://localhost:9019";

export default function GithubCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
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

        if (res.ok) {
          navigate('/');
        } else {
          navigate('/login');
        }
      } catch (error) {
        navigate('/login');
      }
    };

    handleCallback();
  }, [location, navigate]);

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
            <h3 className="text-lg font-semibold mb-2">Completing GitHub login...</h3>
            <p className="text-gray-400">Please wait while we authenticate you.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
