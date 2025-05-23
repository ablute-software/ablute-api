export interface ProfileSettings {
  automaticAnalysis: boolean;
  analysisFrequency: number; // days between analyses
  notifications: boolean;
  darkMode: boolean;
  language: string;
}

export interface Profile {
  id: string;
  name: string;
  birthDate: string;
  height: number;
  weight: number;
  profilePicture: string;
  sex: 'Male' | 'Female';
  lastExamDate: string | null;
  code?: string;
  bmi?: number;
  settings?: ProfileSettings;
  plan?: string; // Added for subscription plan support
}

export interface ProfileFormData {
  name: string;
  birthDate: string;
  height: number;
  weight: number;
  profilePicture: string;
  useImperial: boolean;
  code?: string; // For importing profiles
  sex: 'Male' | 'Female';
}

export interface News {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  timeAgo: string;
}

export interface Biomarker {
  id: string;
  name: string;
  description: string;
  normalRange: string;
  unit: string;
}

export interface AppItem {
  id: string;
  name: string;
  icon: string;
  available: boolean;
  installed?: boolean;
  route?: string;
  description: string;
  rating: number;
  downloads: string;
  category: string;
  price: string;
  features: string[];
  inAppPurchases: {
    type: string;
    price: string;
  }[];
}

export interface BiomarkerResult {
  value: number;
  reference: string;
  status: 'normal' | 'high' | 'low';
}

export interface Analysis {
  id: string;
  profileId: string;
  date: string;
  biomarkers: {
    creatinine: BiomarkerResult;
    glucose: BiomarkerResult;
    albumin: BiomarkerResult;
    nitrites: BiomarkerResult;
    ntProBNP: BiomarkerResult;
    ngal: BiomarkerResult;
    ohDG: BiomarkerResult;
    mcp1: BiomarkerResult;
  };
}

export type SubscriptionPlan = 'Essential' | 'Plus' | 'Total' | 'Pro';

export interface AccountCredits {
  currentCredits: number;
  lastResetDate: string;
  subscriptionPlan: SubscriptionPlan;
}

export const SUBSCRIPTION_CREDITS: Record<SubscriptionPlan, number> = {
  Essential: 100,
  Plus: 500,
  Total: 1000,
  Pro: 2000,
};

export const PLAN_CREDITS: Record<SubscriptionPlan, number> = {
  'Essential': 20,
  'Plus': 40,
  'Total': 160,
  'Pro': 1200
};

export const PLAN_PROFILE_LIMITS: Record<SubscriptionPlan, number> = {
  'Essential': 12,
  'Plus': 12,
  'Total': 12,
  'Pro': 500
};