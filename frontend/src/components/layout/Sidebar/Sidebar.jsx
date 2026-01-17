import React, { useState } from 'react';
import './Sidebar.css';

function Sidebar({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('tasks');

  return (
    <nav className={`sidebar ${isOpen ? 'active' : ''}`}>
      <div className="sidebar-header">
        <div className="app-title">
          <div className="logo-placeholder">
            <div className="logo-hint">📋</div>
          </div>
          <span className="app-name">Task Manager</span>
        </div>
                <button 
          className="sidebar-close" 
          onClick={onClose}
          aria-label="Закрыть меню"
        >
          ✕
        </button>
      </div>

      <ul className="sidebar-nav">        <li 
          className={`sidebar-item ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <div className="sidebar-icon">📋</div>
          <span className="sidebar-text">Задания</span>
        </li>
        <li 
          className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('settings');
            alert('Настройки пока не доступны');
          }}
        >
          <div className="sidebar-icon">⚙️</div>
          <span className="sidebar-text">Настройки</span>
        </li>
      </ul>
    </nav>
  );
}

export default Sidebar;