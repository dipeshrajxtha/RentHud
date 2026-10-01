/**
 * Kathmandu Valley & Nepal Location Resolver
 *
 * Provides accurate coordinates, aliases, and smart location resolution
 * for neighborhoods, municipalities, and landmarks.
 */

export interface LocationInfo {
  name: string;
  city: 'Kathmandu' | 'Lalitpur' | 'Bhaktapur' | 'Other';
  latitude: number;
  longitude: number;
  aliases: string[];
}

export const CITY_COORDINATES = {
  Kathmandu: { latitude: 27.7080, longitude: 85.3200 },
  Lalitpur: { latitude: 27.6744, longitude: 85.3216 },
  Bhaktapur: { latitude: 27.6722, longitude: 85.4280 },
  All: { latitude: 27.7080, longitude: 85.3200 },
} as const;

export const NEPAL_LOCATIONS: LocationInfo[] = [
  // ── Lalitpur / Patan ──────────────────────────────────────────
  {
    name: 'Patan',
    city: 'Lalitpur',
    latitude: 27.6744,
    longitude: 85.3216,
    aliases: ['patan', 'yala', 'patan durbar', 'mangal bazaar', 'mangalbazar', 'pantan'],
  },
  {
    name: 'Lalitpur',
    city: 'Lalitpur',
    latitude: 27.6744,
    longitude: 85.3216,
    aliases: ['lalitpur', 'lalitpur city'],
  },
  {
    name: 'Sanepa',
    city: 'Lalitpur',
    latitude: 27.6833,
    longitude: 85.3092,
    aliases: ['sanepa', 'sanepa heights', 'british school', 'sanepa chowk'],
  },
  {
    name: 'Jhamsikhel',
    city: 'Lalitpur',
    latitude: 27.6789,
    longitude: 85.3117,
    aliases: ['jhamsikhel', 'jhamshikhel', 'restaurant street'],
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
    aliases: ['kupondole', 'kupondol', 'bagmati bridge'],
  },
  {
    name: 'Jawalakhel',
    city: 'Lalitpur',
    latitude: 27.6728,
    longitude: 85.3142,
    aliases: ['jawalakhel', 'jawlakhel', 'zoo', 'central zoo'],
  },
  {
    name: 'Lagankhel',
    city: 'Lalitpur',
    latitude: 27.6667,
    longitude: 85.3235,
    aliases: ['lagankhel', 'patan hospital', 'lagankhel bus park'],
  },
  {
    name: 'Bhaisepati',
    city: 'Lalitpur',
    latitude: 27.6534,
    longitude: 85.3045,
    aliases: ['bhaisepati', 'bhainsepati', 'minister quarters'],
  },
  {
    name: 'Satdobato',
    city: 'Lalitpur',
    latitude: 27.6582,
    longitude: 85.3259,
    aliases: ['satdobato', 'swimming complex', 'anfacomplex'],
  },
  {
    name: 'Balkumari',
    city: 'Lalitpur',
    latitude: 27.6698,
    longitude: 85.3402,
    aliases: ['balkumari', 'balkumari bridge'],
  },
  {
    name: 'Imadol',
    city: 'Lalitpur',
    latitude: 27.6635,
    longitude: 85.3435,
    aliases: ['imadol', 'kist hospital'],
  },
  {
    name: 'Dhapakhel',
    city: 'Lalitpur',
    latitude: 27.6432,
    longitude: 85.3250,
    aliases: ['dhapakhel', 'gems school', 'nagdaha'],
  },
  {
    name: 'Gwarko',
    city: 'Lalitpur',
    latitude: 27.6675,
    longitude: 85.3340,
    aliases: ['gwarko', 'gwarko flyover'],
  },

  // ── Kathmandu ──────────────────────────────────────────────────
  {
    name: 'Kathmandu Center',
    city: 'Kathmandu',
    latitude: 27.7080,
    longitude: 85.3200,
    aliases: ['kathmandu', 'ktm', 'durbar marg', 'durbarmarg', 'ratnapark', 'ratna park'],
  },
  {
    name: 'Thamel',
    city: 'Kathmandu',
    latitude: 27.7154,
    longitude: 85.3123,
    aliases: ['thamel', 'chhetrapati', 'paknajol'],
  },
  {
    name: 'Lazimpat',
    city: 'Kathmandu',
    latitude: 27.7214,
    longitude: 85.3189,
    aliases: ['lazimpat', 'radisson', 'embassy quarter'],
  },
  {
    name: 'Baluwatar',
    city: 'Kathmandu',
    latitude: 27.7285,
    longitude: 85.3289,
    aliases: ['baluwatar', 'prime minister residence', 'russian embassy', 'nrba'],
  },
  {
    name: 'Maharajgunj',
    city: 'Kathmandu',
    latitude: 27.7370,
    longitude: 85.3315,
    aliases: ['maharajgunj', 'maharajganj', 'teaching hospital', 'us embassy'],
  },
  {
    name: 'Boudha',
    city: 'Kathmandu',
    latitude: 27.7215,
    longitude: 85.3619,
    aliases: ['boudha', 'bouddha', 'stupa', 'boudhanath', 'tusal chowk'],
  },
  {
    name: 'Jorpati',
    city: 'Kathmandu',
    latitude: 27.7250,
    longitude: 85.3780,
    aliases: ['jorpati', 'dakshinkali', 'narayantar'],
  },
  {
    name: 'Chabahil',
    city: 'Kathmandu',
    latitude: 27.7172,
    longitude: 85.3496,
    aliases: ['chabahil', 'chabil', 'mitrapark', 'stupa hospital'],
  },
  {
    name: 'Gaushala',
    city: 'Kathmandu',
    latitude: 27.7085,
    longitude: 85.3480,
    aliases: ['gaushala', 'pashupatinath', 'pashupati', 'tilganga'],
  },
  {
    name: 'New Baneshwor',
    city: 'Kathmandu',
    latitude: 27.6915,
    longitude: 85.3420,
    aliases: ['baneshwor', 'new baneshwor', 'old baneshwor', 'parliament', 'aloknagar', 'shankhamul'],
  },
  {
    name: 'Koteshwor',
    city: 'Kathmandu',
    latitude: 27.6775,
    longitude: 85.3486,
    aliases: ['koteshwor', 'koteswor', 'jadibuti'],
  },
  {
    name: 'Tinkune',
    city: 'Kathmandu',
    latitude: 27.6838,
    longitude: 85.3475,
    aliases: ['tinkune', 'subidhanagar'],
  },
  {
    name: 'Sinamangal',
    city: 'Kathmandu',
    latitude: 27.6950,
    longitude: 85.3530,
    aliases: ['sinamangal', 'airport', 'tia', 'khec'],
  },
  {
    name: 'Anamnagar',
    city: 'Kathmandu',
    latitude: 27.6945,
    longitude: 85.3226,
    aliases: ['anamnagar', 'singha durbar', 'ghattekulo'],
  },
  {
    name: 'Maitighar',
    city: 'Kathmandu',
    latitude: 27.6930,
    longitude: 85.3200,
    aliases: ['maitighar', 'babarmahal', 'babar mahal'],
  },
  {
    name: 'New Road',
    city: 'Kathmandu',
    latitude: 27.7035,
    longitude: 85.3110,
    aliases: ['new road', 'newroad', 'khichapokhari', 'sankata', 'peepalbot'],
  },
  {
    name: 'Asan',
    city: 'Kathmandu',
    latitude: 27.7070,
    longitude: 85.3115,
    aliases: ['asan', 'indra chowk', 'indrachowk'],
  },
  {
    name: 'Kalimati',
    city: 'Kathmandu',
    latitude: 27.6980,
    longitude: 85.3000,
    aliases: ['kalimati', 'soaltee mode', 'tahachal'],
  },
  {
    name: 'Balkhu',
    city: 'Kathmandu',
    latitude: 27.6845,
    longitude: 85.3005,
    aliases: ['balkhu', 'kuleshwor', 'ring road balkhu'],
  },
  {
    name: 'Kirtipur',
    city: 'Kathmandu',
    latitude: 27.6798,
    longitude: 85.2754,
    aliases: ['kirtipur', 'tu', 'tribhuvan university', 'naya bazaar kirtipur'],
  },
  {
    name: 'Kalanki',
    city: 'Kathmandu',
    latitude: 27.6937,
    longitude: 85.2818,
    aliases: ['kalanki', 'kalanki underpass', 'syuchatar'],
  },
  {
    name: 'Sitapaila',
    city: 'Kathmandu',
    latitude: 27.7050,
    longitude: 85.2750,
    aliases: ['sitapaila', 'ramkot', 'nagarjun'],
  },
  {
    name: 'Swayambhu',
    city: 'Kathmandu',
    latitude: 27.7149,
    longitude: 85.2903,
    aliases: ['swayambhu', 'monkey temple', 'bijeshwori'],
  },
  {
    name: 'Samakhusi',
    city: 'Kathmandu',
    latitude: 27.7300,
    longitude: 85.3140,
    aliases: ['samakhusi', 'ranibari', 'town planning'],
  },
  {
    name: 'Gongabu',
    city: 'Kathmandu',
    latitude: 27.7378,
    longitude: 85.3108,
    aliases: ['gongabu', 'new bus park', 'buspark', 'machhapokhari'],
  },
  {
    name: 'Tokha',
    city: 'Kathmandu',
    latitude: 27.7667,
    longitude: 85.3167,
    aliases: ['tokha', 'grande hospital', 'dhapasi'],
  },
  {
    name: 'Budhanilkantha',
    city: 'Kathmandu',
    latitude: 27.7800,
    longitude: 85.3600,
    aliases: ['budhanilkantha', 'narayanthan', 'golfutar', 'hattigauda'],
  },
  {
    name: 'Dhumbarahi',
    city: 'Kathmandu',
    latitude: 27.7275,
    longitude: 85.3468,
    aliases: ['dhumbarahi', 'sukedhara', 'chappal karkhana', 'mandikhatar'],
  },
  {
    name: 'Basundhara',
    city: 'Kathmandu',
    latitude: 27.7420,
    longitude: 85.3340,
    aliases: ['basundhara', 'ishaan hospital'],
  },

  // ── Bhaktapur ──────────────────────────────────────────────────
  {
    name: 'Bhaktapur Center',
    city: 'Bhaktapur',
    latitude: 27.6722,
    longitude: 85.4280,
    aliases: ['bhaktapur', 'bhadgaon', 'khwopa', 'bhaktapur durbar', 'dattatreya'],
  },
  {
    name: 'Thimi',
    city: 'Bhaktapur',
    latitude: 27.6811,
    longitude: 85.3850,
    aliases: ['thimi', 'madhyapur', 'madhyapur thimi', 'radhe radhe'],
  },
  {
    name: 'Lokanthali',
    city: 'Bhaktapur',
    latitude: 27.6780,
    longitude: 85.3650,
    aliases: ['lokanthali', 'kaushaltar', 'gathaghar'],
  },
  {
    name: 'Sallaghari',
    city: 'Bhaktapur',
    latitude: 27.6720,
    longitude: 85.4110,
    aliases: ['sallaghari', 'srijana nagar'],
  },
  {
    name: 'Suryabinayak',
    city: 'Bhaktapur',
    latitude: 27.6690,
    longitude: 85.4300,
    aliases: ['suryabinayak', 'surya binayak', 'pilot baba'],
  },
  {
    name: 'Kamalbinayak',
    city: 'Bhaktapur',
    latitude: 27.6780,
    longitude: 85.4410,
    aliases: ['kamalbinayak', 'kamalpokhari bhaktapur'],
  },
];

