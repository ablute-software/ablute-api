import { Analysis, ReferenceValues } from '../types/analysis';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Use different paths for web and mobile
const isWeb = Platform.OS === 'web';

// Constants for storage
const STORAGE_KEY = '@analyses_data';
const BASE_CSV_NAME = 'examdata.csv';

// Only import FileSystem for mobile platforms
let FileSystem: any;
if (!isWeb) {
  FileSystem = require('expo-file-system');
}

const CSV_FILE_PATH = isWeb 
  ? BASE_CSV_NAME  // For web, use a consistent filename
  : `${FileSystem.documentDirectory}${BASE_CSV_NAME}`;

// Initial data for web platform
const INITIAL_DATA = `Code,Name,Age,Height,Weight,BMI,Sex,Date,Creatinine (mg/dL),Glucose (mg/dL),Albumin (mg/g Cr),Nitrites (µmol/L),NT-proBNP (pg/mL),NGAL (ng/mL),8-OHdG (ng/mg Cr),MCP-1 (pg/mL)
REFERENCE,Reference Values,NA,NA,NA,NA,NA,NA,Adults: 80–150; Children: 20–100,< 15,<20 (Tolerated up to 30 in elderly),< 1.0,<100,<150,3.0 – 7.0 (adults); up to 8.0 (elderly),<200
ABL_X7Y9Z2,Sofia,34,170,60,20.76,Female,1/11/2024,141,8.1,1.9,0.46,61.6,126.7,6.63,141.8
ABL_X7Y9Z2,Sofia,34,170,60,20.76,Female,11/1/2025,143.5,7,3.8,0.03,72.6,45.1,5.81,69.6
ABL_X7Y9Z2,Sofia,34,170,60,20.76,Female,18/01/2025,91.2,4.5,9.9,0.26,78.9,62.2,5.06,148.7
ABL_X7Y9Z2,Sofia,34,170,60,20.76,Female,19/03/2025,141,8.1,1.9,0.46,61.6,126.7,6.63,141.8
ABL_X7Y9Z2,Sofia,34,170,60,20.76,Female,3/4/2025,91.2,4.5,9.9,0.26,78.9,62.2,5.06,148.7
ABL_K2M4N8,Paulo,37,175,80,26.12,Male,25/12/2024,116.5,7.6,14.2,0.32,27.5,104.8,6.47,131.9
ABL_K2M4N8,Paulo,37,175,80,26.12,Male,18/01/2025,87.4,5.4,11.1,0.41,63.1,51.8,5.18,79.4
ABL_K2M4N8,Paulo,37,175,80,26.12,Male,17/03/2025,104.5,5.1,5.2,0.59,28.9,75.7,6.78,75.1
ABL_P5Q7R9,Maria,11,150,40,17.78,Female,20/10/2024,65,5,8,0.4,50,85,5.2,110
ABL_P5Q7R9,Maria,11,150,40,17.78,Female,25/11/2024,65,5,8,0.4,50,85,5.2,110
ABL_P5Q7R9,Maria,11,150,40,17.78,Female,9/2/2025,65,5,8,0.4,50,85,5.2,110
ABL_P5Q7R9,Maria,11,150,40,17.78,Female,17/03/2025,65,5,8,0.4,50,85,5.2,110
ABL_S3T6U9,Conceição,75,168,65,23.03,Female,31/10/2024,95,7,15,0.3,80,110,5.7,130
ABL_S3T6U9,Conceição,75,168,65,23.03,Female,9/11/2024,180,12,65,18.5,290,370,6.2,450
ABL_S3T6U9,Conceição,75,168,65,23.03,Female,26/11/2024,95,7,15,0.3,80,110,5.7,130
ABL_S3T6U9,Conceição,75,168,65,23.03,Female,29/01/2025,95,7,15,0.3,80,110,5.7,130
ABL_S3T6U9,Conceição,75,168,65,23.03,Female,11/3/2025,95,7,15,0.3,80,110,5.7,130
ABL_S3T6U9,Conceição,75,168,65,23.03,Female,23/03/2025,95,7,15,0.3,80,110,5.7,130`;

console.log('Platform:', Platform.OS);
console.log('Using CSV file at:', CSV_FILE_PATH);

let referenceValues: ReferenceValues | null = null;
let analysisCache: Analysis[] | null = null;

