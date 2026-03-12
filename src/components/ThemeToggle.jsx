import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    // Check if light theme is already active (e.g., from localStorage)
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      setIsLight(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isLight) {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    }
    setIsLight(!isLight);
  };

  return (
    <button
      onClick={toggleTheme}
      className="hib-theme-toggle"
      aria-label="Toggle theme"
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 1000,
        background: 'var(--hib-bg-card)',
        border: '1px solid var(--hib-border)',
        borderRadius: '30px',
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        color: 'var(--hib-text-primary)',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {isLight ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}