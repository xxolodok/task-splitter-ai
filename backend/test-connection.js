import { Ollama } from "ollama";

async function test() {
  console.log("🔍 Тестируем подключение к локальному Ollama...");
  
  const ollama = new Ollama({
    host: 'http://localhost:11434'
  });
  
  try {
    const response = await ollama.chat({
      model: 'gemma3:4b',
      messages: [{ 
        role: 'user', 
        content: 'Разбей задачу "постирать одежду" на 3 подзадачи в JSON формате' 
      }],
      json: true
    });
    
    console.log("✅ SUCCESS! Ответ ИИ:");
    console.log(response.message.content);
    
    // Пробуем распарсить
    const json = JSON.parse(response.message.content);
    console.log("✅ JSON parsed успешно!");
    console.log("Подзадачи:", json.subtasks?.length || 0);
    
  } catch (error) {
    console.error("❌ ОШИБКА:", error.message);
    console.error("Детали:", error);
  }
}

test();