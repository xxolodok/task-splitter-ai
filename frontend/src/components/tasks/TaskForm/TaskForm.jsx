import React, { useState } from 'react';
import './TaskForm.css';
import Input from '../../ui/Input/Input';
import Button from '../../ui/Button/Button';
import Tooltip from '../../ui/Tooltip/Tooltip';
import { api } from '../../../services/api';

function TaskForm({ onAddTask, onAddTaskWithAI }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Пожалуйста, введите название задачи');
      return;
    }

    const taskData = {
      title: title.trim(),
      priority: priority,
      deadline: deadline || null
    };

    console.log('Отправляем на сервер:', taskData);
    onAddTask(taskData);

    setTitle('');
    setPriority('medium');
    setDeadline('');
  };

const handleAddWithAI = () => {
  if (!title.trim()) {
    alert('Пожалуйста, введите название задачи');
    return;
  }

  const taskData = {
    title: title.trim(),
    priority: priority,
    deadline: deadline || null
  };

  console.log('🚀 Отправляем на ИИ-сервер:', taskData);
  
  api.createTaskWithAI(taskData)
    .then(newTask => {
      console.log('✅ Задача с ИИ создана:', newTask);
      
      // ТОЛЬКО onAddTaskWithAI - убрал onSplitWithAI
      if (onAddTaskWithAI) {
        console.log('✅ Вызываем onAddTaskWithAI');
        onAddTaskWithAI(newTask);
      } else {
        console.log('❌ onAddTaskWithAI не передан!');
        alert('Задача создана, но не добавлена в список. Перезагрузите страницу.');
      }
      
      // Очистить форму
      setTitle('');
      setPriority('medium');
      setDeadline('');
      alert('Задача успешно создана с помощью ИИ!');
    })
    .catch(error => {
      console.error('❌ Ошибка создания задачи с ИИ:', error);
      alert(`Ошибка: ${error.message}`);
    });
};

  return (
    <section className="task-form">
      <div className="task-form-header">
        <h2 className="task-form-title">✏️ Новая задача</h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            Название задачи <span className="required">*</span>
          </label>
          <Input 
            type="text"
            placeholder="Введите название задачи..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="task-form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Приоритет
          </label>
          <div className="priority-container">
            <div className="priority-buttons">
              <button 
                type="button"
                className={`priority-btn ${priority === 'low' ? 'active' : ''} priority-low`}
                onClick={() => setPriority('low')}
              >
                <span className="priority-emoji">🐣</span>
                <span className="priority-label">Низкая</span>
              </button>
              
              <button 
                type="button"
                className={`priority-btn ${priority === 'medium' ? 'active' : ''} priority-medium`}
                onClick={() => setPriority('medium')}
              >
                <span className="priority-emoji">🐱</span>
                <span className="priority-label">Средняя</span>
              </button>
              
              <button 
                type="button"
                className={`priority-btn ${priority === 'high' ? 'active' : ''} priority-high`}
                onClick={() => setPriority('high')}
              >
                <span className="priority-emoji">🐯</span>
                <span className="priority-label">Высокая</span>
              </button>
            </div>
            
            <div className="priority-hint">
              <span className="hint-icon">💡</span>
              Выберите уровень сложности задачи
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            📅 Дедлайн (необязательно)
          </label>
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="task-form-date"
          />
        </div>

        <div className="form-actions">
          <Button 
            type="submit" 
            variant="primary" 
            size="large"
            className="action-btn add-btn"
            style={{ width: '100%', marginBottom: '12px' }}
          >
            <span className="btn-icon">➕</span>
            Добавить задание
          </Button>

          <div className="ai-button-wrapper">
            <Tooltip 
              text="ИИ автоматически разобьет задачу на подзадачи"
              position="top"
              delay={100}
            >
              <Button 
                type="button"
                variant="secondary"
                size="large"
                onClick={handleAddWithAI}
                className="action-btn ai-btn"
                style={{ width: '100%' }}
              >
                <span className="btn-icon">🤖</span>
                Разбить с ИИ
              </Button>
            </Tooltip>
            <div className="ai-hint">
              <span className="hint-icon">✨</span>
              ИИ создаст подзадачи автоматически
            </div>
          </div>
        </div>

        <div className="form-footer">
          <span className="hint-text">* — обязательное поле</span>
        </div>
      </form>
    </section>
  );
}

export default TaskForm;