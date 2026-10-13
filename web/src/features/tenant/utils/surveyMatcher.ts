import type { PropertyListing, TenantPreferences } from '@/types/tenant';

export interface SurveyCriterionResult {
  key: 'budget' | 'household' | 'housingType' | 'amenities' | 'location';
  label: string;
  passed: boolean;
  detail: string;
}

export interface SurveyMatchResult {
  isPerfectMatch: boolean;
  matchScore: number; // 0 to 100
  criteria: SurveyCriterionResult[];
}

/**
 * Normalizes string for fuzzy/synonym matching.
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ');
}

/**
 * Checks if a property matches a given survey amenity.
 */
function propertyHasAmenity(property: PropertyListing, amenityId: string): boolean {
  const propertyText = normalize(
    `${property.title} ${property.description} ${property.amenities.map((a) => `${a.name} ${a.slug}`).join(' ')} ${property.units.flatMap((u) => u.amenities.map((a) => `${a.name} ${a.slug}`)).join(' ')}`
  );

  switch (amenityId) {
    case 'water':
      return (
        propertyText.includes('water') ||
        propertyText.includes('boring') ||
        propertyText.includes('tanker') ||
        propertyText.includes('filter')
      );
    case 'parking':
      return (
        propertyText.includes('parking') ||
        propertyText.includes('garage') ||
        propertyText.includes('bike') ||
        propertyText.includes('car')
      );
    case 'wifi':
      return (
        propertyText.includes('wifi') ||
        propertyText.includes('wi fi') ||
        propertyText.includes('internet') ||
        propertyText.includes('fiber')
      );
    case 'backup':
      return (
        propertyText.includes('backup') ||
        propertyText.includes('power') ||
        propertyText.includes('solar') ||
        propertyText.includes('inverter') ||
        propertyText.includes('generator')
      );
    case 'pet':
      return (
        propertyText.includes('pet') ||
        propertyText.includes('pets') ||
        propertyText.includes('dog') ||
        propertyText.includes('cat')
      );
    case 'balcony':
      return (
        propertyText.includes('balcony') ||
        propertyText.includes('terrace') ||
        propertyText.includes('rooftop') ||
        propertyText.includes('roof')
      );
    default:
      return propertyText.includes(normalize(amenityId));
  }
}

/**
 * Evaluates whether a PropertyListing fulfills every requirement of the tenant's survey questionnaire.
 */
