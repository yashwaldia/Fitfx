export interface ColorPaletteItem {
  colorName: string;
  hexCode: string;
  description: string;
}

export type Occasion = 'Professional' | 'Party' | 'Casual' | 'Other';
export type Style = 'American' | 'Indian' | 'Fusion' | 'Other';
export type Gender = 'Male' | 'Female' | 'Unisex' | 'Kids';
export type AgeGroup = 'Teen (13-17)' | 'Young Adult (18-25)' | 'Adult (26-35)' | 'Middle-Aged (36-45)' | 'Senior (46+)';

export type BodyType =
  'Rectangle' | 'Triangle' | 'Inverted Triangle' | 'Hourglass' | 'Round (Apple)' |
  'Pear' | 'Athletic' | 'Slim / Lean' | 'Petite' | 'Tall' | 'Curvy' | 'Oval' |
  'Straight / Column' | 'Diamond' | 'Muscular / V Shape' | 'Lollipop' |
  'Skittle' | 'Top Hourglass' | 'Bottom Hourglass' | 'Plus Size';

export interface Garment {
  image: string;  // ✅ Keep image field
  material: string;
  color: string;
  id?: string;
  uploadedAt?: string;
}

export interface OutfitIdea {
  outfitName: string;
  colorName: string;
  fabricType: string;
  idealOccasion: string;
  whyItWorks: string;
  suggestedPairingItems: string;
}

export interface StyleAdvice {
  fashionSummary: string;
  colorPalette: ColorPaletteItem[];
  outfitIdeas: OutfitIdea[];
  wardrobeOutfitIdeas?: OutfitIdea[];
  materialAdvice: string;
  motivationalNote: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export interface UserProfile {
  profilePhoto?: string;
  name: string;
  age: string;
  gender: Gender;
  bodyType?: BodyType;
  preferredOccasions: Occasion[];
  preferredStyles: Style[];
  favoriteColors: string[];
  preferredFabrics?: string[];
  fashionIcons?: string;
}

export interface OutfitData {
  "Colour Combination": string;
  "T-Shirt/Shirt": string;
  "Trousers/Bottom": string;
  "Jacket/Layer": string;
  "Shoes & Accessories": string;
}
