import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

interface ApiFilePart {
    mimeType: string;
    data: string;
}

export const generateResponse = async (prompt: string, files: ApiFilePart[] = []): Promise<string> => {
  try {
    const textPart = { text: prompt };
    const fileParts = files.map(file => ({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data,
      },
    }));

    // The text prompt should follow the images for better analysis.
    const parts = [...fileParts, textPart];

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        systemInstruction: "You are a powerful personal AI assistant for students. Your goal is to help them understand their study materials. When they upload an image or pages from a PDF, analyze them meticulously. Identify key concepts, explain complex parts, and point out potential tricks or important details a student might miss on a test. Be encouraging and supportive. Respond in Persian unless the user's query is in another language.",
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error generating response from Gemini:", error);
    return "متاسفانه در برقراری ارتباط با هوش مصنوعی خطایی رخ داد. لطفا دوباره تلاش کنید.";
  }
};