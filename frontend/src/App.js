import React, { useState, useEffect } from "react";
import './App.css';
import { api } from './services/api';

import Sidebar from './components/layout/Sidebar/Sidebar';
import BurgerMenu from './components/layout/BurgerMenu/BurgerMenu';
import TaskForm from './components/tasks/TaskForm/TaskForm';
import TaskList from './components/tasks/TaskList/TaskList';
import TaskModal from './components/tasks/TaskModal/TaskModal';

function App() {
  const [sidebarActive, setSidebarActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [modalTask, setModalTask] = useState(null);
  const [tasks, setTasks] = useState({
    current: [],
    completed: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1023);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, []);
  
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const allTasks = await api.getTasks();
      
      const transformedTasks = allTasks.map(task => ({
        id: task.id,
        name: task.title,
        difficulty: task.priority,
        date: task.deadline ? formatDate(task.deadline) : 'Не указано',
        completed: task.completed,
        original: task
      }));
      
      const current = transformedTasks.filter(task => !task.completed);
      const completed = transformedTasks.filter(task => task.completed);
      
      setTasks({ current, completed });
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
      setError(error.message);
      
      const fallbackTasks = {
        current: [
          { id: 1, name: 'Разработать главный экран приложения', difficulty: 'low', date: '15.11.2025', completed: false },
          { id: 2, name: 'Реализовать функционал модального окна', difficulty: 'medium', date: '20.11.2025', completed: false },
          { id: 3, name: 'Интеграция с API бэкенда', difficulty: 'high', date: '25.11.2025', completed: false }
        ],
        completed: [
          { id: 4, name: 'Создать структуру проекта', difficulty: 'low', date: '10.11.2025', completed: true },
          { id: 5, name: 'Настроить систему сборки', difficulty: 'medium', date: '12.11.2025', completed: true }
        ]
      };
      setTasks(fallbackTasks);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'null') return 'Не указано';
    try {
      if (dateString.includes('.')) {
        return dateString;
      }
      
      const [year, month, day] = dateString.split('-');
      if (year && month && day) {
        return `${day}.${month}.${year}`;
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Не указано';
      
      return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
    } catch {
      return 'Не указано';
    }
  };

  const formatDateForAPI = (dateString) => {
    if (!dateString || dateString === 'Не указано') return null;
    try {
      if (dateString.includes('.')) {
        const [day, month, year] = dateString.split('.');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      return dateString;
    } catch {
      return null;
    }
  };

  const toggleSidebar = () => {
    setSidebarActive(!sidebarActive);
  };

  const addTask = async (task) => {
    try {
      const taskData = {
        title: task.title || task.name,
        priority: task.priority || task.difficulty,
        deadline: formatDateForAPI(task.deadline)
      };
      
      const newTask = await api.createTask(taskData);
      
      const transformedTask = {
        id: newTask.id,
        name: newTask.title,
        difficulty: newTask.priority,
        date: newTask.deadline ? formatDate(newTask.deadline) : 'Не указано',
        completed: newTask.completed,
        original: newTask
      };
      
      setTasks(prev => ({
        ...prev,
        current: [...prev.current, transformedTask]
      }));
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
      alert(error.message || 'Не удалось создать задачу');
    }
  };

  const toggleTaskCompletion = async (taskId) => {
    try {
      const allTasks = [...tasks.current, ...tasks.completed];
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return;
      
      const newCompletedStatus = !task.completed;
      
      const updatedTask = await api.updateTask(taskId, {
        completed: newCompletedStatus
      });
      
      const transformedTask = {
        id: updatedTask.id,
        name: updatedTask.title,
        difficulty: updatedTask.priority,
        date: updatedTask.deadline ? formatDate(updatedTask.deadline) : 'Не указано',
        completed: updatedTask.completed,
        original: updatedTask
      };
      
      const allTasksUpdated = allTasks.map(t => 
        t.id === taskId ? transformedTask : t
      );
      
      setTasks({
        current: allTasksUpdated.filter(t => !t.completed),
        completed: allTasksUpdated.filter(t => t.completed)
      });
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
      alert(error.message || 'Не удалось обновить задачу');
    }
  };

  const splitWithAI = async (taskData) => {
    try {
      console.log('🤖 Отправляем запрос к AI...');
      const formattedData = {
        title: taskData.title,
        priority: taskData.priority,
        deadline: formatDateForAPI(taskData.deadline)
      };
      
      const aiTask = await api.createTaskWithAI(formattedData);
      console.log('✅ AI ответил:', aiTask);
      
      const transformedTask = {
        id: aiTask.id,
        name: aiTask.title,
        difficulty: aiTask.priority,
        date: aiTask.deadline ? formatDate(aiTask.deadline) : 'Не указано',
        completed: aiTask.completed,
        original: aiTask
      };
      
      setTasks(prev => ({
        ...prev,
        current: [...prev.current, transformedTask]
      }));
      
      alert('✅ Задача создана с помощью AI!');
      
    } catch (error) {
      console.error('❌ AI ошибка:', error);
      
      if (error.message.includes('ECONNREFUSED') || error.message.includes('Network error')) {
        alert(`🤖 Не могу подключиться к AI сервису\n\nПроверь:\n1. Запущен ли бэкенд? (localhost:5000)\n2. Работает ли AI сервис?\n3. Нет ли ошибок в консоли`);
      } else {
        alert(`❌ Ошибка: ${error.message}`);
      }
    }
  };

  const openTask = (task) => {
    const convertedTask = {
      id: task.id,
      title: task.name,
      priority: task.difficulty,
      deadline: task.date !== 'Не указано' ? task.date.split('.').reverse().join('-') : '',
      notes: '',
      subtasks: [],
      completed: task.completed
    };
    setModalTask(convertedTask);
  };

  const closeModal = () => setModalTask(null);

  const updateTask = async (taskId, updates) => {
    try {
      await api.updateTask(taskId, updates);
      
      const allTasks = [...tasks.current, ...tasks.completed];
      const updatedTasks = allTasks.map(t => 
        t.id === taskId 
          ? {
              ...t,
              name: updates.title || t.name,
              difficulty: updates.priority || t.difficulty,
              date: updates.deadline ? formatDate(updates.deadline) : t.date,
              completed: updates.completed !== undefined ? updates.completed : t.completed
            }
          : t
      );

      setTasks({
        current: updatedTasks.filter(t => !t.completed),
        completed: updatedTasks.filter(t => t.completed)
      });
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
      alert(error.message || 'Не удалось обновить задачу');
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Удалить эту задачу?')) return;
    
    try {
      await api.deleteTask(taskId);
      
      setTasks(prev => ({
        current: prev.current.filter(t => t.id !== taskId),
        completed: prev.completed.filter(t => t.id !== taskId)
      }));
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
      alert(error.message || 'Не удалось удалить задачу');
    }
  };

  return (
    <div className="app-container">
      <BurgerMenu onClick={toggleSidebar} sidebarActive={sidebarActive} isMobile={isMobile} />
      <Sidebar 
        active={sidebarActive} 
        onClose={toggleSidebar} 
        isMobile={isMobile}
      />
      
      <main className={`main-content ${sidebarActive && isMobile ? 'sidebar-open' : ''}`}>
        <div className="content-wrapper">
          <TaskForm 
            onAddTask={addTask}
            onAddTaskWithAI={splitWithAI}
          />
          
          {loading ? (
            <div className="loading">Загрузка задач...</div>
          ) : error ? (
            <div className="error">
              <p>Ошибка: {error}</p>
              <button onClick={fetchTasks}>Повторить</button>
            </div>
          ) : (
            <>
              <TaskList 
                title="Текущие задачи"
                emoji="🐾"
                tasks={tasks.current}
                type="current"
                onToggleTask={toggleTaskCompletion}
                onOpenTask={openTask}
                onDeleteTask={deleteTask}
              />
              
              <TaskList 
                title="Выполненные задачи"
                emoji="🐾"
                tasks={tasks.completed}
                type="completed"
                onToggleTask={toggleTaskCompletion}
                onOpenTask={openTask}
                onDeleteTask={deleteTask}
              />
            </>
          )}
        </div>
      </main>
      
      <div className="floating-element">🐈</div>

      {modalTask && (
        <TaskModal 
          task={modalTask} 
          onClose={closeModal} 
          onUpdate={(updates) => updateTask(modalTask.id, updates)}
          onSplitWithAI={() => splitWithAI(modalTask)}
        />
      )}
    </div>
  );
}

export default App;