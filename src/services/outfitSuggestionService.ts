import { GoogleGenerativeAI } from '@google/generative-ai';

import type { UserProfile, Garment } from '../types';


const apiKey = process.env.REACT_APP_GEMINI_API;



const genAI = new GoogleGenerativeAI(apiKey || '');

export interface PersonalizedOutfit {
  outfitName: string;
  occasion: string;
  colorCombination: string[];
  topWear: string;
  bottomWear: string;
  layering?: string;
  footwear: string;
  accessories: string;
  whyItWorks: string;
  styleCategory: string;
}

export const generatePersonalizedOutfits = async (
  userProfile: UserProfile,
  wardrobe: Garment[]
): Promise<PersonalizedOutfit[]> => {
  try {
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite'
    });

    const wardrobeList = wardrobe.length > 0 
      ? wardrobe.map(g => `- ${g.color} ${g.material}`).join('\n')
      : 'No wardrobe items yet';

    const prompt = `You are a professional fashion stylist. Generate 15 personalized outfit recommendations based on the user's profile.

USER PROFILE:
- Name: ${userProfile.name}
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Body Type: ${userProfile.bodyType || 'Not specified'}
- Preferred Styles: ${userProfile.preferredStyles?.join(', ') || 'Not specified'}
- Favorite Colors: ${userProfile.favoriteColors?.join(', ') || 'Not specified'}
- Preferred Occasions: ${userProfile.preferredOccasions?.join(', ') || 'All occasions'}
- Preferred Fabrics: ${userProfile.preferredFabrics?.join(', ') || 'Not specified'}
- Fashion Icons: ${userProfile.fashionIcons || 'Not specified'}

WARDROBE ITEMS (${wardrobe.length} items):
${wardrobeList}

Generate outfit suggestions that match their preferences.

Return ONLY a valid JSON array of 15 outfits in this exact format:
[
  {
    "outfitName": "Navy Power Suit",
    "occasion": "Professional",
    "colorCombination": ["Navy Blue", "White", "Brown"],
    "topWear": "Crisp white cotton dress shirt",
    "bottomWear": "Navy blue tailored trousers",
    "layering": "Navy blue blazer",
    "footwear": "Brown leather oxford shoes",
    "accessories": "Brown leather belt, silver watch, navy tie",
    "whyItWorks": "Classic professional look",
    "styleCategory": "American"
  }
]`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
        
    let jsonText = responseText;
    
    // Remove markdown code blocks with triple backticks
    const marker = String.fromCharCode(96, 96, 96); 
    if (jsonText.includes(marker + 'json')) {
      const parts = jsonText.split(marker + 'json');
      if (parts.length > 1) {
        const secondSplit = parts[1].split(marker);
        jsonText = secondSplit[0];
      }
    } else if (jsonText.includes(marker)) {
    const parts = jsonText.split(marker);
    if (parts.length > 2) {  // ✅ Ensure there are at least 2 splits
        jsonText = parts[1];
    }
    }

    
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON array found in AI response');
    }
    
    const outfits: PersonalizedOutfit[] = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(outfits) || outfits.length === 0) {
      throw new Error('Invalid outfit data received from AI');
    }
    
    return outfits;
  } catch (error: any) {
    console.error('Error generating outfit suggestions:', error);
    throw new Error(`Failed to generate outfits: ${error.message}`);
  }
};