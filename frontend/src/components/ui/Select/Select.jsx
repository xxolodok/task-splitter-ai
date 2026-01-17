import React from 'react';
import './Select.css';

const Select = ({ 
  value, 
  onChange, 
  options = [], 
  className = '',
  disabled = false,
  placeholder = "Выберите..."
}) => {
  return (
    <select 
      className={`select ${className}`}
      value={value} 
      onChange={onChange}
      disabled={disabled}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      
      {options.map(option => (
        <option 
          key={option.value} 
          value={option.value}
          style={{
            color: option.color || 'inherit',
            backgroundColor: option.bgColor || 'transparent'
          }}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;