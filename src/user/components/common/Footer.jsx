import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaTwitter, 
  FaInstagram, 
  FaFacebook, 
  FaYoutube, 
  FaTiktok, 
  FaLinkedin, 
  FaDiscord,
  FaArrowUp
} from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="user-footer">
      <div className="user-footer-content">
        {/* Column 1: About */}
        <div className="user-footer-section">
          <h4>About Hibiscus</h4>
          <p className="user-footer-description">
            Hibiscus is a premium podcast platform delivering high‑quality audio content 
            across genres. Discover, follow, and listen to your favourite creators.
          </p>
        </div>

        {/* Column 2: Explore */}
        <div className="user-footer-section">
          <h4>Explore</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/user">Dashboard</a></li>
            <li><a href="/user/support">Support</a></li>
            <li><a href="/user/saved-series">Favorites</a></li>
            <li><a href="/user/buy-coins">Store</a></li>
          </ul>
        </div>

        {/* Column 3: Legal */}
        <div className="user-footer-section">
          <h4>Legal</h4>
          <ul>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/cookies">Cookie Policy</Link></li>
          </ul>
        </div>

        {/* Column 4: Follow Us */}
        <div className="user-footer-section">
          <h4>Follow Us</h4>
          <ul className="user-social-links">
            <li><a href="#" target="_blank" rel="noopener noreferrer"><FaTwitter /> Twitter</a></li>
            <li><a href="#" target="_blank" rel="noopener noreferrer"><FaInstagram /> Instagram</a></li>
            <li><a href="#" target="_blank" rel="noopener noreferrer"><FaFacebook /> Facebook</a></li>
            <li><a href="#" target="_blank" rel="noopener noreferrer"><FaYoutube /> YouTube</a></li>
            <li><a href="#" target="_blank" rel="noopener noreferrer"><FaTiktok /> TikTok</a></li>
            <li><a href="#" target="_blank" rel="noopener noreferrer"><FaLinkedin /> LinkedIn</a></li>
            <li><a href="#" target="_blank" rel="noopener noreferrer"><FaDiscord /> Discord</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="user-footer-bottom">
        <p>© {currentYear} Winnas Edtech Ke. All rights reserved.</p>
        <button className="user-back-to-top" onClick={scrollToTop} aria-label="Back to top">
          <FaArrowUp />
        </button>
      </div>
    </footer>
  );
};

export default Footer;