const REFERENCE_VALUES = {
  creatinine: 'Adults: 80-150; Children: 20-100',
  glucose: '< 15',
  albumin: '< 30',
  nitrites: '< 1.0',
  ntProBNP: '< 100',
  ngal: '< 150',
  ohDG: '3.0-7.0',
  mcp1: '< 200'
};

// Helper function to convert array to CSV line
const arrayToCSV = (arr: any[]): string => {
  return arr.map(item => {
    if (item === null || item === undefined) return '';
    return typeof item === 'string' && item.includes(',') ? 
      `"${item}"` : 
      String(item);
  }).join(',');
};

// Helper function to parse CSV line
const parseCSVLine = (line: string): string[] => {
  const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
  const matches = line.match(regex);
  return matches ? matches.map(value => value.replace(/^"|"$/g, '')) : [];
};

// Modified writeCSVFile to handle both web and mobile platforms
async function writeCSVFile(rows: string[][]): Promise<void> {
  try {
    console.log('Starting writeCSVFile function');
    console.log('Platform:', Platform.OS);
    console.log('Number of rows to write:', rows.length);
    
    // Ensure the reference row is always correct
    if (rows.length > 1) {
      rows[1] = [
        'REFERENCE',
        'Reference Values',
        'NA', 'NA', 'NA', 'NA', 'NA', 'NA',
        REFERENCE_VALUES.creatinine,
        REFERENCE_VALUES.glucose,
        REFERENCE_VALUES.albumin,
        REFERENCE_VALUES.nitrites,
        REFERENCE_VALUES.ntProBNP,
        REFERENCE_VALUES.ngal,
        REFERENCE_VALUES.ohDG,
        REFERENCE_VALUES.mcp1
      ];
    }
    
    // Filter out any empty rows and ensure all rows have the correct number of columns
    const headerRow = rows[0] || [];
    const columnCount = headerRow.length;
    const cleanedRows = rows.filter(row => row.length > 0).map(row => {
      // Pad or trim the row to match header length
      if (row.length < columnCount) {
        return [...row, ...Array(columnCount - row.length).fill('')];
      }
      return row.slice(0, columnCount);
    });
    
    console.log('Cleaned rows count:', cleanedRows.length);
    
    const content = cleanedRows.map(row => arrayToCSV(row)).join('\n');
    console.log('Generated content length:', content.length);
    
    // Store the data in AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEY, content);
    console.log('Data saved to AsyncStorage');
    
    if (isWeb) {
      console.log('Web platform detected, using download method');
      try {
        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = BASE_CSV_NAME;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('File downloaded as:', BASE_CSV_NAME);
      } catch (webError) {
        console.error('Error in web file download:', webError);
        throw webError;
      }
    } else {
      console.log('Mobile platform detected, using FileSystem');
      try {
        // Ensure the directory exists
        const directory = FileSystem.documentDirectory;
        if (!directory) {
          throw new Error('Document directory not available');
        }
        
        // Write the file
        await FileSystem.writeAsStringAsync(CSV_FILE_PATH, content);
        console.log('File written successfully to:', CSV_FILE_PATH);
        
        // Verify the file exists and has content
        const fileInfo = await FileSystem.getInfoAsync(CSV_FILE_PATH);
        if (fileInfo.exists) {
          const writtenContent = await FileSystem.readAsStringAsync(CSV_FILE_PATH);
          console.log('Verification: File exists and has', writtenContent.split('\n').length, 'rows');
        }
      } catch (mobileError) {
        console.error('Error in mobile file write:', mobileError);
        throw mobileError;
      }
    }
  } catch (error) {
    console.error('Error in writeCSVFile:', error);
    throw error;
  }
}

async function copyInitialDataFile(): Promise<void> {
  if (isWeb) {
    console.log('Web platform detected, skipping file copy');
    return;
  }

  try {
    console.log('=== STARTING INITIAL DATA FILE COPY ===');
    const sourcePath = `${FileSystem.documentDirectory}../../data/examdata.csv`;
    const targetPath = CSV_FILE_PATH;
    
    console.log('Source path:', sourcePath);
    console.log('Target path:', targetPath);
    
    // Check if source file exists
    const sourceInfo = await FileSystem.getInfoAsync(sourcePath);
    console.log('Source file info:', sourceInfo);
    
    if (!sourceInfo.exists) {
      console.log('❌ Source file does not exist at:', sourcePath);
      Alert.alert('File Not Found', `Could not find initial data file at: ${sourcePath}`);
      return;
    }
    
    // Check if target file exists
    const targetInfo = await FileSystem.getInfoAsync(targetPath);
    console.log('Target file info:', targetInfo);
    
    if (targetInfo.exists) {
      console.log('✅ Target file already exists, skipping copy');
      return;
    }
    
    // Copy the file
    await FileSystem.copyAsync({
      from: sourcePath,
      to: targetPath
    });
    
    console.log('✅ Successfully copied initial data file');
    Alert.alert('Success', 'Initial data file copied successfully');
  } catch (error: any) {
    console.error('❌ Error copying initial data file:', error);
    Alert.alert('Error', `Failed to copy initial data file: ${error.message}`);
  }
}

