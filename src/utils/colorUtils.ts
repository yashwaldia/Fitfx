// Map color names to hex codes
export const colorNameToHex: { [key: string]: string } = {
  // Basic colors
  'white': '#FFFFFF',
  'black': '#000000',
  'red': '#FF0000',
  'blue': '#0000FF',
  'green': '#008000',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'purple': '#800080',
  'pink': '#FFC0CB',
  'brown': '#8B4513',
  'grey': '#808080',
  'gray': '#808080',
  'beige': '#F5F5DC',
  'cream': '#FFFDD0',
  'ivory': '#FFFFF0',
  
  // Blues
  'navy blue': '#000080',
  'navy': '#000080',
  'sky blue': '#87CEEB',
  'royal blue': '#4169E1',
  'teal': '#008080',
  'turquoise': '#40E0D0',
  
  // Reds/Pinks
  'maroon': '#800000',
  'burgundy': '#800020',
  'wine': '#722F37',
  'crimson': '#DC143C',
  'coral': '#FF7F50',
  'magenta': '#FF00FF',
  'hot pink': '#FF69B4',
  'rose': '#FF007F',
  
  // Greens
  'olive': '#808000',
  'olive green': '#6B8E23',
  'sage green': '#BCB88A',
  'emerald': '#50C878',
  'mint': '#98FF98',
  'lime': '#00FF00',
  
  // Yellows/Golds
  'mustard': '#FFDB58',
  'gold': '#FFD700',
  'champagne': '#F7E7CE',
  'tan': '#D2B48C',
  'camel': '#C19A6B',
  
  // Purples
  'lavender': '#E6E6FA',
  'violet': '#8F00FF',
  'plum': '#DDA0DD',
  
  // Browns
  'chocolate': '#D2691E',
  'coffee': '#6F4E37',
  'cognac': '#9A463D',
  'rust': '#B7410E',
  'terracotta': '#E2725B',
  
  // Grays
  'charcoal': '#36454F',
  'silver': '#C0C0C0',
  'slate': '#708090',
  
  // Others
  'peach': '#FFE5B4',
  'nude': '#E3BC9A',
  'khaki': '#F0E68C',
  'denim': '#1560BD'
};

export const getColorHex = (colorName: string): string => {
  const normalized = colorName.toLowerCase().trim();
  return colorNameToHex[normalized] || '#808080'; // Default to gray if not found
};

export const getColorName = (colorName: string): string => {
  // Convert hex to readable name if needed
  if (colorName.startsWith('#')) {
    const entry = Object.entries(colorNameToHex).find(([_, hex]) => hex.toLowerCase() === colorName.toLowerCase());
    return entry ? entry[0].charAt(0).toUpperCase() + entry[0].slice(1) : colorName;
  }
  return colorName;
};
