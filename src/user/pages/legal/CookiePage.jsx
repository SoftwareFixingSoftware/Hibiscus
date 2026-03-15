import React from 'react';

const CookiePage = () => {
  return (
    <div className="user-legal-container">
      <h1>Cookie Policy</h1>
      <p className="user-legal-date">Effective Date: March 15, 2026</p>

      <section>
        <h2>1. What Are Cookies?</h2>
        <p>Cookies are small text files stored on your device to help websites work efficiently and provide information to the site owners.</p>
      </section>

      <section>
        <h2>2. Types of Cookies We Use</h2>
        <ul>
          <li><strong>Essential:</strong> Necessary for login, playback, and purchases.</li>
          <li><strong>Performance:</strong> Collect anonymous usage data to improve the service.</li>
          <li><strong>Functionality:</strong> Remember your preferences (language, region).</li>
          <li><strong>Targeting/Advertising:</strong> Used to deliver relevant ads.</li>
        </ul>
      </section>

      <section>
        <h2>3. Third‑Party Cookies</h2>
        <p>We may use third‑party services (like Google Analytics) that set their own cookies. We do not control these cookies.</p>
      </section>

      <section>
        <h2>4. How to Control Cookies</h2>
        <p>You can manage cookie preferences through your browser settings. Disabling cookies may affect some functionality. Learn more at <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer">aboutcookies.org</a>.</p>
      </section>

      <section>
        <h2>5. Do Not Track</h2>
        <p>Our service does not currently respond to Do Not Track (DNT) signals.</p>
      </section>

      <section>
        <h2>6. Changes to This Policy</h2>
        <p>We may update this Cookie Policy. Any changes will be posted here with an updated effective date.</p>
      </section>

      <section>
        <h2>7. Contact Us</h2>
        <p>For questions about cookies, contact us at <a href="mailto:support@breachpen.co.ke">support@breachpen.co.ke</a>.</p>
      </section>
    </div>
  );
};

export default CookiePage;