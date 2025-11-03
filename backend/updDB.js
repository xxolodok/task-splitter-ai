import db from "./config/db.js"
function initializeDatabase() {
  try {
    // Проверяем существование таблиц и добавляем недостающие колонки
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND (name='tasks' OR name='subtasks')
    `).all();

    // Если таблица tasks существует, проверяем колонки
    if (tables.some(t => t.name === 'tasks')) {
      const columns = db.prepare("PRAGMA table_info(tasks)").all();
      const columnNames = columns.map(col => col.name);
      
      // Добавляем updated_at если его нет
      if (!columnNames.includes('updated_at')) {
        db.exec('ALTER TABLE tasks ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
        console.log('✅ Добавлена колонка updated_at в таблицу tasks');
      }
      
      // Добавляем created_at если его нет
      if (!columnNames.includes('created_at')) {
        db.exec('ALTER TABLE tasks ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
        console.log('✅ Добавлена колонка created_at в таблицу tasks');
      }
    } else {
      // Создаем таблицу tasks если ее нет
      db.exec(`
        CREATE TABLE tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          priority TEXT DEFAULT 'medium',
          deadline TEXT,
          completed BOOLEAN DEFAULT FALSE,
          notes TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Аналогично для subtasks
    if (!tables.some(t => t.name === 'subtasks')) {
      db.exec(`
        CREATE TABLE subtasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          text TEXT NOT NULL,
          completed BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
        )
      `);
      db.exec('CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks (task_id)');
    }

    console.log('✅ База данных готова к работе!');
    
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error);
    throw error;
  }
}

initializeDatabase()