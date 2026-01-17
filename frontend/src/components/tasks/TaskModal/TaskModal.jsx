import React, { useState, useEffect } from 'react';
import './TaskModal.css';
import Modal from '../../ui/Modal/Modal';
import Button from '../../ui/Button/Button';
import Input from '../../ui/Input/Input';
import Badge from '../../ui/Badge/Badge';
import SubtaskList from '../SubtaskList/SubtaskList';
import Tooltip from '../../ui/Tooltip/Tooltip';

function TaskModal({ task, onClose, onUpdate, onSplitWithAI }) {
  const [notes, setNotes] = useState(task.notes || '');
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [inputError, setInputError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'null') {
      return 'Без срока';
    }
    
    try {
      if (dateString.includes('.')) {
        return dateString;
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Неверная дата';
      }
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}.${month}.${year}`;
    } catch {
      return 'Без срока';
    }
  };

  const getPriorityEmoji = () => {
    switch(task.priority) {
      case 'low': return '🐣';
      case 'medium': return '🐱';
      case 'high': return '🐯';
      default: return '🐣';
    }
  };

  const getPriorityText = () => {
    switch(task.priority) {
      case 'low': return 'Низкая';
      case 'medium': return 'Средняя';
      case 'high': return 'Высокая';
      default: return 'Низкая';
    }
  };

  const handleAddSubtask = (text) => {
    if (!text.trim()) {
      setInputError(true);
      setTimeout(() => setInputError(false), 2000);
      return;
    }

    const newSubtask = {
      id: Date.now(),
      text: text.trim(),
      completed: false
    };

    setSubtasks(prev => [...prev, newSubtask]);
    
    console.log('Создание подзадачи:', text);
    
    setNewSubtask('');
    setInputError(false);
  };

  const handleUpdateSubtask = (id, text, completed) => {
    setSubtasks(prev => 
      prev.map(subtask => 
        subtask.id === id 
          ? { ...subtask, text, completed }
          : subtask
      )
    );
    
    console.log('Обновление подзадачи:', { id, text, completed });
  };

  const handleDeleteSubtask = (id) => {
    if (window.confirm('Удалить эту подзадачу?')) {
      setSubtasks(prev => prev.filter(subtask => subtask.id !== id));
      
      console.log('Удаление подзадачи:', id);
    }
  };

  const handleSaveNotes = () => {
    if (onUpdate) {
      onUpdate(task.id, { notes });
    }
    console.log('Сохранение заметок:', notes);
  };

  const handleSplitWithAI = () => {
    if (onSplitWithAI) {
      onSplitWithAI(task.id);
    }
    console.log('Разбиение с ИИ для задачи:', task.id);
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="task-modal">
        <div className="modal-header">
          <div className="modal-title-row">
            <h2 className="modal-title" id="modal-title">
              {task.title || 'Без названия'}
            </h2>
            <Badge priority={task.priority}>
              {getPriorityEmoji()} {getPriorityText()}
            </Badge>
          </div>
          
          <div className="modal-meta">
            <div className="task-date">
              <span className="date-icon">📅</span>
              <span className="date-text">{formatDate(task.deadline)}</span>
            </div>
            
            <div className="task-status">
              <span className="status-icon">
                {task.completed ? '✅' : '⏳'}
              </span>
              <span className="status-text">
                {task.completed ? 'Выполнена' : 'В работе'}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-content">
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">
                <span className="section-icon">📋</span>
                Подзадачи
                <span className="section-count">({subtasks.length})</span>
              </h3>
            </div>

            <SubtaskList 
              subtasks={subtasks}
              onUpdateSubtask={handleUpdateSubtask}
              onDeleteSubtask={handleDeleteSubtask}
              onAddSubtask={handleAddSubtask}
            />

            <div className="ai-section">
              <Tooltip 
                text="ИИ автоматически разобьет задачу на подзадачи"
                position="top"
                delay={100}
              >
                <Button 
                  variant="secondary"
                  onClick={handleSplitWithAI}
                  className="ai-btn"
                >
                  <span className="btn-icon">🤖</span>
                  Разбить на подзадачи с ИИ
                </Button>
              </Tooltip>
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h3 className="section-title">
                <span className="section-icon">📝</span>
                Заметки
              </h3>
              <Button 
                variant="primary" 
                size="small"
                onClick={handleSaveNotes}
                className="save-btn"
              >
                Сохранить
              </Button>
            </div>

            <div className="notes-container">
              <textarea
                className="notes-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Добавьте заметки к задаче..."
                rows={5}
              />
              <div className="notes-hint">
                <small>Изменения сохраняются автоматически при потере фокуса</small>
              </div>
            </div>
          </div>
        </div>


        <div className="modal-footer">
          <div className="footer-actions">
            <Button 
              variant="primary"
              onClick={() => {
                if (onUpdate) {
                  onUpdate(task.id, { completed: !task.completed });
                }
              }}
            >
              {task.completed ? 'Вернуть в работу' : 'Отметить выполненной'}
            </Button>
            
            <Button 
              variant="secondary"
              onClick={onClose}
            >
              Закрыть
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default TaskModal;