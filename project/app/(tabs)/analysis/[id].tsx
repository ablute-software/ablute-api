import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { History, Calendar, ArrowLeft } from 'lucide-react-native';
import { Analysis, AnalysisTableRow } from '../../../types/analysis';
import { getLatestAnalysisForProfile, calculateNextAnalysisDate } from '../../../utils/excelParser';
import { loadProfiles } from '../../../utils/profileStorage';

export default function AnalysisScreen() {
  // Get the ID from the URL parameters
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;
  console.log('Received profile ID from params:', id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [nextAnalysisDate, setNextAnalysisDate] = useState<Date | null>(null);

  useEffect(() => {
    console.log('useEffect triggered with profile ID:', id);
    const loadAnalysis = async () => {
      try {
        console.log('Starting to load analysis for profile ID:', id);
        if (!id) {
          console.log('No profile ID provided');
          throw new Error('No profile ID provided');
        }

        // Get the profile code from the profile ID
        const profiles = await loadProfiles();
        console.log('Loaded profiles:', profiles);
        const profile = profiles.find(p => p.id === id);
        console.log('Found profile:', profile);
        
        if (!profile) {
          console.log('Profile not found for ID:', id);
          throw new Error('Profile not found');
        }

        if (!profile.code) {
          console.log('Profile code is missing for profile:', profile);
          throw new Error('Profile code is missing');
        }

        // Load the latest analysis for this profile
        console.log('Loading analysis for profile code:', profile.code);
        const latestAnalysis = await getLatestAnalysisForProfile(profile.code);
        console.log('Latest analysis:', latestAnalysis);
        
        if (!latestAnalysis) {
          console.log('No analysis found for profile code:', profile.code);
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

    loadAnalysis();
  }, [id]);

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
      <TouchableOpacity
        style={styles.backButtonCustom}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color="#fff" />
      </TouchableOpacity>

      {nextAnalysisDate && (
        <View style={styles.suggestionPill}>
          <Text style={styles.suggestionPillText}>
            Repeat the analysis in {nextAnalysisDate.toLocaleDateString()}
          </Text>
        </View>
      )}

      {/* History button */}
      <View style={{ width: '95%', alignItems: 'flex-end', marginBottom: 8 }}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/history/${id}`)}
        >
          <History size={24} color="#007AFF" />
          <Text style={styles.actionButtonText}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={styles.resultsTable}>
          {/* Table Header */}
          <View style={styles.tableRowHeader}>
            <Text style={[styles.tableHeaderCell, styles.leftHeader]}>Biomarker</Text>
            <Text style={styles.tableHeaderCell}>Result</Text>
            <Text style={styles.tableHeaderCell}>Reference Value</Text>
            <Text style={styles.tableHeaderCell}>Interpretation</Text>
          </View>

          {/* Table Data */}
          {tableData.map((row, index) => (
            <View
              key={index}
              style={[styles.tableRow, index === tableData.length - 1 && { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }]}
            >
              <View style={styles.leftCell}>
                <Text style={styles.leftCellText}>{row.biomarker}</Text>
              </View>
              <View style={styles.dataCell}><Text style={styles.resultText}>{row.result}</Text></View>
              <View style={styles.dataCell}><Text style={styles.dataText}>{row.referenceValue}</Text></View>
              <View style={styles.dataCell}><Text style={styles.dataText}>{row.interpretation}</Text></View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backButtonCustom: {
    margin: 16,
    padding: 8,
    backgroundColor: '#222',
    borderRadius: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionPill: {
    alignSelf: 'center',
    backgroundColor: '#f759f2',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginBottom: 24,
    marginTop: 8,
  },
  suggestionPillText: {
    color: '#1a1a1a',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
  },
  resultsTable: {
    width: '95%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#222',
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#181c3a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  tableHeaderCell: {
    flex: 1,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    paddingVertical: 14,
    textAlign: 'center',
    backgroundColor: '#181c3a',
    borderRightWidth: 1,
    borderRightColor: '#222',
  },
  leftHeader: {
    flex: 1.2,
    borderTopLeftRadius: 16,
    textAlign: 'left',
    paddingLeft: 16,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#f9eaea',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d1d1',
  },
  leftCell: {
    flex: 1.2,
    backgroundColor: '#181c3a',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingLeft: 16,
    borderRightWidth: 1,
    borderRightColor: '#222',
  },
  leftCellText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dataCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    backgroundColor: '#f9eaea',
  },
  dataText: {
    color: '#181c3a',
    fontSize: 15,
    textAlign: 'center',
  },
  resultText: {
    color: '#181c3a',
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFFFFF',
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
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  scrollContent: {
    paddingBottom: 0,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  date: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  profileInfo: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  profileMetrics: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  suggestionCard: {
    backgroundColor: '#1a1a1a',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  suggestionText: {
    fontSize: 16,
    color: '#CCCCCC',
  },
}); 