// Modified readCSVFile to first try AsyncStorage, then fallback to file
async function readCSVFile(): Promise<string[][]> {
  try {
    console.log('=== STARTING CSV FILE READ ===');
    
    // First try to copy the initial data file if it doesn't exist
    if (!isWeb) {
      await copyInitialDataFile();
    }
    
    console.log('Checking AsyncStorage...');
    const storedData = await AsyncStorage.getItem(STORAGE_KEY);
    
    if (storedData) {
      console.log('✅ Found data in AsyncStorage');
      const rows = storedData.split('\n').map((line: string) => parseCSVLine(line));
      console.log('Parsed rows count from AsyncStorage:', rows.length);
      return rows;
    }
    
    console.log('No data in AsyncStorage, attempting to read from file');
    
    if (isWeb) {
      console.log('Web platform detected, using initial data');
      // Store the initial data in AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEY, INITIAL_DATA);
      console.log('✅ Initial data cached in AsyncStorage');
      
      // Parse and return the rows
      const rows = INITIAL_DATA.split('\n')
        .filter((line: string) => line.trim() !== '')
        .map((line: string) => parseCSVLine(line));
      
      console.log('Parsed rows count:', rows.length);
      if (rows.length > 0) {
        console.log('First row:', rows[0]);
        console.log('Second row:', rows[1]);
      }
      
      return rows;
    }
    
    // Try to read the current file (mobile only)
    try {
      console.log('Attempting to read file from:', CSV_FILE_PATH);
      const fileInfo = await FileSystem.getInfoAsync(CSV_FILE_PATH);
      console.log('File info:', fileInfo);
      
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(CSV_FILE_PATH);
        console.log('✅ Successfully read file');
        console.log('Content length:', content.length);
        console.log('First 100 characters:', content.substring(0, 100));
        
        // Parse the content into rows
        const rows = content.split('\n')
          .filter((line: string) => line.trim() !== '')
          .map((line: string) => parseCSVLine(line));
        
        console.log('Parsed rows count:', rows.length);
        if (rows.length > 0) {
          console.log('First row:', rows[0]);
          console.log('Second row:', rows[1]);
        }
        
        // Store the content in AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEY, content);
        console.log('✅ File content cached in AsyncStorage');
        
        return rows;
      } else {
        console.log('❌ File does not exist at path:', CSV_FILE_PATH);
        Alert.alert('File Not Found', `Could not find file at: ${CSV_FILE_PATH}`);
      }
    } catch (error: any) {
      console.error('❌ Error reading file:', error);
      Alert.alert('Error', `Failed to read file: ${error.message}`);
    }
    
    // If we can't read the file, start with a fresh dataset
    console.log('Starting with fresh dataset');
    return [
      ['Profile Code', 'Name', 'Age', 'Height', 'Weight', 'BMI', 'Sex', 'Date', 
       'Creatinine', 'Glucose', 'Albumin', 'Nitrites', 'NT-proBNP', 'NGAL', '8-OHdG', 'MCP-1'],
      ['REFERENCE', 'Reference Values', 'NA', 'NA', 'NA', 'NA', 'NA', 'NA',
        REFERENCE_VALUES.creatinine,
        REFERENCE_VALUES.glucose,
        REFERENCE_VALUES.albumin,
        REFERENCE_VALUES.nitrites,
        REFERENCE_VALUES.ntProBNP,
        REFERENCE_VALUES.ngal,
        REFERENCE_VALUES.ohDG,
        REFERENCE_VALUES.mcp1]
    ];
  } catch (error: any) {
    console.error('❌ Error reading data:', error);
    Alert.alert('Error', `Failed to read data: ${error.message}`);
    throw error;
  }
}

