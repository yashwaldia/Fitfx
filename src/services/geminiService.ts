import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
import type { Occasion, Style, StyleAdvice, Gender, Garment, UserProfile } from '../types';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("Warning: REACT_APP_GEMINI_API_KEY is not set. Please add it to your .env.local file.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "" });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64.split(',')[1],
      mimeType
    },
  };
};

const getMimeTypeFromBase64 = (base64: string): string => {
    return base64.substring(base64.indexOf(":") + 1, base64.indexOf(";"));
}

const outfitIdeaSchema = {
    type: Type.OBJECT,
    properties: {
        outfitName: { type: Type.STRING, description: "A catchy name for the outfit, e.g., 'The Power Suit' or 'Regal & Festive'." },
        colorName: { type: Type.STRING, description: "Key colors for the outfit, e.g., 'Navy Blue, White, Brown'." },
        fabricType: { type: Type.STRING, description: "Recommended fabric, e.g., 'Linen, Cotton'." },
        idealOccasion: { type: Type.STRING, description: "The specific occasion this is for, e.g., 'Office Meeting' or 'Wedding Reception'." },
        whyItWorks: { type: Type.STRING, description: "A short, confident reason why this combination is effective for the user." },
        suggestedPairingItems: { type: Type.STRING, description: "A comma-separated list of specific items to complete the look (e.g., 'Crisp white shirt, tan chinos, brown leather shoes')." }
    },
    required: ["outfitName", "colorName", "fabricType", "idealOccasion", "whyItWorks", "suggestedPairingItems"]
};

const styleAdviceSchema = {
    type: Type.OBJECT,
    properties: {
        fashionSummary: {
            type: Type.STRING,
            description: "A friendly, descriptive paragraph with emotions, advice, and reasoning about the user's best colors and styles based on their selfie."
        },
        colorPalette: {
            type: Type.ARRAY,
            description: "An array of 5 key colors that are flattering for the user, derived from their selfie and the recommended outfits. Each color should have a name, a hex code, and a brief description.",
            items: {
                type: Type.OBJECT,
                properties: {
                    colorName: { type: Type.STRING, description: "The name of the color, e.g., 'Deep Navy'." },
                    hexCode: { type: Type.STRING, description: "The hexadecimal code for the color, e.g., '#000080'." },
                    description: { type: Type.STRING, description: "A short reason why this color is recommended for the user, e.g., 'Brings out the warmth in your skin tone.'" }
                },
                required: ["colorName", "hexCode", "description"]
            }
        },
        outfitIdeas: {
            type: Type.ARRAY,
            description: "An array of 3 to 5 distinct, new outfit suggestions.",
            items: outfitIdeaSchema
        },
        wardrobeOutfitIdeas: {
            type: Type.ARRAY,
            description: "An array of 1 to 3 outfit ideas that specifically use items from the user's provided wardrobe. If the wardrobe is empty, this should be an empty array.",
            items: outfitIdeaSchema
        },
        materialAdvice: {
            type: Type.STRING,
            description: "Specific advice on the best fabric materials for the user, considering the season and occasion, explaining properties like drape, feel, and breathability."
        },
        motivationalNote: {
            type: Type.STRING,
            description: "A short, positive, and motivational closing note like 'Confidence is your best accessory.'"
        }
    },
    required: ["fashionSummary", "colorPalette", "outfitIdeas", "wardrobeOutfitIdeas", "materialAdvice", "motivationalNote"]
};

