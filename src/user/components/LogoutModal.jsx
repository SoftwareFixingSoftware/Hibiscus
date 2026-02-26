import React from 'react';
import RippleButton from './common/RippleButton';
 
const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content logout-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Leave PodFlow?</h3>
        <p>Are you sure you want to log out?</p>
        <div className="modal-actions">
          <RippleButton className="cancel-btn" onClick={onClose}>
            Cancel
          </RippleButton>
          <RippleButton className="confirm-btn" onClick={onConfirm}>
            Logout
          </RippleButton>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;