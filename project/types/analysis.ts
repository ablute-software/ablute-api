export interface BiomarkerResult {
  value: number;
  referenceValue: string;
  interpretation: string;
}

export interface Analysis {
  profileCode: string;
  name: string;
  age: number;
  height: number;
  weight: number;
  bmi: number;
  sex: 'Male' | 'Female';
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

export interface ReferenceValues {
  creatinine: string;
  glucose: string;
  albumin: string;
  nitrites: string;
  ntProBNP: string;
  ngal: string;
  ohDG: string;
  mcp1: string;
}

export interface AnalysisTableRow {
  biomarker: string;
  result: number | string;
  referenceValue: string;
  interpretation: string;
}

export interface AnalysisSuggestion {
  nextAnalysisDate: string;
  reason?: string;
  urgency?: 'normal' | 'urgent';
} 