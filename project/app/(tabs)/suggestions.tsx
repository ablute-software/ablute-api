import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getLatestAnalysisForProfile } from '../../utils/excelParser';
import { loadProfiles } from '../../utils/profileStorage';
import { determineBiomarkerStatus } from '../../utils/biomarkerUtils';
import { generateMockReportSections } from '../../components/AnalysisReport';

export default function SuggestionsScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string>('');
  const params = useLocalSearchParams<{ profileId?: string }>();

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load profiles to get the current profile
        const profiles = await loadProfiles();
        const currentProfile = profiles.find(p => p.id === params.profileId) || profiles[0];

        if (!currentProfile?.code) {
          throw new Error('Profile code not available');
        }

        // Get the latest analysis
        const latestAnalysis = await getLatestAnalysisForProfile(currentProfile.code);
        
        if (!latestAnalysis) {
          throw new Error('No analysis data available');
        }

        // Transform the analysis data to match the expected format
        const transformedBiomarkers = Object.entries(latestAnalysis.biomarkers).reduce((acc, [key, biomarker]) => {
          acc[key] = {
            value: biomarker.value,
            reference: biomarker.referenceValue,
            status: determineBiomarkerStatus(biomarker.value, biomarker.referenceValue)
          };
          return acc;
        }, {} as any);

        const analysis = {
          id: `${currentProfile.id}_${latestAnalysis.date}`,
          profileId: currentProfile.id,
          date: latestAnalysis.date,
          biomarkers: transformedBiomarkers
        };

        // Generate recommendations using the same function as AnalysisReport
        const { recommendations: reportRecommendations } = generateMockReportSections(currentProfile, analysis);
        setRecommendations(reportRecommendations);

      } catch (err) {
        console.error('Error loading recommendations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [params.profileId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading recommendations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Suggestions</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.suggestionCard}>
          <Text style={styles.suggestionTitle}>Health Recommendations</Text>
          <Text style={styles.suggestionText}>
            Based on your recent analysis, here are your personalized recommendations:
          </Text>
          <Text style={styles.recommendationText}>{recommendations}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1C1C1E',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  suggestionCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  suggestionText: {
    fontSize: 16,
    color: '#E0E0E0',
    marginBottom: 16,
  },
  recommendationText: {
    fontSize: 15,
    color: '#E0E0E0',
    lineHeight: 22,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 