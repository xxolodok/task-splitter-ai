import React, { useState } from 'react';
import './TaskList.css';
import TaskCard from '../TaskCard/TaskCard'; 

function TaskList({ 
  title, 
  emoji, 
  tasks, 
  type, 
  onToggleTask, 
  onOpenTask, 
  onDeleteTask 
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <section className="tasks-section">
      <div className="section-header" onClick={handleToggle}>
        <h2 className="section-title">
          <span className="section-emoji">{emoji}</span> {title}
          <span className="task-count">({tasks.length})</span>
        </h2>
        <div className="collapse-icon">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>
      
      <div className={`section-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {tasks.length > 0 ? (
          <ul className={`task-list ${type === 'completed' ? 'completed-tasks' : ''}`}>
            {tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onToggle={onToggleTask}
                onOpen={onOpenTask}
                onDelete={onDeleteTask}
              />
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <span className="empty-emoji">📭</span>
            <p className="empty-text">
              {type === 'completed' ? 'Нет выполненных задач' : 'Нет текущих задач'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default TaskList;