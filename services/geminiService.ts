
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSketchingInspiration = async (topic: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Give me 3 creative and specific sketching prompts or challenges related to "${topic}". Keep them short and encouraging. Return as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            challenges: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["challenges"]
        }
      }
    });
    
    return JSON.parse(response.text || '{"challenges": []}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return { challenges: ["Try sketching with your non-dominant hand!", "Focus purely on silhouettes for 2 minutes.", "Capture the gesture in just 30 seconds."] };
  }
};
