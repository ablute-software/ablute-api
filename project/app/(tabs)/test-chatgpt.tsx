import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Profile, Analysis, BiomarkerResult } from '../../types/profile';
import AnalysisReport from '../../components/AnalysisReport';
import { useLocalSearchParams, router } from 'expo-router';
import { loadProfiles } from '../../utils/profileStorage';
import { getLatestAnalysisForProfile } from '../../utils/excelParser';
import { ArrowLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// sampleAnalysis is not directly used for state if actual data is fetched or error occurs.
// It can be removed if not needed as a structural reference anywhere else.
// const sampleAnalysis: Analysis = { ... }; 

// Helper generateNewRandomAnalysis is NO LONGER THE PRIMARY SOURCE for this page if we want actual data.
// It can be removed or kept if there's a scenario to show purely random data still.
// For now, let's comment it out or prepare for its removal.
/*
const generateNewRandomAnalysis = (profileId: string): Analysis => { ... };
*/

// New helper function to determine status based on value and reference string
const determineBiomarkerStatus = (value: number | undefined | null, reference: string | undefined | null): 'normal' | 'high' | 'low' => {
  if (value === undefined || value === null || !reference) {
    return 'normal'; // Or handle as an error/unknown if preferred
  }

  const refString = reference.trim();

  // Case 1: Upper limit (e.g., "< 1.0", "<= 1.0")
  const upperLimitMatch = refString.match(/^<\s*(=)?\s*([\d.]+)/);
  if (upperLimitMatch) {
    const limit = parseFloat(upperLimitMatch[2]);
    const isEqualAllowed = !!upperLimitMatch[1];
    if (isEqualAllowed) {
      return value <= limit ? 'normal' : 'high';
    }
    return value < limit ? 'normal' : 'high';
  }

  // Case 2: Lower limit (e.g., "> 50", ">= 50")
  const lowerLimitMatch = refString.match(/^>\s*(=)?\s*([\d.]+)/);
  if (lowerLimitMatch) {
    const limit = parseFloat(lowerLimitMatch[2]);
    const isEqualAllowed = !!lowerLimitMatch[1];
    if (isEqualAllowed) {
      return value >= limit ? 'normal' : 'low'; // Value above lower limit is normal here
    }
    return value > limit ? 'normal' : 'low';
  }

  // Case 3: Range (e.g., "80-150", "3.0 - 7.0")
  const rangeMatch = refString.match(/^([\d.]+)\s*-\s*([\d.]+)/);
  if (rangeMatch) {
    const lowerBound = parseFloat(rangeMatch[1]);
    const upperBound = parseFloat(rangeMatch[2]);
    if (value < lowerBound) return 'low';
    if (value > upperBound) return 'high';
    return 'normal';
  }
  
  // Case 4: Exact value or unparseable - treat as normal or log warning
  // This part can be expanded if there are other known exact value formats like "Negative"
  if (refString.toLowerCase() === 'negative' && value === 0) return 'normal';
  if (refString.toLowerCase() === 'negative' && value !== 0) return 'high'; // Or abnormal

  console.warn(`Could not parse reference string: "${reference}" for value: ${value}. Defaulting to normal.`);
  return 'normal'; // Fallback for unparsed reference strings
};

export default function TestChatGPT() {
  const params = useLocalSearchParams<{ profileId?: string }>();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testAnalysis, setTestAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    const fetchProfileAndSetData = async () => {
      setIsLoading(true);
      setError(null);
      setTestAnalysis(null);

      if (!params.profileId) {
        setError("No profile ID provided.");
        setIsLoading(false);
        return;
      }

      try {
        const storedProfiles = await loadProfiles();
        const profileFromParams = storedProfiles.find(p => p.id === params.profileId);

        if (profileFromParams) {
          setSelectedProfile(profileFromParams);

          if (profileFromParams.code) {
            const rawAnalysisDataFromParser = await getLatestAnalysisForProfile(profileFromParams.code);

            if (rawAnalysisDataFromParser && rawAnalysisDataFromParser.biomarkers) {
              const transformedBiomarkers: { [key: string]: BiomarkerResult } = {};
              for (const key in rawAnalysisDataFromParser.biomarkers) {
                const rawBiomarker = (rawAnalysisDataFromParser.biomarkers as any)[key];
                if (rawBiomarker && typeof rawBiomarker.value !== 'undefined') {
                  const currentReference = rawBiomarker.referenceValue || 'N/A';
                  transformedBiomarkers[key] = {
                    value: rawBiomarker.value,
                    reference: currentReference,
                    status: determineBiomarkerStatus(rawBiomarker.value, currentReference),
                  };
                }
              }

              const analysisRecord: Analysis = {
                id: `${profileFromParams.id}_${rawAnalysisDataFromParser.date}`,
                profileId: profileFromParams.id,
                date: rawAnalysisDataFromParser.date,
                biomarkers: transformedBiomarkers as Analysis['biomarkers'],
              };
              setTestAnalysis(analysisRecord);
            } else {
              setError(`No analysis data found for ${profileFromParams.name}.`);
            }
          } else {
            setError("Profile code is missing, cannot fetch analysis.");
          }

          await AsyncStorage.setItem('@new_analysis_pending', 'false');
        } else {
          setError("Profile not found.");
        }
      } catch (err: any) {
        console.error("Error in fetchProfileAndSetData:", err);
        setError(`Failed to load data: ${err.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndSetData();
  }, [params.profileId]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Health Report</Text>
      </View>
      
      {isLoading && (
        <Text style={styles.messageText}>Loading report...</Text>
      )}

      {!isLoading && error && (
        <Text style={styles.messageText}>{error}</Text>
      )}

      {!isLoading && !error && selectedProfile && testAnalysis && (
        <View style={styles.section}>
          <AnalysisReport
            profile={selectedProfile}
            analysis={testAnalysis} 
            hideRecommendations={true} 
          />
        </View>
      )}
      
      {/* Message if profile is loaded but no analysis data was found (and no other error occurred) */}
      {!isLoading && !error && selectedProfile && !testAnalysis && (
         <Text style={styles.messageText}>No analysis records found for {selectedProfile.name}.</Text>
      )}

      {/* Fallback if profile itself wasn't loaded and no error was set (less likely with current logic) */}
      {!isLoading && !error && !selectedProfile && (
        <Text style={styles.messageText}>Profile could not be loaded.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 25 : 50, // Adjusted for status bar
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    // justifyContent: 'center', // Center title if back button is absolute or offset
  },
  backButton: {
    // position: 'absolute', // If absolute positioning is desired
    // left: 0,
    // top: 0, // Adjust top based on header height or padding
    marginRight: 10, // Space between button and title
    padding: 5, // Clickable area
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1, // Allow title to take remaining space for centering if back button is not absolute
    marginRight: 34, // Roughly backbutton width + its margin to keep title centered
  },
  section: {
    marginBottom: 20,
  },
  // sectionTitle: { // Not currently used in this version of the page
  //   fontSize: 18,
  //   fontWeight: 'bold',
  //   color: '#FFFFFF',
  //   marginBottom: 10,
  // },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
  },
}); 