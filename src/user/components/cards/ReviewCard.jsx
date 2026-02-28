// src/components/cards/ReviewCard.jsx
import React from 'react';

const ReviewCard = ({ review, isOwn }) => {
  const { userName, rating, reviewText, createdAt } = review;
  // Format date
  const date = createdAt ? new Date(createdAt).toLocaleDateString() : '';

  return (
    <div className={`review-card ${isOwn ? 'own-review' : ''}`}>
      <div className="review-header">
        <span className="reviewer-name">
          {userName || 'Anonymous'}
        </span>
        <span className="review-rating">{'★'.repeat(rating)}{'☆'.repeat(5-rating)}</span>
        <span className="review-date">{date}</span>
      </div>
      {reviewText && <p className="review-text">{reviewText}</p>}
    </div>
  );
};

export default ReviewCard;