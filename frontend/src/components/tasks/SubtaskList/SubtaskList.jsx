import React, { useState } from 'react';
import SubtaskItem from './SubtaskItem';
import styles from './SubtaskList.module.css';

const SubtaskList = ({ 
  subtasks = [], 
  onUpdateSubtask, 
  onDeleteSubtask,
  onAddSubtask 
}) => {
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      onAddSubtask(newSubtaskText.trim());
      setNewSubtaskText('');
      setIsAdding(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddSubtask();
    }
  };

  return (
    <div className={styles.subtaskList}>
      <div className={styles.listHeader}>
        <h3 className={styles.title}>📋 Подзадачи</h3>
        <span className={styles.count}>({subtasks.length})</span>
      </div>

      {/* Список подзадач */}
      {subtasks.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyEmoji}>📝</span>
          <p className={styles.emptyText}>Нет подзадач</p>
          <p className={styles.emptyHint}>Добавьте первую подзадачу</p>
        </div>
      ) : (
        <div className={styles.subtasksContainer}>
          {subtasks.map((subtask) => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              onUpdate={onUpdateSubtask}
              onDelete={onDeleteSubtask}
            />
          ))}
        </div>
      )}

      {/* Форма добавления новой подзадачи */}
      <div className={styles.addForm}>
        {isAdding ? (
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите текст подзадачи..."
              className={styles.newInput}
              autoFocus
            />
            <div className={styles.formButtons}>
              <button 
                onClick={handleAddSubtask}
                className={styles.addButton}
                disabled={!newSubtaskText.trim()}
              >
                Добавить
              </button>
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setNewSubtaskText('');
                }}
                className={styles.cancelButton}
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className={styles.addTrigger}
          >
            <span className={styles.plusIcon}>+</span>
            Добавить подзадачу
          </button>
        )}
      </div>
    </div>
  );
};

export default SubtaskList;