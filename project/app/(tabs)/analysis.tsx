import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, useSegments } from 'expo-router';
import { History, Calendar } from 'lucide-react-native';
import { Analysis, AnalysisTableRow } from '../../types/analysis';
import { getLatestAnalysisForProfile, calculateNextAnalysisDate } from '../../utils/excelParser';
import { loadProfiles } from '../../utils/profileStorage';

export default function AnalysisScreen() {
  const params = useLocalSearchParams();
  console.log('Received params:', params);
  const segments = useSegments();
  console.log('URL segments:', segments);
  const profileId = segments[segments.length - 1];
  console.log('Extracted profileId from segments:', profileId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [nextAnalysisDate, setNextAnalysisDate] = useState<Date | null>(null);

  useEffect(() => {
    console.log('useEffect triggered with profileId:', profileId);
    const loadAnalysis = async () => {
      try {
        console.log('Starting to load analysis for profileId:', profileId);
        if (!profileId) {
          console.log('No profileId provided');
          throw new Error('No profile ID provided');
        }

        // Get the profile code from the profile ID
        const profiles = await loadProfiles();
        console.log('Loaded profiles:', profiles);
        const profile = profiles.find(p => p.id === profileId);
        console.log('Found profile:', profile);
        
        if (!profile || !profile.code) {
          console.log('Profile not found or invalid profile code');
          throw new Error('Profile not found or invalid profile code');
        }

        // Load the latest analysis for this profile
        console.log('Loading analysis for profile code:', profile.code);
        const latestAnalysis = await getLatestAnalysisForProfile(profile.code);
        console.log('Latest analysis:', latestAnalysis);
        
        if (!latestAnalysis) {
          console.log('No analysis found for this profile');
          throw new Error('No analysis found for this profile');
        }

        setAnalysis(latestAnalysis);
        setNextAnalysisDate(calculateNextAnalysisDate(latestAnalysis));
      } catch (err) {
        console.error('Error in loadAnalysis:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analysis');
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    if (profileId) {
      loadAnalysis();
    } else {
      console.log('No profileId available, setting loading to false');
      setLoading(false);
    }
  }, [profileId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading analysis data...</Text>
      </View>
    );
  }

  if (error || !analysis) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error || 'No analysis data available'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tableData: AnalysisTableRow[] = [
    {
      biomarker: 'Creatinine (mg/dL)',
      result: analysis.biomarkers.creatinine.value,
      referenceValue: analysis.biomarkers.creatinine.referenceValue,
      interpretation: analysis.biomarkers.creatinine.interpretation
    },
    {
      biomarker: 'Glucose (mg/dL)',
      result: analysis.biomarkers.glucose.value,
      referenceValue: analysis.biomarkers.glucose.referenceValue,
      interpretation: analysis.biomarkers.glucose.interpretation
    },
    {
      biomarker: 'Albumin (mg/g Cr)',
      result: analysis.biomarkers.albumin.value,
      referenceValue: analysis.biomarkers.albumin.referenceValue,
      interpretation: analysis.biomarkers.albumin.interpretation
    },
    {
      biomarker: 'Nitrites (µmol/L)',
      result: analysis.biomarkers.nitrites.value,
      referenceValue: analysis.biomarkers.nitrites.referenceValue,
      interpretation: analysis.biomarkers.nitrites.interpretation
    },
    {
      biomarker: 'NT-proBNP (pg/mL)',
      result: analysis.biomarkers.ntProBNP.value,
      referenceValue: analysis.biomarkers.ntProBNP.referenceValue,
      interpretation: analysis.biomarkers.ntProBNP.interpretation
    },
    {
      biomarker: 'NGAL (ng/mL)',
      result: analysis.biomarkers.ngal.value,
      referenceValue: analysis.biomarkers.ngal.referenceValue,
      interpretation: analysis.biomarkers.ngal.interpretation
    },
    {
      biomarker: '8-OHdG (ng/mg Cr)',
      result: analysis.biomarkers.ohDG.value,
      referenceValue: analysis.biomarkers.ohDG.referenceValue,
      interpretation: analysis.biomarkers.ohDG.interpretation
    },
    {
      biomarker: 'MCP-1 (pg/mL)',
      result: analysis.biomarkers.mcp1.value,
      referenceValue: analysis.biomarkers.mcp1.referenceValue,
      interpretation: analysis.biomarkers.mcp1.interpretation
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analysis Results</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/history/${profileId}`)}>
            <History size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.date}>Analysis Date: {analysis.date}</Text>
          <Text style={styles.profileInfo}>
            {analysis.name} • {analysis.age} years • {analysis.sex}
          </Text>
          <Text style={styles.profileMetrics}>
            Height: {analysis.height}cm • Weight: {analysis.weight}kg • BMI: {analysis.bmi.toFixed(1)}
          </Text>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.columnHeader, { flex: 2 }]}>Biomarker</Text>
            <Text style={[styles.columnHeader, { flex: 1 }]}>Result</Text>
            <Text style={[styles.columnHeader, { flex: 2 }]}>Reference Value</Text>
            <Text style={[styles.columnHeader, { flex: 3 }]}>Interpretation</Text>
          </View>

          {tableData.map((row, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
              <Text style={[styles.cell, { flex: 2 }]}>{row.biomarker}</Text>
              <Text style={[styles.cell, { flex: 1 }]}>{row.result}</Text>
              <Text style={[styles.cell, { flex: 2 }]}>{row.referenceValue}</Text>
              <Text style={[styles.cell, { flex: 3 }]}>{row.interpretation}</Text>
            </View>
          ))}
        </View>

        {nextAnalysisDate && (
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <Calendar size={24} color="#007AFF" />
              <Text style={styles.suggestionTitle}>Next Analysis</Text>
            </View>
            <Text style={styles.suggestionText}>
              Repeat the analysis in {nextAnalysisDate.toLocaleDateString()}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A259F7',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  actionButtonText: {
    marginLeft: 5,
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  date: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  profileInfo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  profileMetrics: {
    fontSize: 16,
    color: '#666',
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  columnHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  evenRow: {
    backgroundColor: '#FFFFFF',
  },
  oddRow: {
    backgroundColor: '#F8F8F8',
  },
  cell: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  suggestionText: {
    fontSize: 16,
    color: '#666',
  },
}); 