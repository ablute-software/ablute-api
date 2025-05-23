import { Profile } from '../types/profile';
import { calculateBMI } from '../utils/calculations';

export const initialProfiles: Profile[] = [
  {
    id: '1',
    code: 'ABL_X7Y9Z2',
    name: 'Sofia',
    profilePicture: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    birthDate: '15/05/1990',
    height: 170,
    weight: 60,
    sex: 'Female',
    bmi: calculateBMI(60, 170),
    lastExamDate: '28/03/2025',
    settings: {
      automaticAnalysis: true,
      analysisFrequency: 7, // weekly
      notifications: true,
      darkMode: false,
      language: 'en'
    }
  },
  {
    id: '2',
    code: 'ABL_K2M4N8',
    name: 'Paulo',
    profilePicture: 'https://images.pexels.com/photos/713520/pexels-photo-713520.jpeg',
    birthDate: '22/08/1987',
    height: 175,
    weight: 80,
    sex: 'Male',
    bmi: calculateBMI(80, 175),
    lastExamDate: '15/01/2025',
    settings: {
      automaticAnalysis: true,
      analysisFrequency: 14, // every two weeks
      notifications: true,
      darkMode: false,
      language: 'en'
    }
  },
  {
    id: '3',
    code: 'ABL_P5Q7R9',
    name: 'Maria',
    profilePicture: 'https://images.pexels.com/photos/4762744/pexels-photo-4762744.jpeg',
    birthDate: '30/11/2013',
    height: 150,
    weight: 40,
    sex: 'Female',
    bmi: calculateBMI(40, 150),
    lastExamDate: '10/02/2025',
    settings: {
      automaticAnalysis: true,
      analysisFrequency: 30, // monthly
      notifications: true,
      darkMode: false,
      language: 'en'
    }
  },
  {
    id: '4',
    code: 'ABL_S3T6U9',
    name: 'Conceição',
    profilePicture: 'https://images.pexels.com/photos/4057693/pexels-photo-4057693.jpeg',
    birthDate: '05/03/1950',
    height: 168,
    weight: 65,
    sex: 'Female',
    bmi: calculateBMI(65, 168),
    lastExamDate: '31/03/2025',
    settings: {
      automaticAnalysis: true,
      analysisFrequency: 7, // weekly
      notifications: true,
      darkMode: false,
      language: 'en'
    }
  },
];

export const biomarkers = [
  {
    id: '1',
    name: 'Nitrites',
    description: 'Indicates bacterial infection, especially urinary tract infections (UTIs). If positive it can affect the values of other biomarkers and should be treated.',
    normalRange: '<1 µmol/L (normally absent)',
  },
  {
    id: '2',
    name: 'Creatinine',
    description: 'Indicates kidney function and and is used to normalize other urine biomarkers.',
    normalRange: '80-150 mg/dL',
    unit: 'mg/dL',
  },
  {
    id: '3',
    name: 'Glucose',
    description: 'Measures sugar levels',
    normalRange: '<15 mg/dL',
  },
    {
      id: '4',
      name: 'Albumin',
      description: 'Detects early kidney damage, especially in diabetes and hypertension.',
      normalRange: '<20 mg/g Cr',
    },
    {
      id: '5',
      name: 'NT-proBNP',
      description: 'Marker of heart failure; rarely present in urine, but elevated in cardiac stress or dysfunction.',
      normalRange: '< 100 pg/mL',
    },
    {
      id: '6',
      name: 'NGAL',
      description: 'Early biomarker of acute kidney injury and inflammation.',
      normalRange: '< 150 ng/mL',
    },
    {
      id: '7',
      name: '8-OHdG',
      description: 'Indicates oxidative DNA damage; used in aging and oxidative stress research.',
      normalRange: '3-7 mg/g Cr',
    },
    {
      id: '8',
      name: ' MCP-1',
      description: 'Inflammatory marker linked to kidney disease and cardiovascular risk.',
      normalRange: '< 200 pg/mL',
    }
  // Add more biomarkers as needed
];

export const apps = [
  {
    id: 'store',
    name: 'Store',
    icon: 'shopping-bag',
    available: true,
  },
  {
    id: 'nutrition',
    name: 'Nutrition',
    icon: 'apple',
    available: false,
  },
  {
    id: 'medication',
    name: 'Medication',
    icon: 'pill',
    available: false,
  },
  {
    id: 'recipes',
    name: 'Recipes',
    icon: 'chef-hat',
    available: false,
  },
  {
    id: 'fitness',
    name: 'Fitness',
    icon: 'medal',
    available: false,
  },
];