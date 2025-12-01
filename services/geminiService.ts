import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AIConfig, ChatMessage } from "../types";

// Initialize the client once. 
// Note: In a real production app, you might want to handle key rotation or backend proxying.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBotResponse = async (
  history: ChatMessage[],
  newMessage: string,
  config: AIConfig
): Promise<string> => {
  try {
    // Determine model based on config
    const modelId = config.model;

    // Construct the prompt with history context
    // We format the history for the model manually to ensure strict control, 
    // or we could use the Chat API. For this stateless service function, 
    // we'll pass the context in the system instruction or as a chat session.
    
    // Using Chat API for better context management
    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: config.systemInstruction,
        temperature: config.temperature,
      },
      history: history
        .filter(msg => msg.role !== 'system') // Filter out system logs if any
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
    });

    const response: GenerateContentResponse = await chat.sendMessage({
      message: newMessage
    });

    if (response.text) {
      return response.text;
    } else {
      throw new Error("Resposta vazia da IA");
    }

  } catch (error) {
    console.error("Erro ao gerar resposta Gemini:", error);
    return "Desculpe, estou enfrentando problemas técnicos no momento. (Erro de IA)";
  }
};