import React, { useState } from 'react';
import styles from './SubtaskList.module.css';

const SubtaskItem = ({ subtask, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(subtask.text || '');

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(subtask.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Удалить эту подзадачу?')) {
      onDelete(subtask.id);
    }
  };

  const handleTextClick = () => {
    setIsEditing(true);
  };

  return (
    <div className={styles.subtaskItem}>
      <div className={styles.subtaskCheckbox}>
        <input 
          type="checkbox"
          checked={subtask.completed || false}
          onChange={() => onUpdate(subtask.id, subtask.text, !subtask.completed)}
          className={styles.checkbox}
        />
      </div>
      
      <div className={styles.subtaskContent}>
        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className={styles.editInput}
            placeholder="Введите текст подзадачи..."
          />
        ) : (
          <div 
            className={`${styles.subtaskText} ${subtask.completed ? styles.completed : ''}`}
            onClick={handleTextClick}
          >
            {subtask.text}
            {subtask.completed && (
              <span className={styles.completedBadge}>✓ выполнено</span>
            )}
          </div>
        )}
      </div>
      
      <button 
        onClick={handleDelete}
        className={styles.deleteButton}
        title="Удалить подзадачу"
        aria-label="Удалить подзадачу"
      >
        ✕
      </button>
    </div>
  );
};

export default SubtaskItem;