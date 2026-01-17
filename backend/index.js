import express from "express";
import db from "./config/db.js";
import Task from "./models/Task.js";
import Subtask from "./models/Subtask.js";


const PORT = 5000;

const app = express();


// ========== CORS MIDDLEWARE ==========
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'API сервер для менеджера задач',
    version: '1.0',
    endpoints: {
      tasks: 'GET/POST /tasks',
      task: 'GET/PUT/DELETE /tasks/:id',
      ai: 'POST /ai/tasks',
      subtasks: 'GET/POST /tasks/:id/subtasks',
      subtask: 'GET/PUT/DELETE /subtasks/:id'
    }
  });
});

// CRUD запросы для задач
app.post('/tasks', (req, res) => {
  try {
    if (!req.body.title) return res.status(400).json({ error: "Title is required" });
    
    const createdTask = Task.create(req.body)
    res.status(201).json({ 
        createdTask
      });
 
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
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update"
      });
    }

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
      return res.status(404).json({ 
        success: false,
        message: deleteResult.message 
      });
    }
    
    return res.json({ 
      success: true,
      message: deleteResult.message 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// CRUD запросы для подзадач
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
    res.status(500).json({ 
      success: false,
      data: null,
      error: "Failed to fetch subtask",
      message: "",
    });
  }
});

app.put('/subtasks/:id', (req, res) => {
  try {
    const subtaskId = req.params.id;
    const { text, completed } = req.body;

    const existingSubtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(subtaskId);
    if (!existingSubtask) {
      return res.status(404).json({ 
        success: false,
        data: null,
        error: "Subtask not found",
        message: "",
      });
    }

    const updateFields = [];
    const values = [];

    if (text !== undefined) {
      if (!text.trim()) {
        return res.status(400).json({ 
          success: false,
          data: null,
          error: "Text cannot be empty",
          message: "",
        });
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

    const sql = `UPDATE subtasks SET ${updateFields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(sql);
    stmt.run(...values);

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

app.delete('/subtasks/:id', (req, res) => {
  try {
    const subtaskId = req.params.id;
    const stmt = db.prepare('DELETE FROM subtasks WHERE id = ?');
    const result = stmt.run(subtaskId);
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false,
        data: null,
        error: "Subtask not found",
        message: "",
      });
    }
    
    res.json({
      success: true,
      data: null,
      error: null,
      message: "Подзадача успешно удалена"
    });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    res.status(500).json({ 
      success: false,
      data: null,
      error: "Failed to delete subtask",
      message: "",
    });
  }
});

app.post('/tasks/:id/subtasks', (req, res) => {
  try {
    const taskId = req.params.id;
    const { text, completed } = req.body;

    if (!text) {
      return res.status(400).json({ 
        success: false,
        data: null,
        error: "Text is required",
        message: "",
      });
    }

    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!existingTask) {
      return res.status(404).json({ 
        success: false,
        data: null,
        error: "Task not found",
        message: "",
      });
    }

    const stmt = db.prepare(`
      INSERT INTO subtasks (task_id, text, completed) 
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(taskId, text, completed || 0);

    const newSubtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json({
      success: true,
      data: {
        ...newSubtask,
        completed: Boolean(newSubtask.completed)
      },
      error: null,
      message: "Подзадача успешно создана"
    });

  } catch (error) {
    console.error('Error creating subtask:', error);
    res.status(500).json({ 
      success: false,
      data: null,
      error: "Failed to create subtask",
      message: "",
    });
  }
});

app.get('/tasks/:id/subtasks', (req, res) => {
  try {
    const taskId = req.params.id;
    
    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!existingTask) {
      return res.status(404).json({ 
        success: false,
        data: null,
        error: "Task not found",
        message: "",
      });
    }

    const subtasks = db.prepare(`
      SELECT * FROM subtasks 
      WHERE task_id = ? 
      ORDER BY created_at
    `).all(taskId);

    res.json({
      success: true,
      data: subtasks.map(st => ({
        ...st,
        completed: Boolean(st.completed)
      })),
      error: null,
      message: "Подзадачи успешно получены"
    });

  } catch (error) {
    console.error('Error fetching subtasks:', error);
    res.status(500).json({ 
      success: false,
      data: null,
      error: "Failed to fetch subtasks",
      message: "",
    });
  }
});

// AI endpoints
app.post("/ai/tasks", async (req, res) => {
  console.log("=".repeat(60));
  console.log("📨 POST /ai/tasks - ЗАПРОС ПОЛУЧЕН!");
  console.log("Headers:", req.headers);
  console.log("Body:", JSON.stringify(req.body, null, 2));
  console.log("=".repeat(60));
  
  try {
    console.log("🤖 ВЫЗЫВАЕМ Task.createTaskByAi...");
    const createdTask = await Task.createTaskByAi(req.body);
    console.log("✅ AI задача создана. Успех:", createdTask.success);
    
    res.status(createdTask.success ? 201 : 400).json(createdTask);
  } catch (error) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА в AI task creation:');
    console.error(error);
    console.error('Stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      data: null,
      error: "Failed to create task with AI",
      message: error.message 
    });
  }
});

app.put("/ai/tasks/:id", async (req, res) => {
  try {
    const taskId = req.params.id;

    const taskData = Task.findTaskById(taskId);
    
    if (!taskData.success) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "Задача не найдена",
        message: "",
      });
    }

    const updatedTask = await Task.updateTaskByAi(taskId, req.body);

    if (!updatedTask.success) {
      const statusCode = updatedTask.error?.includes('unavailable') ? 503 : 400;
      return res.status(statusCode).json(updatedTask);
    }

    res.json(updatedTask);

  } catch (error) {
    console.error('Error in AI task update:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: "Внутренняя ошибка сервера",
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});