import type { UnitAvailabilityStatus } from '../../../../server/src/types/database.js';

export type ChatbotRole = 'user' | 'assistant' | 'system';
export type ChatbotMode = 'discovery' | 'tenant_support' | 'maintenance' | 'financial' | 'general';

export interface PropertyRecommendationUnit {
  id: string;
  unitIdentifier: string;
  floorNumber: number;
  bedrooms: number;
  bathrooms: number;
  monthlyRent: number;
  securityDeposit: number;
  availabilityStatus: UnitAvailabilityStatus;
}

export interface PropertyRecommendationAmenity {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

export interface PropertyRecommendation {
  id: string;
  title: string;
  address: string;
  city: string;
  minMonthlyRent: number | null;
  maxMonthlyRent: number | null;
  coverPhotoUrl: string | null;
  availableUnitsCount: number;
  totalFloors: number;
  units?: PropertyRecommendationUnit[];
  amenities?: PropertyRecommendationAmenity[];
}

export interface MaintenanceDraft {
  category: string;
  urgency: 'Emergency' | 'High' | 'Normal' | 'Low';
  title: string;
  description: string;
  tenancyId?: string;
  propertyTitle?: string;
}

export interface MessageDraft {
  recipient: string;
  subject: string;
  body: string;
  legalNote?: string;
}

export interface ChatbotMessageMetadata {
  properties?: PropertyRecommendation[];
  maintenanceDraft?: MaintenanceDraft;
  messageDraft?: MessageDraft;
  suggestedPrompts?: string[];
  isEmergency?: boolean;
  noResults?: boolean;
  ticketCreated?: boolean;
  ticketId?: string;
  aiProvider?: string;
  [key: string]: any;
}

export interface ChatbotMessage {
  id: string;
  role: ChatbotRole;
  content: string;
  mode?: string | null;
  metadata: ChatbotMessageMetadata;
  createdAt: string;
}

export interface ChatbotConversation {
  id: string;
  userId: string | null;
  sessionId: string | null;
  title: string;
  currentMode: ChatbotMode;
  contextData: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  messages?: ChatbotMessage[];
}

