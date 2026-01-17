import React from 'react';
import './BurgerMenu.css';

function BurgerMenu({ isOpen, onClick }) {
  return (
    <button 
      className={`burger-menu ${isOpen ? 'active' : ''}`}
      onClick={onClick}
      aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
      aria-expanded={isOpen}
    >
      <span className="burger-text">
        {isOpen ? '✕' : '☰'}
      </span>
    </button>
  );
}

export default BurgerMenu;