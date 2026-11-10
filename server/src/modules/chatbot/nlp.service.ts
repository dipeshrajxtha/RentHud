import { resolveLocationText, type NepalLocation } from './nepal-locations.js';

export type DetectedIntent =
  | 'property_search'
  | 'tenant_satisfaction'
  | 'maintenance_issue'
  | 'financial_difficulty'
  | 'landlord_communication'
  | 'future_accommodation'
  | 'emergency'
  | 'general';

export interface ExtractedCriteria {
  location?: NepalLocation | null;
  locationName?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: 'apartment' | 'flat' | 'house' | 'room' | 'studio';
  furnishing?: 'furnished' | 'semi-furnished' | 'unfurnished';
  amenities?: string[];
  maintenanceCategory?: string;
  maintenanceUrgency?: 'Emergency' | 'High' | 'Normal' | 'Low';
  maintenanceTitle?: string;
  maintenanceDescription?: string;
  financialTopic?: string;
  satisfactionTone?: 'positive' | 'negative' | 'neutral';
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  'twenty-five': 25,
  thirty: 30,
  'thirty-five': 35,
  forty: 40,
  'forty-five': 45,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

export function parseNepaliBudget(text: string): { minRent?: number; maxRent?: number } {
  const normalized = text.toLowerCase().replace(/,/g, '');

  // 1. Range: between 15k and 25k, 15000 - 25000, 15k to 25k
  const rangeMatch = normalized.match(
    /(?:between|from)?\s*(?:npr|rs\.?|रू)?\s*(\d+(?:\.\d+)?)\s*(k|thousand)?\s*(?:to|-|and)\s*(?:npr|rs\.?|रू)?\s*(\d+(?:\.\d+)?)\s*(k|thousand)?/i
  );
  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1]);
    if (rangeMatch[2] === 'k' || rangeMatch[2] === 'thousand' || min < 100) {
      min = min * 1000;
    }
    let max = parseFloat(rangeMatch[3]);
    if (rangeMatch[4] === 'k' || rangeMatch[4] === 'thousand' || max < 100) {
      max = max * 1000;
    }
    if (min > 0 && max >= min) {
      return { minRent: min, maxRent: max };
    }
  }

  // 2. "20k", "25.5k"
  const kMatch = normalized.match(/(?:below|under|max|upto|up to|within|around|approx)?\s*(?:npr|rs\.?|रू)?\s*(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    const val = parseFloat(kMatch[1]) * 1000;
    if (normalized.includes('above') || normalized.includes('min') || normalized.includes('more than')) {
      return { minRent: val };
    }
    return { maxRent: val };
  }

  // 3. Word-based numbers: "twenty thousand", "twenty five thousand"
  const wordMatch = normalized.match(
    /(?:below|under|around|within|upto|up to)?\s*(twenty|thirty|forty|fifty|sixty|seventy|eighty|fifteen|ten)(?:\s+(five))?\s+thousand/i
  );
  if (wordMatch) {
    let thousands = NUMBER_WORDS[wordMatch[1]] || 20;
    if (wordMatch[2] && NUMBER_WORDS[wordMatch[2]]) {
      thousands += NUMBER_WORDS[wordMatch[2]];
    }
    const val = thousands * 1000;
    if (normalized.includes('above') || normalized.includes('min') || normalized.includes('more than')) {
      return { minRent: val };
    }
    return { maxRent: val };
  }

  // 4. Direct numeric values: "below 25000", "20000 budget", "under 18000"
  const numericMatch = normalized.match(
    /(?:budget|below|under|around|within|upto|up to|less than|max)?\s*(?:npr|rs\.?|रू)?\s*(\d{4,6})\b/i
  );
  if (numericMatch) {
    const val = parseInt(numericMatch[1], 10);
    if (val >= 2000 && val <= 500000) {
      if (normalized.includes('above') || normalized.includes('min') || normalized.includes('more than')) {
        return { minRent: val };
      }
      return { maxRent: val };
    }
  }

  return {};
}