/**
 * Resolves a search query to a matching geographical location within Kathmandu Valley.
 * Returns the matched LocationInfo or null if not an recognized location name.
 */
export function resolveLocationFromQuery(query: string): LocationInfo | null {
  if (!query || !query.trim()) return null;
  const clean = query.trim().toLowerCase();

  // 1. Direct exact alias match
  for (const loc of NEPAL_LOCATIONS) {
    if (loc.aliases.some((a) => a === clean)) {
      return loc;
    }
  }

  // 2. Contains word match (e.g. "rent in patan", "patan 2bhk", "near sanepa")
  for (const loc of NEPAL_LOCATIONS) {
    if (
      loc.aliases.some((a) => {
        // Match word boundaries or substring
        const regex = new RegExp(`\\b${a}\\b`, 'i');
        return regex.test(clean) || clean.includes(a);
      })
    ) {
      return loc;
    }
  }

  return null;
}

/**
 * Checks if search text matches known synonym sets (e.g. Patan <-> Lalitpur)
 */
export function matchesLocationSynonym(query: string, text: string): boolean {
  const q = query.trim().toLowerCase();
  const t = text.trim().toLowerCase();

  if (t.includes(q)) return true;

  // Lalitpur / Patan synonym pair
  const isPatanRelated = q.includes('patan') || q.includes('lalitpur') || q.includes('yala');
  if (isPatanRelated) {
    if (
      t.includes('lalitpur') ||
      t.includes('patan') ||
      t.includes('sanepa') ||
      t.includes('jhamsikhel') ||
      t.includes('pulchowk') ||
      t.includes('jawalakhel') ||
      t.includes('kupondole')
    ) {
      return true;
    }
  }

  // Kathmandu synonym pair
  const isKtmRelated = q.includes('kathmandu') || q === 'ktm' || q.includes('kantipur');
  if (isKtmRelated) {
    if (
      t.includes('kathmandu') ||
      t.includes('lazimpat') ||
      t.includes('baluwatar') ||
      t.includes('thamel') ||
      t.includes('boudha') ||
      t.includes('baneshwor')
    ) {
      return true;
    }
  }

  // Bhaktapur synonym pair
  const isBhkRelated = q.includes('bhaktapur') || q.includes('thimi') || q.includes('khwopa') || q.includes('bhadgaon');
  if (isBhkRelated) {
    if (t.includes('bhaktapur') || t.includes('thimi') || t.includes('suryabinayak')) {
      return true;
    }
  }

  return false;
}
