import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
// ✨ UPDATED: Import Country and AIGeneratedDressRow
import type { Occasion, Country, StyleAdvice, Gender, Garment, UserProfile, SubscriptionTier, AIGeneratedDressRow } from '../types';

const API_KEY = process.env.REACT_APP_GEMINI_API;
const IMAGE_API_KEY = process.env.REACT_APP_GEMINI_IMAGE_API;

const ai = new GoogleGenAI({ apiKey: API_KEY || "" });
const imageAI = new GoogleGenAI({ apiKey: IMAGE_API_KEY || API_KEY || "" });

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

// ✨ NEW: Schema for AI-Generated Dress Matrix
const dressMatrixRowSchema = {
    type: Type.OBJECT,
    properties: {
        country: { type: Type.STRING, description: "Country/Region (e.g., 'India', 'USA', 'Japan', 'France', 'Africa (Nigeria, Ghana, Kenya)', 'Arab Region')" },
        gender: { type: Type.STRING, description: "Gender (e.g., 'Male', 'Female', 'Unisex')" },
        dressName: { type: Type.STRING, description: "Creative name of the dress/outfit tailored to this user" },
        description: { type: Type.STRING, description: "Detailed description explaining why this dress suits THIS user's skin tone, age, style, and preferences" },
        occasion: { type: Type.STRING, description: "When this outfit should be worn" },
        notes: { type: Type.STRING, description: "Cultural context, styling tips, or unique details about this dress" }
    },
    required: ["country", "gender", "dressName", "description", "occasion", "notes"]
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
            description: "An array of 5 key colors that are flattering for the user.",
            items: {
                type: Type.OBJECT,
                properties: {
                    colorName: { type: Type.STRING, description: "The name of the color, e.g., 'Deep Navy'." },
                    hexCode: { type: Type.STRING, description: "The hexadecimal code for the color, e.g., '#000080'." },
                    description: { type: Type.STRING, description: "A short reason why this color is recommended for the user." }
                },
                required: ["colorName", "hexCode", "description"]
            }
        },
        outfitIdeas: {
            type: Type.ARRAY,
            description: "An array of outfit suggestions.",
            items: outfitIdeaSchema
        },
        wardrobeOutfitIdeas: {
            type: Type.ARRAY,
            description: "An array of 1 to 3 outfit ideas that specifically use items from the user's provided wardrobe. If the wardrobe is empty, this should be an empty array.",
            items: outfitIdeaSchema
        },
        // ✨ NEW: AI-Generated Dress Matrix
        generatedDressMatrix: {
            type: Type.ARRAY,
            description: "An array of 5-10 AI-GENERATED dress recommendations SPECIFICALLY tailored to THIS user's country, gender, occasion, skin tone, age, and personal style. Each row should be PERSONALIZED - NOT generic.",
            items: dressMatrixRowSchema
        },
        materialAdvice: {
            type: Type.STRING,
            description: "Specific advice on the best fabric materials for the user, considering the season and occasion."
        },
        motivationalNote: {
            type: Type.STRING,
            description: "A short, positive, and motivational closing note like 'Confidence is your best accessory.'"
        }
    },
    required: ["fashionSummary", "colorPalette", "outfitIdeas", "wardrobeOutfitIdeas", "generatedDressMatrix", "materialAdvice", "motivationalNote"]
};

// NEW: Subscription-aware outfit count
const getOutfitCount = (tier: SubscriptionTier): number => {
  switch(tier) {
    case 'free': return 3;
    case 'style_plus': return 999;
    case 'style_x': return 999;
    default: return 3;
  }
};

// ✨ UPDATED: Changed 'style: Style' to 'country: Country'
export const getStyleAdvice = async (
  imageBase64: string,
  occasion: Occasion,
  country: Country,
  age: string,
  gender: Gender,
  preferredColors: string[],
  wardrobe: Garment[],
  userProfile?: UserProfile | null,
  subscriptionTier: SubscriptionTier = 'free'
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
        - Preferred Occasions: ${userProfile.preferredOccasions.join(', ')}
        ${userProfile.bodyType ? `- Body Type: ${userProfile.bodyType}` : ''}
        ${userProfile.preferredFabrics && userProfile.preferredFabrics.length > 0 ? `- Preferred Fabrics: ${userProfile.preferredFabrics.join(', ')}` : ''}
        ${userProfile.fashionIcons ? `- Admired Fashion Icons: ${userProfile.fashionIcons}` : ''}
    ` : '';

  const outfitCount = getOutfitCount(subscriptionTier);
  const outfitDescription = subscriptionTier === 'free' 
    ? `3 distinct and complete` 
    : `as many distinct and complete as you can generate (at least 5)`;

  const textPart = {
    text: `
      You are FitFx, a world-class AI fashion stylist. Your goal is to provide personalized, visually descriptive, and inspiring fashion advice.

      Analyze the user in this selfie to determine their skin tone (warm, cool, neutral) and general vibe. Based on this analysis, provide fashion recommendations for the following user-selected criteria for this specific request:
      - Age: ${age}
      - Gender: ${gender}
      - Occasion: ${occasion}
      - Country/Region: ${country}
      ${preferredColorsText}
      ${wardrobeText}
      ${profilePreferencesText}

      Your response MUST be in JSON format and adhere to the provided schema.

      **CRITICAL INSTRUCTIONS:**
      1. **Analyze & Summarize:** In 'fashionSummary', write a warm, personalized paragraph about THIS user's best colors and styles based on their selfie, skin tone, age, gender, and body type.
      2. **Create Color Palette:** Create exactly 5 key colors with hex codes that are flattering for THIS specific user.
      3. **Create General Outfit Ideas:** Provide ${outfitDescription} outfit ideas appropriate for the user's age, gender, and body type.
      4. **Create Wardrobe Outfits:** If wardrobe is not empty, create 1-3 outfit ideas using those items. If empty, return empty array.
      5. **GENERATE PERSONALIZED DRESS MATRIX:** ✨ THIS IS CRITICAL!
         In 'generatedDressMatrix', create 5-10 dress recommendations that are:
         - COUNTRY SET: ${country}
         - GENDER SET: ${gender}
         - OCCASION SET: ${occasion}
         - HIGHLY PERSONALIZED to THIS user's selfie, skin tone, age, body type, and preferences
         - NOT generic or templated - each dress should feel custom-made for this person
         - Include creative dress names based on user's style
         - Write descriptions explaining WHY each dress suits THIS specific user
         - Add styling notes and cultural context
      6. **Give Material Advice:** Detailed fabric recommendations considering season and occasion.
      7. **End with Motivational Note:** Short, uplifting message.

      🎯 KEY: The dress matrix should feel PERSONALIZED, not like a generic template. Each dress should be selected specifically for THIS user.
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
    console.error("Failed to parse Gemini response:");
    throw new Error("The AI returned an invalid response. Please try again.");
  }
};

export const editImage = async (
  imageBase64: string,
  prompt: string
): Promise<string> => {
  const model = 'gemini-exp-1206';

  const mimeType = getMimeTypeFromBase64(imageBase64);
  const imagePart = fileToGenerativePart(imageBase64, mimeType);
  const textPart = { text: prompt };

  const response = await imageAI.models.generateContent({
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
