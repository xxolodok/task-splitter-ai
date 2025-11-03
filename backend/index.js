import express from "express";
import db from "./config/db.js";
import Task from "./models/Task.js";
import Subtask from "./models/Subtask.js";
import ollama from "ollama";
const PORT = 5000;

const respns = {
  success: 0 || 1,
  data : [],
  error: "",
  message: ""
}

const app = express();
app.use(express.json());
app.use(express.static("./public"))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// CRUD запросы для задач
app.post('/tasks', (req, res) => {
  try {
    if (!req.body.title) return res.status(400).json({ error: "Title is required" });
    
    const createdTask = Task.create(req.body)
    res.status(201).json({createdTask});

  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

app.get('/tasks', (req, res) => {
  try {
    const tasksWithSubtasks = Task.findAllTask()
    res.json(tasksWithSubtasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});
app.get('/tasks/:id', (req, res) => {
  try {
    const tasksWithSubtasks = Task.findTaskById(req.params.id)
    res.json(tasksWithSubtasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});
app.put('/tasks/:id', (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.body; // Получаем данные из тела запроса

    // Проверяем, есть ли данные для обновления
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update"
      });
    }

    // Выполняем обновление с передачей updates
    const result = Task.updateTask(taskId, updates);
    
    if (!result.success) {
      const statusCode = result.error.includes('не найден') ? 404 : 400;
      return res.status(statusCode).json(result);
    }
    
    res.json(result);
  
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update task" 
    });
  }
});

app.delete('/tasks/:id', (req, res) => {
  try {
    const deleteResult = Task.deleteTask(req.params.id);
    
    if (!deleteResult.success) {
      // Возвращаем 404 если задача не найдена
      return res.status(404).json({ 
        success: false,
        message: deleteResult.message 
      });
    }
    
    // Возвращаем 200 при успешном удалении
    return res.json({ 
      success: true,
      message: deleteResult.message 
    });
  } catch (error) {
    // Возвращаем 500 при внутренней ошибке
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// CRUD запросы для подзадач
// GET /subtasks/:id - Получить подзадачу по ID
app.get('/subtasks/:id', (req, res) => {
  try {
    const subtaskId = req.params.id;
    const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(subtaskId);
    
    if (!subtask) {
      return res.status(404).json({ 
          success: false,
          data: null,
          error: "Subtask not found",
          message: "",
    });
    }
    
    res.json({
      success: true,
      data: {
        ...subtask,
        completed: Boolean(subtask.completed)
      },
      error: null,
      message: ""
      
    });
  } catch (error) {
    console.error('Error fetching subtask:', error);
    res.status(500).json({ error: "Failed to fetch subtask" });
  }
});

// PUT /subtasks/:id - Обновить подзадачу
app.put('/subtasks/:id', (req, res) => {
  try {
    const subtaskId = req.params.id;
    const { text, completed } = req.body;

    // Проверяем существование подзадачи
    const existingSubtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(subtaskId);
    if (!existingSubtask) {
      return res.status(404).json({ error: "Subtask not found" });
    }

    // Подготавливаем обновление
    const updateFields = [];
    const values = [];

    if (text !== undefined) {
      if (!text.trim()) {
        return res.status(400).json({ error: "Text cannot be empty" });
      }
      updateFields.push('text = ?');
      values.push(text.trim());
    }

    if (completed !== undefined) {
      updateFields.push('completed = ?');
      values.push(completed ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "No fields to update",
        message: "",
      });
    }

    values.push(subtaskId);

    // Выполняем обновление
    const sql = `UPDATE subtasks SET ${updateFields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(sql);
    stmt.run(...values);

    // Возвращаем обновленную подзадачу
    const updatedSubtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(subtaskId);
    
    res.json({
      success: true,
      data: {
        ...updatedSubtask,
        completed: Boolean(updatedSubtask.completed)
      },
      error: null,
      message: "",
      
    });

  } catch (error) {
    console.error('Error updating subtask:', error);
    res.status(500).json({ 
      success: false,
      data: null,
      error: "Failed to update subtask",
      message: "",
    });
  }
});

// DELETE /subtasks/:id - Удалить подзадачу
app.delete('/subtasks/:id', (req, res) => {
  try {
    const subtaskId = req.params.id;
    const stmt = db.prepare('DELETE FROM subtasks WHERE id = ?');
    const result = stmt.run(subtaskId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Subtask not found" });
    }
    
    res.json({
  success: true,
  message: "Подзадача успешно удалена"
});
  } catch (error) {
    console.error('Error deleting subtask:', error);
    res.status(500).json({ error: "Failed to delete subtask" });
  }
});

// POST /tasks/:id/subtasks - Создать подзадачу для задачи
app.post('/tasks/:id/subtasks', (req, res) => {
  try {
    const taskId = req.params.id;
    const { text, completed } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    // Проверяем существование задачи
    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Создаем подзадачу
    const stmt = db.prepare(`
      INSERT INTO subtasks (task_id, text, completed) 
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(
      taskId,
      text,
      completed || 0
    );

    // Возвращаем созданную подзадачу
    const newSubtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json({
      ...newSubtask,
      completed: Boolean(newSubtask.completed)
    });

  } catch (error) {
    console.error('Error creating subtask:', error);
    res.status(500).json({ error: "Failed to create subtask" });
  }
});

// GET /tasks/:id/subtasks - Получить все подзадачи задачи
app.get('/tasks/:id/subtasks', (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Проверяем существование задачи
    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    const subtasks = db.prepare(`
      SELECT * FROM subtasks 
      WHERE task_id = ? 
      ORDER BY created_at
    `).all(taskId);

    res.json(
      subtasks.map(st => ({
        ...st,
        completed: Boolean(st.completed)
      }))
    );

  } catch (error) {
    console.error('Error fetching subtasks:', error);
    res.status(500).json({ error: "Failed to fetch subtasks" });
  }
});

// AI endpoints
app.post("/ai/tasks", async (req, res) => {
  try {
    const createdTask = await Task.createTaskByAi(req.body)
    res.status(201).json(createdTask);

  } catch (error) {
    console.error('Error in AI task creation:', error);
    
    // Более детальные ошибки для дебага
    if (error.message.includes('JSON')) {
      return res.status(500).json({ 
        error: "AI returned invalid JSON format",
        details: "Please try again with a different task description"
      });
    }
    
    if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      return res.status(500).json({ 
        error: "AI service unavailable",
        details: "Please make sure Ollama is running on localhost:11434"
      });
    }
    
    res.status(500).json({ 
      error: "Failed to create task with AI",
      details: error.message 
    });
  }
});

app.put("/ai/tasks/:id", async (req, res) => {
  try {
    const taskId = req.params.id;

    // Проверяем существование задачи (синхронный метод)
    const taskData = Task.findTaskById(taskId);
    
    if (!taskData.success) {
      return res.status(404).json({
        success: false,
        error: "Задача не найдена"
      });
    }

    // Обновляем задачу с помощью AI (асинхронный метод)
    const updatedTask = await Task.updateTaskByAi(taskId, req.body);

    // Проверяем успешность обновления
    if (!updatedTask.success) {
      const statusCode = updatedTask.error?.includes('unavailable') ? 503 : 400;
      return res.status(statusCode).json(updatedTask);
    }

    res.json(updatedTask);

  } catch (error) {
    console.error('Error in AI task update:', error);
    res.status(500).json({
      success: false,
      error: "Внутренняя ошибка сервера",
      details: error.message
    });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
