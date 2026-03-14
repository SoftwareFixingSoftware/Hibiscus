import React from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';

const ReviewCard = ({ review, isOwn }) => {
  const userName = review.userName || review.user?.name || review.user?.email || 'Anonymous';
  const rating = review.rating || 0;
  const reviewText = review.reviewText || review.text || review.comment || '';
  const createdAt = review.createdAt || review.created_at || review.date;
  const date = createdAt ? new Date(createdAt).toLocaleDateString() : '';

  return (
    <div className={`user-review-card ${isOwn ? 'user-own-review' : ''}`}>
      <div className="user-review-header">
        <span className="user-reviewer-name">{userName}</span>
        <span className="user-review-rating">
          {[...Array(5)].map((_, i) => (
            i < rating ? <FaStar key={i} /> : <FaRegStar key={i} />
          ))}
        </span>
        <span className="user-review-date">{date}</span>
      </div>
      {reviewText && <p className="user-review-text">{reviewText}</p>}
    </div>
  );
};

export default ReviewCard;