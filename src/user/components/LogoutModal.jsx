import React from 'react';
import RippleButton from './common/RippleButton';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="user-modal-overlay" onClick={onClose}>
      <div className="user-modal-content user-logout-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Leave PodFlow?</h3>
        <p>Are you sure you want to log out?</p>
        <div className="user-modal-actions">
          <RippleButton className="user-cancel-btn" onClick={onClose}>
            Cancel
          </RippleButton>
          <RippleButton className="user-confirm-btn" onClick={onConfirm}>
            Logout
          </RippleButton>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;