# Документация API Task Manager

## Базовый URL
```
http://localhost:5000
```

## Общая информация

### Структура ответов
Все ответы следуют единому формату:
```json
{
  "success": 1, // или 0 при ошибке
  "data": {},   // или [] или null
  "error": "",  // текст ошибки или null
  "message": "" // информационное сообщение
}
```

### Коды статусов HTTP
- `200` - Успешный запрос
- `201` - Успешное создание
- `400` - Ошибка валидации
- `404` - Ресурс не найден
- `500` - Внутренняя ошибка сервера


## Управление задачами (Tasks)

### 1. Получить все задачи
**GET** `/tasks`

**Описание:** Получение списка всех задач с подзадачами

**Ответ:**
```json
{
  "success": 1,
  "data": [
    {
      "id": 1,
      "title": "Название задачи",
      "priority": "medium",
      "deadline": "2024-01-15",
      "completed": false,
      "notes": "",
      "subtasks": [],
      "created_at": "2024-01-10 10:00:00",
      "updated_at": "2024-01-10 10:00:00"
    }
  ],
  "error": null,
  "message": ""
}
```

### 2. Получить задачу по ID
**GET** `/tasks/:id`

**Параметры:**
- `id` (number) - ID задачи

**Ответ:** Аналогично списку задач, но один объект

### 3. Создать задачу
**POST** `/tasks`

**Тело запроса:**
```json
{
  "title": "Название задачи", // обязательное
  "priority": "low|medium|high", // обязательное
  "deadline": "2024-01-15", // опционально
  "notes": "Дополнительные заметки", // опционально
  "completed": false // опционально, по умолчанию false
}
```

**Ответ:**
```json
{
  "success": 1,
  "data": {
    "id": 10,
    "title": "Новая задача",
    "priority": "medium",
    "deadline": null,
    "completed": false,
    "notes": "",
    "subtasks": [],
    "created_at": "2024-01-10 10:00:00",
    "updated_at": "2024-01-10 10:00:00"
  },
  "error": null,
  "message": ""
}
```

**Ошибки:**
- `400` - "Title is required"
- `500` - "Failed to create task"

### 4. Обновить задачу
**PUT** `/tasks/:id`

**Параметры:**
- `id` (number) - ID задачи

**Тело запроса:** (любые поля для обновления)
```json
{
  "title": "Обновленное название",
  "priority": "high",
  "completed": true,
  "deadline": "2024-01-20"
}
```

**Ответ:**
```json
{
  "success": 1,
  "data": {
    "id": 1,
    "title": "Обновленное название",
    "priority": "high",
    "deadline": "2024-01-20",
    "completed": true,
    "notes": "",
    "subtasks": []
  },
  "error": null,
  "message": "Задача успешно обновлена"
}
```

**Ошибки:**
- `400` - "No fields to update"
- `404` - "Задача не найдена"
- `500` - "Failed to update task"

### 5. Удалить задачу
**DELETE** `/tasks/:id`

**Параметры:**
- `id` (number) - ID задачи

**Ответ:**
```json
{
  "success": 1,
  "data": null,
  "error": null,
  "message": "Задача успешно удалена"
}
```

**Ошибки:**
- `404` - "Задача не найдена"
- `500` - Внутренняя ошибка сервера

---

## AI Функционал

### 1. Создать задачу с помощью AI
**POST** `/ai/tasks`

**Описание:** Создание задачи с автоматической декомпозицией на подзадачи

**Тело запроса:**
```json
{
  "title": "Сложная задача для декомпозиции",
  "priority": "high",
  "deadline": "2024-01-20" // опционально
}
```

**Ответ:**
```json
{
  "success": 1,
  "data": {
    "id": 11,
    "title": "Оптимизированное название от AI",
    "priority": "high",
    "deadline": "2024-01-20",
    "completed": false,
    "notes": "Задача создана AI",
    "subtasks": [
      { "id": 1, "text": "Первая подзадача", "completed": false },
      { "id": 2, "text": "Вторая подзадача", "completed": false }
    ],
    "ai_generated": true
  },
  "error": null,
  "message": "Task successfully created with AI assistance"
}
```

**Ошибки:**
- `500` - "AI service unavailable" (Ollama не запущен)
- `500` - "AI returned invalid JSON format"
- `500` - "Failed to create task with AI"

### 2. Обновить задачу с помощью AI
**PUT** `/ai/tasks/:id`

**Параметры:**
- `id` (number) - ID задачи

**Тело запроса:**
```json
{
  "instructions": "Улучшить декомпозицию и добавить подзадачи"
}
```

**Ответ:** Аналогично созданию через AI

**Ошибки:**
- `404` - "Задача не найдена"
- `503` - "AI service unavailable"
- `500` - Внутренняя ошибка сервера

---

## Управление подзадачами (Subtasks)

### 1. Получить подзадачу по ID
**GET** `/subtasks/:id`

**Параметры:**
- `id` (number) - ID подзадачи

**Ответ:**
```json
{
  "success": 1,
  "data": {
    "id": 1,
    "task_id": 5,
    "text": "Текст подзадачи",
    "completed": false,
    "created_at": "2024-01-10 10:00:00"
  },
  "error": null,
  "message": ""
}
```

### 2. Обновить подзадачу
**PUT** `/subtasks/:id`

**Параметры:**
- `id` (number) - ID подзадачи

**Тело запроса:**
```json
{
  "text": "Обновленный текст",
  "completed": true
}
```

**Ответ:** Аналогично получению подзадачи

**Ошибки:**
- `400` - "Text cannot be empty"
- `400` - "No fields to update"
- `404` - "Subtask not found"

### 3. Удалить подзадачу
**DELETE** `/subtasks/:id`

**Параметры:**
- `id` (number) - ID подзадачи

**Ответ:**
```json
{
  "success": 1,
  "data": null,
  "error": null,
  "message": "Подзадача успешно удалена"
}
```

### 4. Создать подзадачу
**POST** `/tasks/:id/subtasks`

**Параметры:**
- `id` (number) - ID родительской задачи

**Тело запроса:**
```json
{
  "text": "Текст подзадачи", // обязательное
  "completed": false // опционально
}
```

**Ответ:**
```json
{
  "success": 1,
  "data": {
    "id": 15,
    "task_id": 5,
    "text": "Текст подзадачи",
    "completed": false,
    "created_at": "2024-01-10 10:00:00"
  },
  "error": null,
  "message": ""
}
```

### 5. Получить все подзадачи задачи
**GET** `/tasks/:id/subtasks`

**Параметры:**
- `id` (number) - ID задачи

**Ответ:** Массив подзадач

---

## Обработка ошибок

### Типичные ошибки:

```json
// Ошибка валидации
{
  "success": 0,
  "data": null,
  "error": "Title is required",
  "message": "Название задачи обязательно"
}

// Ресурс не найден
{
  "success": 0,
  "data": null,
  "error": "Task not found",
  "message": "Задача не найдена"
}

// Ошибка AI сервиса
{
  "success": 0,
  "data": null,
  "error": "AI service unavailable",
  "message": "Сервис AI временно недоступен"
}

// Внутренняя ошибка сервера
{
  "success": 0,
  "data": null,
  "error": "Failed to create task",
  "message": "Не удалось создать задачу"
}
```

---

## Требования к окружению

### Зависимости:
- **Ollama** должен быть запущен на `localhost:11434` для AI функционала
- **SQLite** база данных с корректными таблицами

### Запуск:
```bash
npm start
# Сервер запускается на порту 5000
```