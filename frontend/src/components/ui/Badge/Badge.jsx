import React from 'react';
import './Badge.css';

const Badge = ({ priority = 'low', className = '' }) => {
  const getText = () => {
    switch(priority) {
      case 'low': return 'Низкая';
      case 'medium': return 'Средняя';
      case 'high': return 'Высокая';
      default: return 'Низкая';
    }
  };

  const getEmoji = () => {
    switch(priority) {
      case 'low': return '🐣';
      case 'medium': return '🐱';
      case 'high': return '🐯';
      default: return '🐣';
    }
  };

  return (
    <span className={`badge badge-${priority} ${className}`}>
      <span className="badge-emoji">{getEmoji()}</span>
      <span className="badge-text">{getText()}</span>
    </span>
  );
};

export default Badge;