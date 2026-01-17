import React, { useState, useEffect } from 'react';
import './TasksPage.css';
import Sidebar from '../../components/layout/Sidebar/Sidebar';
import BurgerMenu from '../../components/layout/BurgerMenu/BurgerMenu';
import TaskForm from '../../components/tasks/TaskForm/TaskForm';
import TaskList from '../../components/tasks/TaskList/TaskList';
import TaskModal from '../../components/tasks/TaskModal/TaskModal';
import { api } from '../../services/api';

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {
      console.error('Ошибка загрузки задач:', err);
      setError('Не удалось загрузить задачи. Проверьте подключение к серверу.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (taskData) => {
    try {
      const newTask = await api.createTask(taskData);
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      console.error('Ошибка создания задачи:', err);
      alert('Не удалось создать задачу');
      throw err;
    }
  };

  const handleAddTaskWithAI = async (taskData) => {
    try {
      const aiTask = await api.createTaskWithAI(taskData);
      setTasks(prev => [...prev, aiTask]);
      return aiTask;
    } catch (err) {
      console.error('Ошибка создания задачи с ИИ:', err);
      alert('Не удалось создать задачу с ИИ');
      throw err;
    }
  };

    const handleToggleTask = async (taskId, completed) => {
    try {
        await api.updateTask(taskId, { completed });
        setTasks(prev => 
        prev.map(task => 
            task.id === taskId ? { ...task, completed } : task
        )
        );
    } catch (err) {
        console.error('Ошибка обновления задачи:', err);
        alert('Не удалось обновить статус задачи');
    }
    };

  const handleOpenTask = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Удалить эту задачу?')) return;

    try {
      await api.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      if (selectedTask?.id === taskId) {
        setIsModalOpen(false);
        setSelectedTask(null);
      }
    } catch (err) {
      console.error('Ошибка удаления задачи:', err);
      alert('Не удалось удалить задачу');
    }
  };

    const handleUpdateTask = async (taskId, updates) => {
    try {
        await api.updateTask(taskId, updates);
        setTasks(prev => 
        prev.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
        )
        );
        
        if (selectedTask?.id === taskId) {
        setSelectedTask(prev => ({ ...prev, ...updates }));
        }
    } catch (err) {
        console.error('Ошибка обновления задачи:', err);
        alert('Не удалось обновить задачу');
    }
    };

  const handleSplitWithAI = async (taskId) => {
    try {
      const optimizedTask = await api.optimizeTaskWithAI(taskId);
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? optimizedTask : task
        )
      );
      
      if (selectedTask?.id === taskId) {
        setSelectedTask(optimizedTask);
      }
      
      alert('Задача успешно оптимизирована с помощью ИИ!');
    } catch (err) {
      console.error('Ошибка оптимизации с ИИ:', err);
      alert('Не удалось оптимизировать задачу с ИИ');
    }
  };

  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  const handleContentClick = () => {
    if (isMobileView && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="tasks-page">
      {isMobileView && (
        <BurgerMenu 
          isOpen={isSidebarOpen}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      )}

      <Sidebar 
        isOpen={!isMobileView || isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main 
        className={`main-content ${isMobileView && isSidebarOpen ? 'sidebar-open' : ''}`}
        onClick={handleContentClick}
      >
        <div className="content-wrapper">
          <header className="page-header">
            <h1 className="page-title">
              📋 Менеджер задач
            </h1>
            <p className="page-subtitle">
              Управляйте своими задачами эффективно
            </p>
          </header>

          <section className="form-section">
            <TaskForm 
              onAddTask={handleAddTask}
              onAddTaskWithAI={handleAddTaskWithAI}
            />
          </section>

          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Загрузка задач...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p className="error-text">{error}</p>
              <button 
                onClick={fetchTasks}
                className="retry-button"
              >
                Попробовать снова
              </button>
            </div>
          ) : (
            <>
              <section className="tasks-section">
                <TaskList 
                  title="Текущие задачи"
                  emoji="📋"
                  tasks={activeTasks}
                  type="current"
                  onToggleTask={handleToggleTask}
                  onOpenTask={handleOpenTask}
                  onDeleteTask={handleDeleteTask}
                />
              </section>

              <section className="tasks-section">
                <TaskList 
                  title="Выполненные задачи"
                  emoji="✅"
                  tasks={completedTasks}
                  type="completed"
                  onToggleTask={handleToggleTask}
                  onOpenTask={handleOpenTask}
                  onDeleteTask={handleDeleteTask}
                />
              </section>
            </>
          )}

          {!isLoading && !error && tasks.length === 0 && (
            <div className="empty-state">
              <div className="empty-emoji">📭</div>
              <h3 className="empty-title">Нет задач</h3>
              <p className="empty-text">
                Добавьте первую задачу используя форму выше
              </p>
            </div>
          )}
        </div>
      </main>

      {selectedTask && (
        <TaskModal 
          task={selectedTask}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          onUpdate={handleUpdateTask}
          onSplitWithAI={handleSplitWithAI}
        />
      )}
    </div>
  );
}

export default TasksPage;