import db from "../config/db.js";

class Subtask {
  // Создание подзадачи
  static create(subtaskData) {
    try {
      // Валидация данных
      const validation = this.validateSubtaskData(subtaskData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      const { task_id, text, completed } = validation.data;

      // Проверяем существование родительской задачи
      const taskExists = db.prepare('SELECT id FROM tasks WHERE id = ?').get(task_id);
      if (!taskExists) {
        return {
          success: false,
          error: "Родительская задача не найдена",
        };
      }

      // Создаем подзадачу
      const stmt = db.prepare(`
        INSERT INTO subtasks (task_id, text, completed) 
        VALUES (?, ?, ?)
      `);

      const result = stmt.run(task_id, text, completed ? 1 : 0);

      if (result.changes === 0) {
        return {
          success: false,
          error: "Не удалось создать подзадачу",
        };
      }

      // Возвращаем созданную подзадачу
      return this.findSubtaskById(result.lastInsertRowid);

    } catch (error) {
      console.error("Database error in Subtask.create:", error);
      return {
        success: false,
        error: "Ошибка базы данных при создании подзадачи",
        details: error.message,
      };
    }
  }

  // Валидация данных подзадачи
  static validateSubtaskData(subtaskData) {
    const task_id = parseInt(subtaskData.task_id);
    if (isNaN(task_id) || task_id <= 0) {
      return { 
        isValid: false, 
        error: "Некорректный ID задачи" 
      };
    }

    const text = String(subtaskData.text || "").trim();
    if (!text) {
      return { 
        isValid: false, 
        error: "Текст подзадачи обязателен" 
      };
    }

    const completed = subtaskData.completed ? 1 : 0;

    return {
      isValid: true,
      data: { task_id, text, completed }
    };
  }

  // Поиск подзадачи по ID
  static findSubtaskById(subtaskId) {
    try {
      const id = parseInt(subtaskId);
      if (isNaN(id) || id <= 0) {
        return {
          success: false,
          error: "Некорректный ID подзадачи",
        };
      }

      const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id);

      if (!subtask) {
        return {
          success: false,
          error: "Подзадача не найдена",
        };
      }

      return {
        success: true,
        data: {
          ...subtask,
          completed: Boolean(subtask.completed)
        },
        message: "Подзадача успешно найдена",
      };

    } catch (error) {
      console.error("Database error in Subtask.findSubtaskById:", error);
      return {
        success: false,
        error: "Ошибка при поиске подзадачи",
        details: error.message,
      };
    }
  }

  // Поиск всех подзадач по ID задачи
  static findSubtaskByTaskId(taskId) {
    try {
      const id = parseInt(taskId);
      if (isNaN(id) || id <= 0) {
        return {
          success: false,
          error: "Некорректный ID задачи",
        };
      }

      const subtasks = db.prepare(`
        SELECT * FROM subtasks 
        WHERE task_id = ? 
        ORDER BY created_at ASC
      `).all(id);

      return {
        success: true,
        data: subtasks.map(st => ({
          ...st,
          completed: Boolean(st.completed)
        })),
        message: "Подзадачи успешно найдены",
      };

    } catch (error) {
      console.error("Database error in Subtask.findSubtaskByTaskId:", error);
      return {
        success: false,
        error: "Ошибка при поиске подзадач",
        details: error.message,
      };
    }
  }

