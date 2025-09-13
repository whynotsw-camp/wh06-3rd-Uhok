import React from 'react';
import '../styles/ingredient-tag.css';

const IngredientTag = ({ 
  ingredient, 
  index, 
  onRemove, 
  showRemoveButton = true,
  className = '' 
}) => {
  const handleMouseEnter = () => {
    if (showRemoveButton && onRemove) {
      const element = document.getElementById(`ingredient-tag-${index}`);
      if (element) {
        element.classList.add('x-button-hover');
      }
    }
  };

  const handleMouseLeave = () => {
    if (showRemoveButton && onRemove) {
      const element = document.getElementById(`ingredient-tag-${index}`);
      if (element) {
        element.classList.remove('x-button-hover');
      }
    }
  };

  // 재료 데이터 처리
  let displayText = '';
  if (typeof ingredient === 'string') {
    displayText = ingredient;
  } else {
    const name = ingredient?.name || '';
    const amount = ingredient?.amount;
    const unit = ingredient?.unit;
    const amountPart = amount != null && amount !== '' ? ` ${amount}` : '';
    const unitPart = unit ? `${unit}` : '';
    displayText = `${name}${amountPart}${unitPart}`.trim();
  }

  return (
    <div 
      className={`ingredient-tag ${className}`}
      id={`ingredient-tag-${index}`}
    >
      <span className="ingredient-name" title={displayText}>
        {displayText}
      </span>
      {showRemoveButton && onRemove && (
        <button 
          className="remove-ingredient-btn"
          onClick={() => onRemove(index)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          aria-label="재료 제거"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default IngredientTag;