function parseReferenceValues(rows: string[][]): ReferenceValues {
  // Reference values are in the second row
  const referenceRow = rows[1] || [];
  return {
    creatinine: referenceRow[8] || '',
    glucose: referenceRow[9] || '',
    albumin: referenceRow[10] || '',
    nitrites: referenceRow[11] || '',
    ntProBNP: referenceRow[12] || '',
    ngal: referenceRow[13] || '',
    ohDG: referenceRow[14] || '',
    mcp1: referenceRow[15] || ''
  };
}

function parseAnalyses(rows: string[][]): Analysis[] {
  // Skip header and reference rows
  return rows.slice(2).map(row => ({
    profileCode: row[0] || '',
    name: row[1] || '',
    age: Number(row[2]) || 0,
    height: Number(row[3]) || 0,
    weight: Number(row[4]) || 0,
    bmi: Number(row[5]) || 0,
    sex: row[6] as 'Male' | 'Female',
    date: row[7] || '',
    biomarkers: {
      creatinine: {
        value: Number(row[8]) || 0,
        referenceValue: referenceValues?.creatinine || '',
        interpretation: interpretBiomarkerValue(Number(row[8]), referenceValues?.creatinine || '')
      },
      glucose: {
        value: Number(row[9]) || 0,
        referenceValue: referenceValues?.glucose || '',
        interpretation: interpretBiomarkerValue(Number(row[9]), referenceValues?.glucose || '')
      },
      albumin: {
        value: Number(row[10]) || 0,
        referenceValue: referenceValues?.albumin || '',
        interpretation: interpretBiomarkerValue(Number(row[10]), referenceValues?.albumin || '')
      },
      nitrites: {
        value: Number(row[11]) || 0,
        referenceValue: referenceValues?.nitrites || '',
        interpretation: interpretBiomarkerValue(Number(row[11]), referenceValues?.nitrites || '')
      },
      ntProBNP: {
        value: Number(row[12]) || 0,
        referenceValue: referenceValues?.ntProBNP || '',
        interpretation: interpretBiomarkerValue(Number(row[12]), referenceValues?.ntProBNP || '')
      },
      ngal: {
        value: Number(row[13]) || 0,
        referenceValue: referenceValues?.ngal || '',
        interpretation: interpretBiomarkerValue(Number(row[13]), referenceValues?.ngal || '')
      },
      ohDG: {
        value: Number(row[14]) || 0,
        referenceValue: referenceValues?.ohDG || '',
        interpretation: interpretBiomarkerValue(Number(row[14]), referenceValues?.ohDG || '')
      },
      mcp1: {
        value: Number(row[15]) || 0,
        referenceValue: referenceValues?.mcp1 || '',
        interpretation: interpretBiomarkerValue(Number(row[15]), referenceValues?.mcp1 || '')
      }
    }
  }));
}

function interpretBiomarkerValue(value: number, referenceValue: string): string {
  // TODO: Implement proper interpretation logic based on reference values
  return 'Within normal range'; // Placeholder
}

async function loadReferenceValues(): Promise<void> {
  try {
    const rows = await readCSVFile();
    referenceValues = parseReferenceValues(rows);
  } catch (error) {
    console.error('Error loading reference values:', error);
    throw error;
  }
}

export async function loadAnalyses(): Promise<Analysis[]> {
  if (analysisCache) return analysisCache;

  try {
    // Load reference values first
    if (!referenceValues) {
      await loadReferenceValues();
    }

    const rows = await readCSVFile();
    analysisCache = parseAnalyses(rows);
    return analysisCache;
  } catch (error) {
    console.error('Error loading analyses:', error);
    throw error;
  }
}

export async function getAnalysesForProfile(profileCode: string): Promise<Analysis[]> {
  const analyses = await loadAnalyses();
  return analyses.filter(analysis => analysis.profileCode === profileCode);
}

export async function getLatestAnalysisForProfile(profileCode: string): Promise<Analysis | null> {
  console.log('Getting latest analysis for profile code:', profileCode);
  const profileAnalyses = await getAnalysesForProfile(profileCode);
  console.log('Found analyses for profile:', profileAnalyses);
  if (profileAnalyses.length === 0) return null;

  // Sort by date descending and return the first one
  return profileAnalyses.sort((a, b) => {
    const dateA = new Date(a.date.split('/').reverse().join('-'));
    const dateB = new Date(b.date.split('/').reverse().join('-'));
    return dateB.getTime() - dateA.getTime();
  })[0];
}

