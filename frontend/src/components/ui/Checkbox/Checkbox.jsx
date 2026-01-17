import React from 'react';
import './Checkbox.css';

const Checkbox = ({ 
  checked = false, 
  onChange, 
  disabled = false, 
  className = '',
  id,
  name
}) => {
  const handleChange = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange(e.target.checked);
    }
  };

  return (
    <label className={`checkbox-container ${className}`}>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={handleChange}
        disabled={disabled}
        id={id}
        name={name}
      />
      <span className="checkmark"></span>
    </label>
  );
};

export default Checkbox;