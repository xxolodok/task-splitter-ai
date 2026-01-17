import React from 'react';
import './TaskCard.css';
import Checkbox from '../../ui/Checkbox/Checkbox';
import Badge from '../../ui/Badge/Badge';

function TaskCard({ task, onToggle, onOpen, onDelete }) {
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'null' || dateString === 'Не указано') {
      return 'Без срока';
    }
    
    try {
      if (dateString.includes('.')) {
        return dateString;
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return 'Неверная дата';
      }
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}.${month}.${year}`;
    } catch (error) {
      console.error('Date formatting error:', error, 'dateString:', dateString);
      return 'Без срока';
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Удалить эту задачу?')) {
      onDelete(task.id);
    }
  };

  const handleCheckboxChange = (checked) => {
    onToggle(task.id, checked);
  };

  const handleCardClick = (e) => {
    if (
      e.target.closest('.task-checkbox-container') || 
      e.target.closest('.delete-icon') ||
      e.target.closest('.checkbox-container')
    ) {
      return;
    }
    onOpen(task);
  };

  const taskPriority = task.priority || task.difficulty || 'low';

  return (
    <li 
      className={`task-item ${task.completed ? 'completed' : ''}`}
      onClick={handleCardClick}
    >
      <div className="task-checkbox-container">
        <Checkbox 
          checked={task.completed || false}
          onChange={handleCheckboxChange}
          id={`task-${task.id}`}
        />
      </div>
      
      <Badge priority={taskPriority} />
      
      <span className="task-date">
        {formatDate(task.deadline || task.date)}
      </span>
      
      <span className="task-title">
        {task.title || task.name || 'Нет названия'}
        {task.completed && (
          <span className="completion-time">✓ выполнено</span>
        )}
      </span>
      
      <button 
        className="delete-icon"
        onClick={handleDelete}
        title="Удалить задачу"
        aria-label="Удалить задачу"
      >
        ×
      </button>
    </li>
  );
}

export default TaskCard;