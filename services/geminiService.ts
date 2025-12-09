import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates an outfit sketch based on the provided description.
 * Uses gemini-2.5-flash-image for generation.
 */
export const generateOutfitSketch = async (promptDescription: string): Promise<string> => {
  try {
    const fullPrompt = `
      Create a high-quality, artistic fashion illustration.
      Style: Hand-drawn watercolor and ink sketch, elegant, minimalist, on a white background.
      Subject: ${promptDescription} displayed on a mannequin or laid out stylishly.
      Vibe: Luxury travel, boutique, cozy.
      Do not include text inside the image.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: fullPrompt }
        ]
      },
      config: {
        // No thinking config needed for image generation models generally,
        // but explicit aspect ratio helps composition.
        imageConfig: {
          aspectRatio: "3:4" 
        }
      }
    });

    // Extract the image from the response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    
    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};