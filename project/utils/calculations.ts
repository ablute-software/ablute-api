export const calculateBMI = (weight: number, heightCm: number): number => {
  const heightM = heightCm / 100; // Convert cm to m
  return Number((weight / (heightM * heightM)).toFixed(2));
};

export const imperialToMetric = {
  height: (inches: number): number => Number((inches * 2.54).toFixed(1)), // to cm
  weight: (pounds: number): number => Number((pounds * 0.453592).toFixed(1)), // to kg
};

export const metricToImperial = {
  height: (cm: number): number => Number((cm * 0.393701).toFixed(1)), // cm to inches
  weight: (kg: number): number => Number((kg * 2.20462).toFixed(1)), // kg to pounds
};

export const calculateAge = (birthDate: string): number => {
  const [day, month, year] = birthDate.split('/').map(Number);
  const birth = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const isBirthday = (birthDate: string): boolean => {
  const [day, month] = birthDate.split('/').map(Number);
  const today = new Date();
  return today.getDate() === day && today.getMonth() + 1 === month;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '/');
};

export const calculateDaysSinceAnalysis = (lastExamDate: string): number => {
  if (!lastExamDate) return -1;
  const [day, month, year] = lastExamDate.split('/').map(Number);
  const lastExam = new Date(year, month - 1, day);
  const today = new Date();
  return Math.floor((today.getTime() - lastExam.getTime()) / (1000 * 60 * 60 * 24));
};

export const calculateMonitoringScore = (lastExamDate: string | null): number => {
  if (!lastExamDate) return 0;
  
  const DSA = calculateDaysSinceAnalysis(lastExamDate);
  
  let score: number;
  
  if (DSA <= 30) {
    score = 100 - (DSA / 30) * 10;
  } else if (DSA <= 90) {
    score = 90 - ((DSA - 30) / 60) * 40;
  } else {
    score = 50 - ((DSA - 90) / 275) * 50;
  }
  
  return Math.max(0, Math.min(100, Number(score.toFixed(2))));
};

export const getScoreCategory = (score: number): {
  category: string;
  color: string;
} => {
  if (score >= 90) return { category: 'Excellent', color: '#007AFF' }; // Blue
  if (score >= 70) return { category: 'Good', color: '#4CAF50' }; // Green
  if (score >= 50) return { category: 'Fair', color: '#FFC107' }; // Yellow
  if (score >= 30) return { category: 'Weak', color: '#FF9800' }; // Orange
  return { category: 'Critical', color: '#F44336' }; // Red
};

export const generateUniqueCode = (): string => {
  return 'ABL_' + Math.random().toString(36).substring(2, 8).toUpperCase();
};