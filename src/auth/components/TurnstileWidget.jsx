import { useEffect, useRef } from "react";

const TurnstileWidget = ({ onToken }) => {
  const widgetRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onTokenRef = useRef(onToken);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    const siteKey = process.env.REACT_APP_TURNSTILE_SITE_KEY;

    if (!siteKey) {
      console.error("Missing REACT_APP_TURNSTILE_SITE_KEY in .env");
      return;
    }

    let intervalId = null;
    let cancelled = false;

    const renderWidget = () => {
      if (cancelled) return true;
      if (!window.turnstile || !widgetRef.current) return false;

      if (widgetIdRef.current !== null) return true;

      widgetIdRef.current = window.turnstile.render(widgetRef.current, {
        sitekey: siteKey,
        callback: (token) => {
          onTokenRef.current?.(token);
        },
        "expired-callback": () => {
          onTokenRef.current?.("");
        },
        "error-callback": () => {
          onTokenRef.current?.("");
        },
      });

      return true;
    };

    if (!renderWidget()) {
      intervalId = window.setInterval(() => {
        if (renderWidget() && intervalId) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
      }, 300);
    }

    return () => {
      cancelled = true;

      if (intervalId) {
        window.clearInterval(intervalId);
      }

      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (err) {
          console.warn("Turnstile cleanup failed:", err);
        }
        widgetIdRef.current = null;
      }
    };
  }, []);

  return <div ref={widgetRef} />;
};

export default TurnstileWidget;