export function evaluateSurveyMatch(
  property: PropertyListing,
  prefs: TenantPreferences | null
): SurveyMatchResult {
  if (!prefs) {
    return {
      isPerfectMatch: false,
      matchScore: 0,
      criteria: [],
    };
  }

  const criteria: SurveyCriterionResult[] = [];

  // 1. Budget Bracket
  let budgetPassed = false;
  let budgetDetail = '';
  const minRent = property.minMonthlyRent;
  const maxRent = property.maxMonthlyRent;

  switch (prefs.budgetBracket) {
    case 'economy': // Under NPR 15,000 / mo
      budgetPassed = minRent <= 15000;
      budgetDetail = `Target: Under NPR 15k/mo (Listing starts at NPR ${minRent.toLocaleString()})`;
      break;
    case 'standard': // NPR 15,000 – 30,000 / mo
      budgetPassed = minRent <= 30000 && maxRent >= 12000;
      budgetDetail = `Target: NPR 15k–30k/mo (Listing rent NPR ${minRent.toLocaleString()}–${maxRent.toLocaleString()})`;
      break;
    case 'mid': // NPR 30,000 – 50,000 / mo
      budgetPassed = minRent <= 55000 && maxRent >= 25000;
      budgetDetail = `Target: NPR 30k–50k/mo (Listing rent NPR ${minRent.toLocaleString()}–${maxRent.toLocaleString()})`;
      break;
    case 'premium': // NPR 50,000+ / mo
      budgetPassed = maxRent >= 45000;
      budgetDetail = `Target: NPR 50k+/mo (Listing rent NPR ${minRent.toLocaleString()}–${maxRent.toLocaleString()})`;
      break;
    default:
      budgetPassed = true;
      budgetDetail = `Budget fits preferences`;
  }
  criteria.push({
    key: 'budget',
    label: 'Budget Bracket',
    passed: budgetPassed,
    detail: budgetDetail,
  });

  // 2. Household Composition / Bedrooms
  let householdPassed = false;
  let householdDetail = '';
  const bedroomCounts = property.units.map((u) => u.bedrooms);
  const minBhk = Math.min(...bedroomCounts);
  const maxBhk = Math.max(...bedroomCounts);

  switch (prefs.householdSize) {
    case 'solo': // Individual -> 1 BHK / studio
      householdPassed = minBhk <= 2;
      householdDetail = `Target: Solo (Ideal 1–2 BHK, property offers ${minBhk}–${maxBhk} BHK)`;
      break;
    case 'couple': // 2 persons -> 1 or 2 BHK
      householdPassed = bedroomCounts.some((b) => b >= 1 && b <= 3);
      householdDetail = `Target: Couple (Ideal 1–2 BHK, property offers ${minBhk}–${maxBhk} BHK)`;
      break;
    case 'family': // Family -> 2+ BHK
      householdPassed = maxBhk >= 2;
      householdDetail = `Target: Family (Requires 2+ BHK, property offers up to ${maxBhk} BHK)`;
      break;
    case 'roommates': // Roommates -> 2+ BHK
      householdPassed = maxBhk >= 2;
      householdDetail = `Target: Roommates (Requires 2+ BHK, property offers up to ${maxBhk} BHK)`;
      break;
    default:
      householdPassed = true;
      householdDetail = `Layout accommodates household`;
  }
  criteria.push({
    key: 'household',
    label: 'Household Size',
    passed: householdPassed,
    detail: householdDetail,
  });

  // 3. Housing Type
  let typePassed = false;
  let typeDetail = '';
  const text = normalize(`${property.title} ${property.description}`);

  switch (prefs.housingType) {
    case 'apartment':
      typePassed = text.includes('apartment') || text.includes('flat') || property.totalFloors > 1;
      typeDetail = `Target: Apartment / Flat (${typePassed ? 'Verified flat/apartment' : 'Building layout'})`;
      break;
    case 'independent_house':
      typePassed = text.includes('house') || text.includes('floor') || text.includes('bungalow') || text.includes('home');
      typeDetail = `Target: Independent Floor / House`;
      break;
    case 'studio':
      typePassed = bedroomCounts.some((b) => b <= 1) || text.includes('studio') || text.includes('1bhk');
      typeDetail = `Target: Studio / 1 BHK Unit`;
      break;
    case 'shared':
      typePassed = text.includes('shared') || text.includes('room') || text.includes('co-living') || bedroomCounts.some((b) => b >= 1);
      typeDetail = `Target: Co-Living / Shared Space`;
      break;
    default:
      typePassed = true;
      typeDetail = `Housing style matches`;
  }
  criteria.push({
    key: 'housingType',
    label: 'Home Type',
    passed: typePassed,
    detail: typeDetail,
  });

  // 4. Priority Amenities
  let amenitiesPassed = true;
  const missingAmenities: string[] = [];

  for (const amenityId of prefs.priorityAmenities || []) {
    if (!propertyHasAmenity(property, amenityId)) {
      amenitiesPassed = false;
      missingAmenities.push(amenityId);
    }
  }

  criteria.push({
    key: 'amenities',
    label: 'Priority Amenities',
    passed: amenitiesPassed,
    detail: amenitiesPassed
      ? `All ${prefs.priorityAmenities.length} priority amenities fulfilled`
      : `Missing: ${missingAmenities.join(', ')}`,
  });

  // 5. Preferred Location / City (if set)
  let locationPassed = true;
  let locationDetail = 'Within valley search area';
  if (prefs.preferredCity && prefs.preferredCity !== 'All') {
    const pCity = normalize(property.city);
    const prefCity = normalize(prefs.preferredCity);
    locationPassed = pCity.includes(prefCity) || prefCity.includes(pCity);
    locationDetail = `Target: ${prefs.preferredCity} (Property in ${property.city})`;
  }
  criteria.push({
    key: 'location',
    label: 'Location / City',
    passed: locationPassed,
    detail: locationDetail,
  });

  const passedCount = criteria.filter((c) => c.passed).length;
  const matchScore = Math.round((passedCount / criteria.length) * 100);
  const isPerfectMatch = criteria.every((c) => c.passed);

  return {
    isPerfectMatch,
    matchScore,
    criteria,
  };
}
