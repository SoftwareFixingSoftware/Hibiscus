import React from 'react';

const Footer = () => {
  return (
    <footer className="dash-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Podcast App</h4>
          <p>© {new Date().getFullYear()} Hibiscus Media. All rights reserved.</p>
        </div>
        <div className="footer-section">
          <h4>Contact</h4>
          <ul>
            <li>
              <a href="mailto:support@podcastapp.com">support@podcastapp.com</a>
            </li>
            <li>
              <a href="tel:+1234567890">+1 (234) 567-890</a>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Follow Us</h4>
          <ul className="social-links">
            <li>
              <a href="#" target="_blank" rel="noopener noreferrer">
                Twitter
              </a>
            </li>
            <li>
              <a href="#" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </li>
            <li>
              <a href="#" target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;