/**
 * Nepal and Kathmandu Valley Geographic Catalog for Chatbot NLP
 *
 * Provides coordinate mapping, city identification, and synonym matching
 * for natural language property discovery queries.
 */

export interface NepalLocation {
  name: string;
  city: 'Kathmandu' | 'Lalitpur' | 'Bhaktapur' | 'Pokhara' | 'Other';
  latitude: number;
  longitude: number;
  aliases: string[];
}

export const NEPAL_LOCATIONS: NepalLocation[] = [
  // Kathmandu Neighborhoods
  {
    name: 'Baneshwor',
    city: 'Kathmandu',
    latitude: 27.6934,
    longitude: 85.3420,
    aliases: ['baneshwor', 'new baneshwor', 'old baneshwor', 'naya baneshwor', 'purano baneshwor', 'minbhawan', 'shankhamul bridge'],
  },
  {
    name: 'Thamel',
    city: 'Kathmandu',
    latitude: 27.7154,
    longitude: 85.3115,
    aliases: ['thamel', 'chaksibari', 'paknajol', 'jyatha', 'narsingh chowk', 'thamel chowk'],
  },
  {
    name: 'Baluwatar',
    city: 'Kathmandu',
    latitude: 27.7250,
    longitude: 85.3300,
    aliases: ['baluwatar', 'prime minister residence', 'russian embassy area', 'gairidhara'],
  },
  {
    name: 'Lazimpat',
    city: 'Kathmandu',
    latitude: 27.7210,
    longitude: 85.3200,
    aliases: ['lazimpat', 'radisson', 'panipokhari', 'shangri-la'],
  },
  {
    name: 'Koteshwor',
    city: 'Kathmandu',
    latitude: 27.6780,
    longitude: 85.3480,
    aliases: ['koteshwor', 'koteswor', 'jadibuti', 'tinkune'],
  },
  {
    name: 'Dillibazar',
    city: 'Kathmandu',
    latitude: 27.7050,
    longitude: 85.3280,
    aliases: ['dillibazar', 'dilli bazaar', 'ghatekulo', 'putalisadak', 'bagbazar'],
  },
  {
    name: 'Kalanki',
    city: 'Kathmandu',
    latitude: 27.6930,
    longitude: 85.2810,
    aliases: ['kalanki', 'kalanki chowk', 'syuchatar', 'khasibazar'],
  },
  {
    name: 'Maharajgunj',
    city: 'Kathmandu',
    latitude: 27.7360,
    longitude: 85.3310,
    aliases: ['maharajgunj', 'maharajganj', 'teaching hospital', 'tribhuvan university teaching hospital', 'chakrapath'],
  },
  {
    name: 'Chabahil',
    city: 'Kathmandu',
    latitude: 27.7170,
    longitude: 85.3500,
    aliases: ['chabahil', 'chabil', 'mitrapark', 'siphal', 'gaushala'],
  },
  {
    name: 'Boudha',
    city: 'Kathmandu',
    latitude: 27.7215,
    longitude: 85.3620,
    aliases: ['boudha', 'bouddha', 'boudhanath', 'jorpati', 'tusal'],
  },
  {
    name: 'Kathmandu Center',
    city: 'Kathmandu',
    latitude: 27.7042,
    longitude: 85.3075,
    aliases: ['kathmandu', 'ktm', 'new road', 'asong', 'durbar square', 'basantapur', 'sundhara'],
  },

  // Lalitpur / Patan Neighborhoods
  {
    name: 'Patan',
    city: 'Lalitpur',
    latitude: 27.6744,
    longitude: 85.3216,
    aliases: ['patan', 'yala', 'mangal bazaar', 'patan durbar', 'subakhal'],
  },
  {
    name: 'Jhamsikhel',
    city: 'Lalitpur',
    latitude: 27.6789,
    longitude: 85.3117,
    aliases: ['jhamsikhel', 'jhamshikhel', 'restaurant lane'],
  },
  {
    name: 'Sanepa',
    city: 'Lalitpur',
    latitude: 27.6833,
    longitude: 85.3092,
    aliases: ['sanepa', 'sanepa heights', 'british school road'],
  },
  {
    name: 'Pulchowk',
    city: 'Lalitpur',
    latitude: 27.6792,
    longitude: 85.3168,
    aliases: ['pulchowk', 'pulchok', 'labim mall', 'engineering campus'],
  },
  {
    name: 'Kupondole',
    city: 'Lalitpur',
    latitude: 27.6886,
    longitude: 85.3164,
    aliases: ['kupondole', 'kupondol', 'bagmati corridor lalitpur'],
  },
  {
    name: 'Jawalakhel',
    city: 'Lalitpur',
    latitude: 27.6728,
    longitude: 85.3142,
    aliases: ['jawalakhel', 'central zoo area', 'ekantakuna'],
  },
  {
    name: 'Bhaisepati',
    city: 'Lalitpur',
    latitude: 27.6534,
    longitude: 85.3045,
    aliases: ['bhaisepati', 'bhainsepati', 'minister quarters lalitpur'],
  },
  {
    name: 'Lalitpur Center',
    city: 'Lalitpur',
    latitude: 27.6744,
    longitude: 85.3216,
    aliases: ['lalitpur', 'patan city'],
  },

  // Bhaktapur Neighborhoods
  {
    name: 'Bhaktapur Durbar Square',
    city: 'Bhaktapur',
    latitude: 27.6722,
    longitude: 85.4280,
    aliases: ['bhaktapur', 'bhadgaon', 'suryabinayak', 'sallaghari', 'thimi', 'sanothimi'],
  },

  // Pokhara
  {
    name: 'Lakeside Pokhara',
    city: 'Pokhara',
    latitude: 28.2096,
    longitude: 83.9595,
    aliases: ['pokhara', 'lakeside', 'damside', 'fewa lake'],
  },
];

export function resolveLocationText(text: string): NepalLocation | null {
  const normalized = text.toLowerCase();
  
  for (const loc of NEPAL_LOCATIONS) {
    // Check main name
    if (normalized.includes(loc.name.toLowerCase())) {
      return loc;
    }
    // Check aliases
    for (const alias of loc.aliases) {
      if (normalized.includes(alias.toLowerCase())) {
        return loc;
      }
    }
  }

  // Broad check for cities
  if (normalized.includes('kathmandu') || normalized.includes('ktm')) {
    return NEPAL_LOCATIONS.find((l) => l.name === 'Kathmandu Center') ?? null;
  }
  if (normalized.includes('lalitpur') || normalized.includes('patan')) {
    return NEPAL_LOCATIONS.find((l) => l.name === 'Patan') ?? null;
  }
  if (normalized.includes('bhaktapur')) {
    return NEPAL_LOCATIONS.find((l) => l.name === 'Bhaktapur Durbar Square') ?? null;
  }
  if (normalized.includes('pokhara')) {
    return NEPAL_LOCATIONS.find((l) => l.name === 'Lakeside Pokhara') ?? null;
  }

  return null;
}

