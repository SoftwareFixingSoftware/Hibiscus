// src/components/RatingInput.jsx
import React from 'react';
 
const RatingInput = ({ value, onChange }) => {
  const handleClick = (newRating) => {
    onChange(newRating);
  };

  return (
    <div className="rating-input">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= value ? 'filled' : ''}`}
          onClick={() => handleClick(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default RatingInput;