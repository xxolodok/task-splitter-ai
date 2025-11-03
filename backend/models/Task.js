import db from "../config/db.js";
import Subtask from "./Subtask.js";
import {Ollama} from "ollama"
import ApiResponse from "../validators/APIResponseValidator.js";
import { json } from "express";

const API_KEY = "fd43c2cdc86f4e33aa1d063b7bf4270c.mi-zkXTRHjilk2UASYrK1_TB"

class Task {
  static create(taskData) {
    const validation = this.validateTaskData(taskData);
    if (!validation.isValid) {
      return ApiResponse.error(validation.error, "Некорректные данные");
    }

    const { title, priority, deadline, notes, completed } = validation.data;

    const stmt = db.prepare(`
      INSERT INTO tasks (title, priority, deadline, notes, completed) 
      VALUES (?, ?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(title, priority, deadline, notes, completed);

      if (result.changes === 0) {
        return {
          success: false,
          data : null,
          error: "Не удалось создать задачу",
          message: "Внутренняя ошибка"
        };
      }

      return this.findTaskById(result.lastInsertRowid);
    } catch (error) {
      console.error("Database error in Task.create:", error);
      return {
        success: false,
        data : null,
        error: error.message,
        message: error.message
      };;
    }
  }

  static validateTaskData(taskData) {
    const title = String(taskData.title || "").trim();
    if (!title) {
      return { isValid: false, error: "Название задачи обязательно" };
    }

    const priority = ["low", "medium", "high"].includes(taskData.priority)
      ? taskData.priority
      : "medium";

    let deadline = taskData.deadline;
    if (deadline && typeof deadline === "object") {
      deadline = deadline.toISOString().split("T")[0];
    } else if (deadline === "" || deadline === undefined) {
      deadline = null;
    }

    const completed = taskData.completed ? 1 : 0;
    const notes = String(taskData.notes || "").trim();

    return {
      isValid: true,
      data: { title, priority, deadline, notes, completed },
    };
  }

  static findTaskById(taskId) {
    try {
      const id = parseInt(taskId);
      if (isNaN(id) || id <= 0) {
        return {
          success: false,
          data: null,
          error: "Некорректные данные",
          massege: "Указан некорректный ID"
        };
      }

      const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

      if (!task) {
        return {
          success: false,
          data: null,
          error: "Задача не найдена",
          massege: "Задача не существует или ошибка поиска"
        };
      }

      const subtasks = Subtask.findSubtaskByTaskId(id);

      const resultTask = {
        ...task,
        completed: Boolean(task.completed),
        subtasks: subtasks.success ? subtasks.data : [],
      };

      return {
        success: true,
        data: resultTask,
        error: null,
        message: "Задача успешно найдена",
      };
    } catch (error) {
      console.error("Database error in Task.findTaskById:", error);
      return {
        success: false,
        data: null,
        error: "Ошибка при поиске задачи",
        massege: error.message,
      };
    }
  }

  static findAllTask() {
    try {
      const tasksWithSubtasks = db
        .prepare(
          `
        SELECT 
          t.*,
          s.id as subtask_id,
          s.text as subtask_text,
          s.completed as subtask_completed,
          s.created_at as subtask_created_at
        FROM tasks t
        LEFT JOIN subtasks s ON t.id = s.task_id
        ORDER BY 
          CASE 
            WHEN t.priority = 'high' THEN 1
            WHEN t.priority = 'medium' THEN 2
            WHEN t.priority = 'low' THEN 3
            ELSE 4
          END,
          t.created_at DESC,
          s.created_at ASC
      `
        )
        .all();

      const tasksMap = new Map();

      tasksWithSubtasks.forEach((row) => {
        if (!tasksMap.has(row.id)) {
          tasksMap.set(row.id, {
            id: row.id,
            title: row.title,
            priority: row.priority,
            deadline: row.deadline,
            completed: Boolean(row.completed),
            notes: row.notes,
            created_at: row.created_at,
            subtasks: [],
            subtasks_count: 0,
            completed_subtasks: 0,
          });
        }

        const task = tasksMap.get(row.id);

        if (row.subtask_id) {
          const subtask = {
            id: row.subtask_id,
            text: row.subtask_text,
            completed: Boolean(row.subtask_completed),
            created_at: row.subtask_created_at,
          };

          task.subtasks.push(subtask);
          task.subtasks_count++;
          if (subtask.completed) {
            task.completed_subtasks++;
          }
        }
      });

      return {
        success: true,
        data: Array.from(tasksMap.values()),
        error: null,
        message: "Задачи успешно получены",
      };
    } catch (error) {
      console.error("Database error in Task.findAllTask:", error);
      return {
        success: false,
        data: null,
        error: "Ошибка при получении задач",
        message: error.message,
      };
    }
  }

  static updateTask(taskId, updates) {
    try {
      // Валидация ID
      const id = parseInt(taskId);
      if (isNaN(id) || id <= 0) {
        return {
          success: false,
          data: null,
          error: "Некорректные данные",
          massege: "Указан некорректный ID"
        };
      }

      // Проверяем существование задачи
      const existingTask = this.findTaskById(id);
      if (!existingTask.success) {
        return existingTask;
      }

      // Валидируем поля для обновления
      const allowedFields = [
        "title",
        "priority",
        "deadline",
        "completed",
        "notes",
      ];
      const updateFields = [];
      const values = [];

      Object.keys(updates).forEach((key) => {
        if (allowedFields.includes(key)) {
          // Валидация для каждого поля
          if (key === "title" && updates[key] !== undefined) {
            const title = String(updates[key]).trim();
            if (title === "") {
              return {
                success: false,
                data: null,
                error: "Некорректные данные",
                message: "Название задачи не может быть пустым"
              };
            }
            updateFields.push(`${key} = ?`);
            values.push(title);
          } else if (key === "priority" && updates[key] !== undefined) {
            const validPriorities = ["low", "medium", "high"];
            if (!validPriorities.includes(updates[key])) {
              return {
                success: false,
                data: null,
                error: "Некорректные данные",
                massege: "Приоритет должен быть: low, medium или high",
              };
            }
            updateFields.push(`${key} = ?`);
            values.push(updates[key]);
          } else if (key === "completed" && updates[key] !== undefined) {
            updateFields.push(`${key} = ?`);
            values.push(updates[key] ? 1 : 0);
          } else if (key === "deadline" && updates[key] !== undefined) {
            updateFields.push(`${key} = ?`);
            // Обработка deadline
            let deadline = updates[key];
            if (deadline && typeof deadline === "object") {
              deadline = deadline.toISOString().split("T")[0];
            } else if (deadline === "" || deadline === null) {
              deadline = null;
            }
            values.push(deadline);
          } else if (key === "notes" && updates[key] !== undefined) {
            updateFields.push(`${key} = ?`);
            values.push(String(updates[key] || "").trim());
          }
        }
      });

      // Если нет полей для обновления после валидации
      if (updateFields.length === 0) {
        return {
          success: false,
          data: null,
          error: "Некорректные данные",
          massege: "Нет валидных полей для обновления",
        };
      }

      // Добавляем ID в конец значений
      values.push(id);

      // Безопасное выполнение
      const sql = `UPDATE tasks SET ${updateFields.join(", ")} WHERE id = ?`;
      const stmt = db.prepare(sql);
      const result = stmt.run(...values);

      if (result.changes === 0) {
        return {
          success: false,
          data: null,
          error: "Ошибка обновления задач",
          massege: "Не удалось обновить задачу",
        };
      }

      // Возвращаем обновленную задачу
      return this.findTaskById(id);
    } catch (error) {
      console.error("Database error in Task.updateTask:", error);
      return {
        success: false,
        data: null,
        error: "Ошибка при обновлении задачи",
        massege: error.message,
      };
    }
  }

  static deleteTask(taskId) {
    try {
      const id = parseInt(taskId);
      if (isNaN(id) || id <= 0) {
        return {
          success: false,
          data: null,
          error: "Некорректные данные",
          message: "Некорректный ID задачи",
        };
      }

      // ✅ Проверяем существование перед удалением
      const existingTask = this.findTaskById(id);
      if (!existingTask.success) {
        return existingTask;
      }

      const stmt = db.prepare("DELETE FROM tasks WHERE id = ?");
      const result = stmt.run(id);

      if (result.changes === 0) {
        return {
          success: false,
          data: null,
          error: "Ошибка при удалении задачи",
          massege: "Не удалось удалить задачу",
        };
      }

      return {
        success: true,
        data: null,
        error: null,
        message: "Задача успешно удалена",
      };
    } catch (error) {
      console.error("Database error in Task.deleteTask:", error);
      return {
        success: false,
        data: null,
        error: "Ошибка при удалении задачи",
        massege: error.message,
      };
    }
  }

  static async createTaskByAi(taskData) {
  try {
    const validation = this.validateTaskData(taskData);
    if (!validation.isValid) {
      return {
        success: false,
        data : null,
        error: validation.error,
        message: "Некорректные данные"
      };
    }
    const {title, priority, deadline, notes} = validation.data
    // Получение и обработка данных от ИИ
    const request = `
Ты — AI-ассистент для декомпозиции сложных задач. Проанализируй задачу пользователя и верни ответ строго в формате JSON.

**Требования к анализу:**
1. **Сложность (priority):** Оцени по шкале low-medium-high на основе объема работы
2. **Дедлайн (deadline):** Предложи реалистичную дату в формате YYYY-MM-DD
3. **Подзадачи (subtasks):** Разбей на 3-8 конкретных, исполнимых шагов. Каждая подзадача должна быть выполнима за 2-4 часа.

**ВАЖНО: Верни ТОЛЬКО JSON без каких-либо дополнительных текстов, комментариев или бектиков (json).**
**Формат ответа (строго JSON без бэктипов и комментариев):**
{
  "task": {
    "title": "Название задачи",
    "priority": "medium",
    "deadline": "2024-01-15"
  },
  "subtasks": [
    {"text": "Первая подзадача"},
    {"text": "Вторая подзадача"}
  ]
}

**Задача для анализа:**
${title}
${priority ? `**Предложенная пользователем сложность:** ${priority}` : ""}
${deadline ? `**Предложенный пользователем дедлайн:** ${deadline}` : ""}
${notes ? `**Дополнительные заметки:** ${notes}` : ""}   
    `;

    const ollama = new Ollama({
  host: 'https://ollama.com',
  headers: { Authorization: 'Bearer ' + API_KEY },
  })

const response = await ollama.chat({
  model: 'glm-4.6:cloud',
  messages: [{ role: 'user', content: request }],
  json: true
})
console.log(response.message.content)
const aiData = JSON.parse(response.message.content);



    const { task, subtasks } = aiData;

    // Создаем задачу через модель Task
    const taskResult = Task.create({
      title: task.title,
      priority: task.priority,
      deadline: task.deadline,
      notes: notes || `Задача создана AI. ${priority ? `Исходный приоритет: ${priority}` : ''}`,
      completed: false
    });

    if (!taskResult.success) {
      return taskResult;
    }

    const taskId = taskResult.data.id;

    // Создаем подзадачи через модель Subtask
    if (subtasks && subtasks.length > 0) {
      for (const subtask of subtasks) {
        const subtaskResult = Subtask.create({
          task_id: taskId,
          text: subtask.text,
          completed: false
        });
        
        if (!subtaskResult.success) {
          console.error('Error creating subtask:', subtaskResult.error);
        }
      }
    }

    // Получаем полную задачу с подзадачами
    const fullTask = Task.findTaskById(taskId);

    return {
      success: true,
      data: {
        ...fullTask.data,
        subtasks_count: fullTask.data.subtasks.length,
        completed_subtasks: fullTask.data.subtasks.filter(st => st.completed).length,
        ai_generated: true,
      },
      error: null,
      message: "Task successfully created with AI assistance"
    };

  } catch (error) {
    console.error("Error in createTaskByAi:", error);
    
    // Обработка специфических ошибок AI
    if (error.message.includes('JSON')) {
      return {
        success: false,
        data: null,
        error: "AI returned invalid JSON format",
        massege: "Please try again with a different task description"
      };
    }
    
    if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      return {
        success: false,
        data: null,
        error: "AI service unavailable",
        massege: "Please make sure Ollama is running on localhost:11434"
      };
    }
    
    return {
      success: false,
      data: null,
      error: "Failed to create task with AI",
      massege: error.message
    };
  }
  }

static async updateTaskByAi(taskId, taskData) {
  try {
    const { title, priority, deadline, notes } = this.validateTaskData(taskData);

    // Получение и обработка данных от ИИ для оптимизации
    const request = `
Ты — AI-ассистент для декомпозиции сложных задач. Проанализируй задачу пользователя и верни ответ строго в формате JSON.

**Требования к анализу:**
1. **Сложность (priority):** Оцени по шкале low-medium-high на основе объема работы
2. **Дедлайн (deadline):** Предложи реалистичную дату в формате YYYY-MM-DD
3. **Подзадачи (subtasks):** Разбей на 3-8 конкретных, исполнимых шагов. Каждая подзадача должна быть выполнима за 2-4 часа.

**Формат ответа (строго JSON):**
{
  "task": {
    "title": "Название задачи",
    "priority": "medium",
    "deadline": "2024-01-15"
  },
  "subtasks": [
    {"text": "Первая подзадача"},
    {"text": "Вторая подзадача"}
  ]
}

**Задача для анализа:**
${title}
${priority ? `**Предложенная пользователем сложность:** ${priority}` : ""}
${deadline ? `**Предложенный пользователем дедлайн:** ${deadline}` : ""}
${notes ? `**Дополнительные заметки:** ${notes}` : ""}   
    `;

    const response = await ollama.chat({
      model: "gemma3:4b",
      messages: [{ role: "user", content: request }],
      format: "json",
    });

    let aiData;
    try {
      aiData = JSON.parse(response.message.content);
    } catch (parseError) {
      return {
        success: false,
        data: null,
        error: "Invalid AI response format",
        massege: parseError.message
      };
    }

    if (!aiData || !aiData.task) {
      return {
        success: false,
        data: null,
        error: "Invalid AI response structure",
        massege: "ИИ вернул невалидный ответ"
      };
    }

    const { task: improvedTask, subtasks } = aiData;

    const updateResult = this.updateTask(taskId, {
      title: improvedTask.title || title,
      priority: improvedTask.priority || priority,
      deadline: improvedTask.deadline || deadline,
      notes: notes ? `${notes} | Оптимизировано AI` : 'Оптимизировано AI'
    });

    if (!updateResult.success) {
      return updateResult;
    }

    // ✅ ОБНОВЛЯЕМ подзадачи (без await - методы синхронные)
    if (subtasks && subtasks.length > 0) {
      // Удаляем все подзадачи этой задачи
      const deleteResult = Subtask.deleteByTaskId(taskId);
      
      if (!deleteResult.success) {
        console.error('Error deleting old subtasks:', deleteResult.error);
        // Не прерываем выполнение, но логируем ошибку
      }

      // Создаем новые подзадачи от AI
      for (const subtask of subtasks) {
        const subtaskResult = Subtask.create({
          task_id: taskId,
          text: subtask.text,
          completed: false
        });
        
        if (!subtaskResult.success) {
          console.error('Error creating new subtask:', subtaskResult.error);
        }
      }
    }

    const updatedTask = this.findTaskById(taskId);

    return {
      success: true,
      data: {
        ...updatedTask.data,
        ai_optimized: true
      },
      error: null,
      message: "Задача успешно оптимизирована с помощью AI",

    };

  } catch (error) {
    console.error("Error in updateTaskByAi:", error);
    return {
      success: false,
      data: null,
      error: "Failed to update task with AI",
      massege: error.message
    };
  }
}
}

export default Task;
