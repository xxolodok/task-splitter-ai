import React, { useEffect, useRef } from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, children, title }) => {
  const modalRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement;
      
      document.addEventListener('keydown', handleEsc);
      
      setTimeout(() => {
        if (modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        }
      }, 10);
      
      return () => {
        document.removeEventListener('keydown', handleEsc);
        if (previousActiveElementRef.current) {
          previousActiveElementRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-backdrop" 
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div 
        className="modal" 
        ref={modalRef}
      >
        
          {title && <h2 className="modal-title" id="modal-title">{title}</h2>}
          
        <div className="modal-content">
          <button 
            className="modal-close" 
            onClick={onClose}
            aria-label="Закрыть модальное окно"
          >
            ×
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;