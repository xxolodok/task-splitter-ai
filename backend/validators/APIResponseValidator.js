class ApiResponse {
  constructor(success, data, error = null, message = "") {
    this.success = success;
    this.data = data;
    this.error = error;
    this.message = message;
  }

  static success(data, message = "") {
    return new ApiResponse(true, data, null, message);
  }

  static error(error, message = "") {
    return new ApiResponse(false, null, error, message);
  }

  // Специфичные для задач ответы
  static taskNotFound() {
    return this.error("TASK_NOT_FOUND", "Задача не найдена");
  }

  static invalidData(details = "") {
    return this.error("INVALID_DATA", `Некорректные данные: ${details}`);
  }

  static databaseError(errorMessage) {
    return this.error("DATABASE_ERROR", `Ошибка базы данных: ${errorMessage}`);
  }

  // Для сериализации в JSON
  toJSON() {
    return {
      success: this.success,
      data: this.data,
      error: this.error,
      message: this.message,
      timestamp: this.timestamp
    };
  }
}

export default ApiResponse;