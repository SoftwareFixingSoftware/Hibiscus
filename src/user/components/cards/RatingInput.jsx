import React from 'react';
import { FaStar } from 'react-icons/fa';

const RatingInput = ({ value, onChange }) => {
  const handleClick = (rating) => {
    onChange(rating);
  };

  return (
    <div className="user-rating-input">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          className={`user-star ${star <= value ? 'filled' : ''}`}
          onClick={() => handleClick(star)}
        />
      ))}
    </div>
  );
};

export default RatingInput;