export function parseBedrooms(text: string): number | undefined {
  const normalized = text.toLowerCase();

  // BHK format: "1bhk", "2 bhk", "3 bhk"
  const bhkMatch = normalized.match(/(\d+)\s*bhk/i);
  if (bhkMatch) {
    return parseInt(bhkMatch[1], 10);
  }

  // "1 bedroom", "2 bedrooms", "two-bedroom", "two bedroom"
  if (normalized.includes('single room') || normalized.includes('1 room') || normalized.includes('one bedroom') || normalized.includes('1 bedroom') || normalized.includes('1-bedroom')) {
    return 1;
  }
  if (normalized.includes('two bedroom') || normalized.includes('two-bedroom') || normalized.includes('2 bedroom') || normalized.includes('2-bedroom')) {
    return 2;
  }
  if (normalized.includes('three bedroom') || normalized.includes('three-bedroom') || normalized.includes('3 bedroom') || normalized.includes('3-bedroom')) {
    return 3;
  }
  if (normalized.includes('four bedroom') || normalized.includes('4 bedroom')) {
    return 4;
  }
  if (normalized.includes('studio')) {
    return 1;
  }

  return undefined;
}

export function parseBathrooms(text: string): number | undefined {
  const normalized = text.toLowerCase();
  const match = normalized.match(/(\d+)\s*(?:bath|bathroom)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  if (normalized.includes('one bathroom') || normalized.includes('1 bath')) return 1;
  if (normalized.includes('two bathrooms') || normalized.includes('2 bath')) return 2;
  return undefined;
}

export function parseFurnishing(text: string): 'furnished' | 'semi-furnished' | 'unfurnished' | undefined {
  const normalized = text.toLowerCase();
  if (normalized.includes('semi-furnished') || normalized.includes('semi furnished')) {
    return 'semi-furnished';
  }
  if (normalized.includes('unfurnished') || normalized.includes('un-furnished') || normalized.includes('non furnished') || normalized.includes('non-furnished')) {
    return 'unfurnished';
  }
  if (normalized.includes('furnished') || normalized.includes('fully furnished')) {
    return 'furnished';
  }
  return undefined;
}

export function parsePropertyType(text: string): 'apartment' | 'flat' | 'house' | 'room' | 'studio' | undefined {
  const normalized = text.toLowerCase();
  if (normalized.includes('apartment')) return 'apartment';
  if (normalized.includes('flat')) return 'flat';
  if (normalized.includes('house') || normalized.includes('bungalow') || normalized.includes('villa')) return 'house';
  if (normalized.includes('studio')) return 'studio';
  if (normalized.includes('room') || normalized.includes('single room')) return 'room';
  return undefined;
}

export function parseAmenities(text: string): string[] {
  const normalized = text.toLowerCase();
  const amenities: string[] = [];

  if (normalized.includes('wifi') || normalized.includes('wi-fi') || normalized.includes('internet')) {
    amenities.push('wifi');
  }
  if (normalized.includes('parking') || normalized.includes('car parking') || normalized.includes('bike parking')) {
    amenities.push('parking');
  }
  if (normalized.includes('balcony') || normalized.includes('terrace')) {
    amenities.push('balcony');
  }
  if (normalized.includes('water') || normalized.includes('boring water') || normalized.includes('melamchi')) {
    amenities.push('water-supply');
  }
  if (normalized.includes('generator') || normalized.includes('backup') || normalized.includes('inverter')) {
    amenities.push('power-backup');
  }
  if (normalized.includes('pet') || normalized.includes('dog') || normalized.includes('cat')) {
    amenities.push('pet-friendly');
  }
  if (normalized.includes('lift') || normalized.includes('elevator')) {
    amenities.push('lift');
  }

  return amenities;
}

export function detectIntent(text: string): DetectedIntent {
  const normalized = text.toLowerCase();

  // Emergency safety keywords
  if (
    normalized.includes('fire') ||
    normalized.includes('gas leak') ||
    normalized.includes('electric shock') ||
    normalized.includes('sparking wire') ||
    normalized.includes('ceiling collapsed') ||
    normalized.includes('physical violence') ||
    normalized.includes('threat') ||
    normalized.includes('emergency danger')
  ) {
    return 'emergency';
  }

  // Financial difficulties with rent
  if (
    normalized.includes('cannot pay rent') ||
    normalized.includes("can't pay rent") ||
    normalized.includes('unable to pay rent') ||
    normalized.includes('financial difficult') ||
    normalized.includes('financial problem') ||
    normalized.includes('delay rent') ||
    normalized.includes('rent extension') ||
    normalized.includes('late rent') ||
    normalized.includes('trouble paying') ||
    normalized.includes('salary delayed') ||
    normalized.includes('hard to pay') ||
    normalized.includes('rent payment issue')
  ) {
    return 'financial_difficulty';
  }

  // Maintenance issues
  if (
    normalized.includes('leakage') ||
    normalized.includes('leak') ||
    normalized.includes('plumbing') ||
    normalized.includes('tap broken') ||
    normalized.includes('pipe') ||
    normalized.includes('sewage') ||
    normalized.includes('drain') ||
    normalized.includes('water supply problem') ||
    normalized.includes('no water') ||
    normalized.includes('electricity problem') ||
    normalized.includes('power cut in my room') ||
    normalized.includes('short circuit') ||
    normalized.includes('switch not working') ||
    normalized.includes('maintenance') ||
    normalized.includes('repair') ||
    normalized.includes('damage') ||
    normalized.includes('geyser') ||
    normalized.includes('mold') ||
    normalized.includes('dampness')
  ) {
    return 'maintenance_issue';
  }

  // Landlord communication / drafting
  if (
    normalized.includes('message to landlord') ||
    normalized.includes('talk to landlord') ||
    normalized.includes('letter to landlord') ||
    normalized.includes('contact owner') ||
    normalized.includes('inform landlord') ||
    normalized.includes('landlord dispute') ||
    normalized.includes('draft message')
  ) {
    return 'landlord_communication';
  }

  // Future accommodation / tenancy planning
  if (
    normalized.includes('moving out') ||
    normalized.includes('move to another') ||
    normalized.includes('leave this flat') ||
    normalized.includes('ending tenancy') ||
    normalized.includes('terminate lease') ||
    normalized.includes('shift to new') ||
    normalized.includes('find a bigger place') ||
    normalized.includes('renew lease') ||
    normalized.includes('lease expiration')
  ) {
    return 'future_accommodation';
  }

  // Tenant satisfaction check-in
  if (
    normalized.includes('satisfied with') ||
    normalized.includes('not happy with') ||
    normalized.includes('unhappy with') ||
    normalized.includes('noisy neighbor') ||
    normalized.includes('cold room') ||
    normalized.includes('how is my stay') ||
    normalized.includes('tenancy experience') ||
    normalized.includes('feel about my rent') ||
    normalized.includes('living arrangement')
  ) {
    return 'tenant_satisfaction';
  }

  // Property search
  if (
    normalized.includes('looking for') ||
    normalized.includes('find') ||
    normalized.includes('search') ||
    normalized.includes('apartment') ||
    normalized.includes('flat') ||
    normalized.includes('room') ||
    normalized.includes('bhk') ||
    normalized.includes('rent in') ||
    normalized.includes('budget') ||
    normalized.includes('available property') ||
    resolveLocationText(normalized) !== null ||
    parseNepaliBudget(normalized).maxRent !== undefined ||
    parseBedrooms(normalized) !== undefined
  ) {
    return 'property_search';
  }

  return 'general';
}

export function extractAllCriteria(text: string): ExtractedCriteria {
  const location = resolveLocationText(text);
  const { minRent, maxRent } = parseNepaliBudget(text);
  const bedrooms = parseBedrooms(text);
  const bathrooms = parseBathrooms(text);
  const propertyType = parsePropertyType(text);
  const furnishing = parseFurnishing(text);
  const amenities = parseAmenities(text);

  const criteria: ExtractedCriteria = {
    location,
    locationName: location ? location.name : undefined,
    minRent,
    maxRent,
    bedrooms,
    bathrooms,
    propertyType,
    furnishing,
    amenities: amenities.length > 0 ? amenities : undefined,
  };

  // Maintenance details if present
  const normalized = text.toLowerCase();
  if (
    normalized.includes('leak') ||
    normalized.includes('pipe') ||
    normalized.includes('tap') ||
    normalized.includes('drain')
  ) {
    criteria.maintenanceCategory = 'Plumbing';
    criteria.maintenanceUrgency = normalized.includes('continuous') || normalized.includes('flooding') ? 'High' : 'Normal';
    criteria.maintenanceTitle = 'Water Leakage / Plumbing Issue';
    criteria.maintenanceDescription = text;
  } else if (normalized.includes('electric') || normalized.includes('wiring') || normalized.includes('spark') || normalized.includes('switch')) {
    criteria.maintenanceCategory = 'Electrical';
    criteria.maintenanceUrgency = normalized.includes('spark') || normalized.includes('smoke') ? 'Emergency' : 'Normal';
    criteria.maintenanceTitle = 'Electrical Fault';
    criteria.maintenanceDescription = text;
  } else if (normalized.includes('water supply') || normalized.includes('no water') || normalized.includes('tank')) {
    criteria.maintenanceCategory = 'Water Supply';
    criteria.maintenanceUrgency = 'High';
    criteria.maintenanceTitle = 'Water Supply Interruption';
    criteria.maintenanceDescription = text;
  }

  return criteria;
}

