import React, { useEffect, useState } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

/**
 * ThemeToggle: toggles `body.light-theme`
 * - persists to localStorage 'theme' key: 'light' or 'dark'
 * - uses prefers-color-scheme if no saved value
 */
export default function ThemeToggle({ className = '' }) {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light') {
        document.body.classList.add('light-theme');
        setIsLight(true);
        return;
      }
      if (saved === 'dark') {
        document.body.classList.remove('light-theme');
        setIsLight(false);
        return;
      }
      // fallback to system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.body.classList.add('light-theme');
        setIsLight(true);
      } else {
        document.body.classList.remove('light-theme');
        setIsLight(false);
      }
    } catch (e) {
      console.warn('ThemeToggle init error', e);
    }
  }, []);

  const toggle = () => {
    try {
      if (isLight) {
        document.body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
      }
      setIsLight(!isLight);
    } catch (e) {
      console.warn('ThemeToggle toggle error', e);
    }
  };

  return (
    <button
      onClick={toggle}
      className={`hib-theme-toggle ${className}`}
      aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      aria-pressed={isLight}
      title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 1200,
        padding: '0.45rem 0.9rem',
        borderRadius: 999,
        border: '1px solid var(--hib-border)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent)',
        color: 'var(--hib-text-primary)',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6rem',
      }}
    >
      <span style={{ fontSize: 16 }}>
        {isLight ? <FaMoon /> : <FaSun />}
      </span>
      <span style={{ fontSize: 13 }}>{isLight ? 'Dark' : 'Light'}</span>
    </button>
  );
}