export const getStyleAdvice = async (
  imageBase64: string,
  occasion: Occasion,
  style: Style,
  age: string,
  gender: Gender,
  preferredColors: string[],
  wardrobe: Garment[],
  userProfile?: UserProfile | null
): Promise<StyleAdvice> => {
  const model = 'gemini-2.0-flash-exp';
  
  const mimeType = getMimeTypeFromBase64(imageBase64);
  const imagePart = fileToGenerativePart(imageBase64, mimeType);

  const preferredColorsText = preferredColors.length > 0
    ? `- User's Preferred Colors (for this request): ${preferredColors.join(', ')}`
    : '';
  
  const wardrobeText = wardrobe.length > 0
    ? `- User's Wardrobe Items: ${wardrobe.map(item => `${item.color} ${item.material}`).join(', ')}`
    : '';
  
  const profilePreferencesText = userProfile ? `
      - User's general preferences (for context, if available):
        - Preferred Styles: ${userProfile.preferredStyles.join(', ')}
        - Preferred Occasions: ${userProfile.preferredOccasions.join(', ')}
        ${userProfile.bodyType ? `- Body Type: ${userProfile.bodyType}` : ''}
        ${userProfile.preferredFabrics && userProfile.preferredFabrics.length > 0 ? `- Preferred Fabrics: ${userProfile.preferredFabrics.join(', ')}` : ''}
        ${userProfile.fashionIcons ? `- Admired Fashion Icons: ${userProfile.fashionIcons}` : ''}
    ` : '';

  const textPart = {
    text: `
      You are FitFx, a world-class AI fashion stylist. Your goal is to provide personalized, visually descriptive, and inspiring fashion advice.

      Analyze the user in this selfie to determine their skin tone (warm, cool, neutral) and general vibe. Based on this analysis, provide fashion recommendations for the following user-selected criteria for this specific request:
      - Age: ${age}
      - Gender: ${gender}
      - Occasion: ${occasion}
      - Style: ${style}
      ${preferredColorsText}
      ${wardrobeText}
      ${profilePreferencesText}

      Your response MUST be in JSON format and adhere to the provided schema.

      **Instructions:**
      1.  **Analyze & Summarize:** In 'fashionSummary', write a warm, personalized paragraph. Mention their likely skin undertone and suggest colors that would be flattering, keeping their age, gender, and **body type** in mind for appropriate recommendations on silhouettes and fits. If the user provided preferred colors, acknowledge them.
      2.  **Create Color Palette:** Based on the selfie's dominant colors (hair, skin, background) and your recommended outfits, create a 'colorPalette' of exactly 5 key colors. Prioritize including the user's preferred colors if they are flattering. For each, provide a name, hex code, and a brief 'description' explaining why it's a great choice for the user.
      3.  **Create General Outfit Ideas:** Provide 3 to 5 distinct and complete *new* outfit ideas in the 'outfitIdeas' array. Each idea must be practical, stylish, and appropriate for the user's age, gender, and **body type**. Try to incorporate the user's preferred colors and **fabrics** into these outfits where they fit well. For 'suggestedPairingItems', list specific clothing items (e.g., "navy blue blazer, crisp white shirt, tan chinos").
      4.  **Create Outfits From Wardrobe:** If the user's wardrobe is not empty, create 1 to 3 outfit ideas in the 'wardrobeOutfitIdeas' array. These outfits MUST use at least one item from the 'User's Wardrobe Items' list. For 'suggestedPairingItems', list the items from their wardrobe being used, plus any *new* items needed to complete the look (as "Smart Buy" suggestions). If the wardrobe is empty, return an empty array for 'wardrobeOutfitIdeas'.
      5.  **Give Detailed Material Advice:** In 'materialAdvice', go beyond just listing fabrics. Provide a detailed, visually descriptive paragraph. Explain *why* certain materials are recommended. Consider the user's **preferred fabrics**. For example, discuss the 'drape' of silk for Indian party wear, the 'breathability' of linen for American casual summer wear, or the 'structure' of wool for a professional suit. Connect the fabric choice directly to the selected occasion, style, and likely season inferred from the selfie's context. Your advice should be practical and help the user understand the feel and look of the fabric.
      6.  **End with a Motivational Note:** Provide a short, uplifting message in 'motivationalNote'.

      Be confident, expert, and positive. Your advice should feel like it's coming from a personal designer who understands both Western (American) and Indian fashion. Tailor suggestions to be flattering for the user's specified **body type**.
    `
  };

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts: [imagePart, textPart] },
    config: {
        responseMimeType: 'application/json',
        responseSchema: styleAdviceSchema,
    }
  });

  try {
    const jsonText = response.text?.trim() || "";
    if (!jsonText) {
      throw new Error("Empty response from AI model");
    }
    return JSON.parse(jsonText) as StyleAdvice;
  } catch (error) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("The AI returned an invalid response. Please try again.");
  }
};

export const editImage = async (
  imageBase64: string,
  prompt: string
): Promise<string> => {
  const model = 'gemini-2.0-flash-exp';

  const mimeType = getMimeTypeFromBase64(imageBase64);
  const imagePart = fileToGenerativePart(imageBase64, mimeType);
  const textPart = { text: prompt };

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts: [imagePart, textPart] },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("No candidates in response");
  }

  const candidate = response.candidates[0];
  if (!candidate.content?.parts) {
    throw new Error("No content parts in response");
  }

  for (const part of candidate.content.parts) {
    if (part.inlineData?.data && part.inlineData.mimeType) {
      const base64ImageBytes: string = part.inlineData.data;
      return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
    }
  }

  throw new Error("Could not find an image in the AI response.");
};

export const startChat = (): Chat => {
    const chat = ai.chats.create({
        model: 'gemini-2.0-flash-exp',
    });
    return chat;
};
