import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Analysis, AnalysisTableRow } from '../../types/analysis';
import { getAnalysesForProfile } from '../../utils/excelParser';
import { loadProfiles } from '../../utils/profileStorage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      const profiles = await loadProfiles();
      const foundProfile = profiles.find((p) => p.id === id);
      setProfile(foundProfile);
      if (foundProfile && foundProfile.code) {
        const allAnalyses = await getAnalysesForProfile(foundProfile.code);
        setAnalyses(allAnalyses);
      }
    };
    loadData();
  }, [id]);

  const renderTable = (analysis: Analysis) => {
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
      <View style={styles.resultsTable}>
        <View style={styles.tableRowHeader}>
          <Text style={[styles.tableHeaderCell, styles.leftHeader]}>Biomarker</Text>
          <Text style={styles.tableHeaderCell}>Result</Text>
          <Text style={styles.tableHeaderCell}>Reference Value</Text>
          <Text style={styles.tableHeaderCell}>Interpretation</Text>
        </View>
        {tableData.map((row, idx) => (
          <View
            key={idx}
            style={[styles.tableRow, idx === tableData.length - 1 && { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }]}
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
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <TouchableOpacity
        style={{ margin: 16, padding: 8, backgroundColor: '#222', borderRadius: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' }}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', alignSelf: 'center', marginBottom: 16 }}>Analysis History</Text>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {analyses.length === 0 && (
          <Text style={{ color: '#fff', textAlign: 'center', marginTop: 32 }}>No analyses found for this profile.</Text>
        )}
        {analyses.map((analysis, idx) => (
          <View key={idx} style={{ marginHorizontal: 10, marginBottom: 18 }}>
            <TouchableOpacity
              style={[styles.collapseHeader, expanded === idx && styles.collapseHeaderExpanded]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setExpanded(expanded === idx ? null : idx);
              }}
            >
              <Text style={styles.collapseHeaderText}>
                {analysis.date}
              </Text>
              <Text style={styles.collapseHeaderArrow}>{expanded === idx ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {expanded === idx && (
              <View style={{ marginTop: 8 }}>{renderTable(analysis)}</View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  resultsTable: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#222',
    marginBottom: 8,
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
  collapseHeader: {
    backgroundColor: '#181c3a',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapseHeaderExpanded: {
    backgroundColor: '#23275a',
  },
  collapseHeaderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  collapseHeaderArrow: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 12,
  },
}); 