  // Обновление подзадачи
  static updateSubtask(subtaskId, updates) {
    try {
      const id = parseInt(subtaskId);
      if (isNaN(id) || id <= 0) {
        return {
          success: false,
          error: "Некорректный ID подзадачи",
        };
      }

      // Проверяем существование подзадачи
      const existingSubtask = this.findSubtaskById(id);
      if (!existingSubtask.success) {
        return existingSubtask;
      }

      // Валидируем поля для обновления
      const allowedFields = ['text', 'completed'];
      const updateFields = [];
      const values = [];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          if (key === 'text' && updates[key] !== undefined) {
            const text = String(updates[key]).trim();
            if (text === '') {
              return {
                success: false,
                error: "Текст подзадачи не может быть пустым"
              };
            }
            updateFields.push(`${key} = ?`);
            values.push(text);
          }
          else if (key === 'completed' && updates[key] !== undefined) {
            updateFields.push(`${key} = ?`);
            values.push(updates[key] ? 1 : 0);
          }
        }
      });

      if (updateFields.length === 0) {
        return {
          success: false,
          error: "Нет валидных полей для обновления",
        };
      }

      values.push(id);

      // Выполняем обновление
      const sql = `UPDATE subtasks SET ${updateFields.join(", ")} WHERE id = ?`;
      const stmt = db.prepare(sql);
      const result = stmt.run(...values);

      if (result.changes === 0) {
        return {
          success: false,
          error: "Не удалось обновить подзадачу",
        };
      }

      // Возвращаем обновленную подзадачу
      return this.findSubtaskById(id);

    } catch (error) {
      console.error("Database error in Subtask.updateSubtask:", error);
      return {
        success: false,
        error: "Ошибка при обновлении подзадачи",
        details: error.message,
      };
    }
  }

  // Удаление подзадачи
  static deleteSubtask(subtaskId) {
    try {
      const id = parseInt(subtaskId);
      if (isNaN(id) || id <= 0) {
        return {
          success: false,
          error: "Некорректный ID подзадачи",
        };
      }

      // Проверяем существование перед удалением
      const existingSubtask = this.findSubtaskById(id);
      if (!existingSubtask.success) {
        return existingSubtask;
      }

      const stmt = db.prepare('DELETE FROM subtasks WHERE id = ?');
      const result = stmt.run(id);
      
      if (result.changes === 0) {
        return {
          success: false,
          error: "Не удалось удалить подзадачу"
        };
      }

      return {
        success: true,
        message: "Подзадача успешно удалена"
      };

    } catch (error) {
      console.error("Database error in Subtask.deleteSubtask:", error);
      return {
        success: false,
        error: "Ошибка при удалении подзадачи",
        details: error.message,
      };
    }
  }

  // Удаление всех подзадач по ID задачи
  static deleteByTaskId(taskId, options = {}) {
    try {
      const id = parseInt(taskId);
      if (isNaN(id) || id <= 0) {
        return {
          success: false,
          error: "Некорректный ID задачи",
        };
      }

      let sql = 'DELETE FROM subtasks WHERE task_id = ?';
      const params = [id];

      if (options.onlyIncomplete) {
        sql = 'DELETE FROM subtasks WHERE task_id = ? AND completed = 0';
      }

      const stmt = db.prepare(sql);
      const result = stmt.run(...params);

      return {
        success: true,
        message: `Удалено подзадач: ${result.changes}`,
        changes: result.changes
      };

    } catch (error) {
      console.error("Database error in Subtask.deleteByTaskId:", error);
      return {
        success: false,
        error: "Ошибка при удалении подзадач",
        details: error.message,
      };
    }
  }

  // Получение статистики по подзадачам задачи
  static getSubtaskStats(taskId) {
    try {
      const id = parseInt(taskId);
      if (isNaN(id) || id <= 0) {
        return {
          success: false,
          error: "Некорректный ID задачи",
        };
      }

      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(completed) as completed,
          COUNT(*) - SUM(completed) as pending,
          ROUND(SUM(completed) * 100.0 / COUNT(*), 2) as completion_rate
        FROM subtasks 
        WHERE task_id = ?
      `).get(id);

      return {
        success: true,
        data: {
          total: stats.total,
          completed: stats.completed,
          pending: stats.pending,
          completion_rate: parseFloat(stats.completion_rate) || 0
        },
        message: "Статистика подзадач получена"
      };

    } catch (error) {
      console.error("Database error in Subtask.getSubtaskStats:", error);
      return {
        success: false,
        error: "Ошибка при получении статистики подзадач",
        details: error.message,
      };
    }
  }
}

export default Subtask;