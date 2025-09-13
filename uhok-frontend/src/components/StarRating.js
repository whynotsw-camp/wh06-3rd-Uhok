import React from 'react';

const StarRating = ({ rating, maxRating = 5, size = 16, showScore = false, className = '' }) => {
  const filledColor = '#FFD700'; // 금색
  const emptyColor = '#E5E5E5';  // 회색
  
  const renderStars = () => {
    const stars = [];
    
    for (let i = 1; i <= maxRating; i++) {
      const isFilled = i <= rating;
      const starColor = isFilled ? filledColor : emptyColor;
      
      stars.push(
        <svg 
          key={i} 
          width={size} 
          height={size} 
          viewBox="0 0 24 24" 
          fill={starColor} 
          xmlns="http://www.w3.org/2000/svg"
          className="star-icon"
        >
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={starColor}/>
        </svg>
      );
    }
    
    return stars;
  };

  return (
    <div className={`star-rating ${className}`}>
      <div className="star-rating-stars">
        {renderStars()}
      </div>
      {showScore && (
        <span className="star-rating-score">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