export async function addAnalysis(analysis: Analysis): Promise<void> {
  try {
    console.log('Starting addAnalysis function');
    console.log('Analysis data:', JSON.stringify(analysis, null, 2));
    
    // Clear the cache so we reload from file
    analysisCache = null;
    
    // Read the current CSV file
    console.log('Reading existing CSV file...');
    let rows: string[][] = [];
    
    try {
      // Try to read existing data
      rows = await readCSVFile();
      console.log('Successfully read existing file, rows:', rows.length);
      
      // Verify we have the header row
      if (rows.length === 0) {
        console.log('Empty file, adding header row');
        rows.push(['Profile Code', 'Name', 'Age', 'Height', 'Weight', 'BMI', 'Sex', 'Date', 
                  'Creatinine', 'Glucose', 'Albumin', 'Nitrites', 'NT-proBNP', 'NGAL', '8-OHdG', 'MCP-1']);
      }
      
      // If we don't have a reference values row, add it
      if (rows.length === 1) {
        console.log('Adding reference values row');
        rows.push(['REFERENCE', 'Reference Values', 'NA', 'NA', 'NA', 'NA', 'NA', 'NA',
                  REFERENCE_VALUES.creatinine,
                  REFERENCE_VALUES.glucose,
                  REFERENCE_VALUES.albumin,
                  REFERENCE_VALUES.nitrites,
                  REFERENCE_VALUES.ntProBNP,
                  REFERENCE_VALUES.ngal,
                  REFERENCE_VALUES.ohDG,
                  REFERENCE_VALUES.mcp1]);
      }
    } catch (error) {
      console.log('Error reading existing file, starting fresh:', error);
      // If file doesn't exist or can't be read, start with header and reference rows
      rows = [
        ['Profile Code', 'Name', 'Age', 'Height', 'Weight', 'BMI', 'Sex', 'Date', 
         'Creatinine', 'Glucose', 'Albumin', 'Nitrites', 'NT-proBNP', 'NGAL', '8-OHdG', 'MCP-1'],
        ['REFERENCE', 'Reference Values', 'NA', 'NA', 'NA', 'NA', 'NA', 'NA',
         REFERENCE_VALUES.creatinine,
         REFERENCE_VALUES.glucose,
         REFERENCE_VALUES.albumin,
         REFERENCE_VALUES.nitrites,
         REFERENCE_VALUES.ntProBNP,
         REFERENCE_VALUES.ngal,
         REFERENCE_VALUES.ohDG,
         REFERENCE_VALUES.mcp1]
      ];
    }
    
    // Create new row with analysis data
    const newRow = [
      analysis.profileCode,
      analysis.name,
      String(analysis.age),
      String(analysis.height),
      String(analysis.weight),
      String(analysis.bmi),
      analysis.sex,
      analysis.date,
      String(analysis.biomarkers.creatinine.value),
      String(analysis.biomarkers.glucose.value),
      String(analysis.biomarkers.albumin.value),
      String(analysis.biomarkers.nitrites.value),
      String(analysis.biomarkers.ntProBNP.value),
      String(analysis.biomarkers.ngal.value),
      String(analysis.biomarkers.ohDG.value),
      String(analysis.biomarkers.mcp1.value)
    ];
    
    console.log('New row data:', newRow);
    
    // Add the new row
    rows.push(newRow);
    console.log('Total rows after adding new row:', rows.length);
    
    // Write the updated CSV file
    console.log('Writing updated CSV file...');
    await writeCSVFile(rows);
    console.log('Analysis added successfully');
  } catch (error) {
    console.error('Error in addAnalysis:', error);
    throw error;
  }
}

export function calculateNextAnalysisDate(lastAnalysis: Analysis): Date {
  // Check if any biomarker is outside normal range
  const hasAbnormalValues = Object.values(lastAnalysis.biomarkers).some(
    biomarker => !biomarker.interpretation.includes('Within normal range')
  );

  const lastAnalysisDate = new Date(lastAnalysis.date.split('/').reverse().join('-'));
  
  // If any abnormal values, suggest next analysis in 2 weeks
  // Otherwise, suggest next analysis in 1 month
  const daysToAdd = hasAbnormalValues ? 14 : 30;
  return new Date(lastAnalysisDate.setDate(lastAnalysisDate.getDate() + daysToAdd));
} 