const API_BASE_URL = 'http://localhost:5000';

const handleResponse = async (response) => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  if (data.success === false || data.success === 0) {
    throw new Error(data.message || data.error || 'Ошибка сервера');
  }
  
  return data.data;
};

export const api = {
  getTasks: () => 
    fetch(`${API_BASE_URL}/tasks`)
      .then(handleResponse)
      .catch(error => {
        console.error('Network error in getTasks:', error);
        throw new Error('Нет соединения с сервером');
      }),

  createTask: (taskData) =>
    fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    })
      .then(handleResponse)
      .catch(error => {
        console.error('Network error in createTask:', error);
        throw error;
      }),

createTaskWithAI: (taskData) =>
  fetch(`${API_BASE_URL}/ai/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  })
    .then(response => {
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.text(); // Сначала получаем текст
    })
    .then(text => {
      console.log('📡 Raw response:', text);
      
      try {
        const data = JSON.parse(text);
        console.log('📡 Parsed data:', data);
        
        if (data.success === false || data.success === 0) {
          throw new Error(data.message || data.error || 'Ошибка сервера');
        }
        
        return data.data;
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('❌ Text was:', text);
        throw new Error('Некорректный ответ от сервера');
      }
    })
    .catch(error => {
      console.error('❌ Network error in createTaskWithAI:', error);
      throw error;
    }),

  updateTask: (id, updates) =>
    fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
      .then(handleResponse)
      .catch(error => {
        console.error('Network error in updateTask:', error);
        throw error;
      }),

  deleteTask: (id) =>
    fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE'
    })
      .then(handleResponse)
      .catch(error => {
        console.error('Network error in deleteTask:', error);
        throw error;
      }),

  optimizeTaskWithAI: (taskId) =>
    fetch(`${API_BASE_URL}/ai/tasks/${taskId}`, {
      method: 'PUT'
    })
      .then(handleResponse)
      .catch(error => {
        console.error('Network error in optimizeTaskWithAI:', error);
        throw error;
      }),

  getSubtasks: (taskId) =>
    fetch(`${API_BASE_URL}/tasks/${taskId}/subtasks`)
      .then(handleResponse)
      .catch(error => {
        console.error('Network error in getSubtasks:', error);
        throw error;
      }),

  createSubtask: (taskId, text) =>
    fetch(`${API_BASE_URL}/tasks/${taskId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })
      .then(handleResponse)
      .catch(error => {
        console.error('Network error in createSubtask:', error);
        throw error;
      }),

  updateSubtask: (subtaskId, updates) =>
    fetch(`${API_BASE_URL}/subtasks/${subtaskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
      .then(handleResponse)
      .catch(error => {
        console.error('Network error in updateSubtask:', error);
        throw error;
      }),

  deleteSubtask: (subtaskId) =>
    fetch(`${API_BASE_URL}/subtasks/${subtaskId}`, {
      method: 'DELETE'
    })
      .then(handleResponse)
      .catch(error => {
        console.error('Network error in deleteSubtask:', error);
        throw error;
      }),

  updateTaskNotes: (taskId, notes) =>
    fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    })
      .then(handleResponse)
      .catch(error => {
        console.error('Network error in updateTaskNotes:', error);
        throw error;
      }),

  checkConnection: () =>
    fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })
      .then(response => response.ok)
      .catch(() => false)
};

export default api;