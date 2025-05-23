import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Profile, Analysis, BiomarkerResult } from '../types/profile';

// Simplified mock report generator for non-biomarker sections
export const generateMockReportSections = (profile: Profile, analysis: Analysis): { overallAssessment: string, recommendations: string, areasOfNote: string } => {
  let areasOfNote: string[] = [];
  let overallAssessmentNotes: { name: string; status: string }[] = [];
  let personalizedRecommendations: string[] = [];

  for (const [key, biomarker] of Object.entries(analysis.biomarkers)) {
    if (biomarker.status !== 'normal') {
      const biomarkerName = Object.keys(analysis.biomarkers).find(k => analysis.biomarkers[k as keyof typeof analysis.biomarkers] === biomarker) || key;
      areasOfNote.push(`• ${biomarkerName.charAt(0).toUpperCase() + biomarkerName.slice(1)}: ${biomarker.value} (Ref: ${biomarker.reference}), Status: ${biomarker.status}.`);
      overallAssessmentNotes.push({
        name: biomarkerName.charAt(0).toUpperCase() + biomarkerName.slice(1),
        status: biomarker.status
      });

      // Add personalized recommendations based on biomarker status
      switch (key) {
        case 'creatinine':
          if (biomarker.status === 'high') {
            personalizedRecommendations.push('• Consider reducing protein intake and staying well hydrated');
          } else if (biomarker.status === 'low') {
            personalizedRecommendations.push('• Consider increasing protein intake and maintaining muscle mass');
          }
          break;
        case 'glucose':
          if (biomarker.status === 'high') {
            personalizedRecommendations.push('• Monitor carbohydrate intake and maintain regular exercise');
          } else if (biomarker.status === 'low') {
            personalizedRecommendations.push('• Consider having regular meals and monitoring blood sugar levels');
          }
          break;
        case 'albumin':
          if (biomarker.status === 'high') {
            personalizedRecommendations.push('• Consider consulting with a healthcare provider about kidney function');
          } else if (biomarker.status === 'low') {
            personalizedRecommendations.push('• Consider increasing protein intake and consulting with a healthcare provider');
          }
          break;
        case 'nitrites':
          if (biomarker.status === 'high') {
            personalizedRecommendations.push('• Consider consulting with a healthcare provider about urinary tract health');
          }
          break;
        case 'ntProBNP':
          if (biomarker.status === 'high') {
            personalizedRecommendations.push('• Monitor fluid intake and consider reducing sodium consumption');
          } else if (biomarker.status === 'low') {
            personalizedRecommendations.push('• Continue monitoring heart health and maintain regular check-ups');
          }
          break;
        case 'ohDG':
          if (biomarker.status === 'high') {
            personalizedRecommendations.push('• Increase antioxidant-rich foods in your diet');
          } else if (biomarker.status === 'low') {
            personalizedRecommendations.push('• Continue maintaining a diet rich in antioxidants');
          }
          break;
        case 'mcp1':
          if (biomarker.status === 'high') {
            personalizedRecommendations.push('• Consider anti-inflammatory dietary changes');
          } else if (biomarker.status === 'low') {
            personalizedRecommendations.push('• Continue maintaining an anti-inflammatory diet');
          }
          break;
        case 'ngal':
          if (biomarker.status === 'high') {
            personalizedRecommendations.push('• Stay well hydrated and monitor kidney function');
          } else if (biomarker.status === 'low') {
            personalizedRecommendations.push('• Continue monitoring kidney health and stay hydrated');
          }
          break;
      }
    }
  }

  if (areasOfNote.length === 0) {
    areasOfNote.push("• All biomarkers are within expected ranges.");
  }
  
  let overallAssessmentText = `Based on the recent analysis, your health indicators show the following: `;
  if (overallAssessmentNotes.length > 0) {
    overallAssessmentText += `Attention may be warranted for: `;
    const biomarkerTexts = overallAssessmentNotes.map((note, index) => {
      return ` ${note.name} (${note.status}`;
    });
    overallAssessmentText += biomarkerTexts.join(', ');
    overallAssessmentText += '.';
  } else {
    overallAssessmentText += "All key biomarkers appear to be within normal ranges.";
  }
  overallAssessmentText += " Please review the detailed biomarker analysis below.";

  // Combine personalized recommendations with general recommendations
  const generalRecommendations = [
    '• Maintain a balanced diet rich in fruits and vegetables',
    '• Stay hydrated',
    '• Engage in regular physical activity for at least 30 minutes',
    '• Get adequate sleep (7-9 hours per night)'
  ];

  const allRecommendations = [
    ...personalizedRecommendations,
    ...generalRecommendations
  ];

  const recommendationsText = allRecommendations.join('\n');

  const areasOfNoteText = areasOfNote.join('\n');

  return {
    overallAssessment: overallAssessmentText,
    recommendations: recommendationsText,
    areasOfNote: areasOfNoteText,
  };
};

interface AnalysisReportProps {
  profile: Profile;
  analysis: Analysis;
  hideRecommendations?: boolean;
}

// Helper to map status to its specific style
const getStatusTextStyle = (status: 'normal' | 'high' | 'low') => {
  if (status === 'high') return styles.statusHigh;
  if (status === 'low') return styles.statusLow;
  return styles.statusNormal;
};

export default function AnalysisReport({ profile, analysis, hideRecommendations }: AnalysisReportProps) {
  // No longer a single report string, but individual sections
  const [reportSections, setReportSections] = useState<{ overallAssessment: string, recommendations: string, areasOfNote: string } | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processReportData = async () => {
      if (!profile || !analysis) {
        setError("Profile or analysis data is missing.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        // Simulate processing if needed, or directly use data
        await new Promise(resolve => setTimeout(resolve, 500)); // Shorter delay for processing
        
        const sections = generateMockReportSections(profile, analysis);
        setReportSections(sections);

      } catch (err) {
        console.error('Error processing report sections:', err);
        setError('Failed to process report data');
      } finally {
        setLoading(false);
      }
    };

    processReportData();
  }, [profile, analysis]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Generating health report...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!reportSections || !analysis) { // Added !analysis check
    return (
        <View style={styles.container}>
         <Text style={styles.errorText}>Report data is not available.</Text>
       </View>
    );
  }
  
  // Helper to capitalize biomarker keys for display
  const getBiomarkerName = (key: string) => {
    if (key === 'ntProBNP') return 'NT-proBNP';
    if (key === 'ohDG') return '8-OHdG';
    if (key === 'mcp1') return 'MCP-1';
    return key.charAt(0).toUpperCase() + key.slice(1);
  };


  return (
    <ScrollView style={styles.container}>
      <View style={styles.reportSection}>
        <Text style={styles.sectionTitle}>Overall Assessment</Text>
        <Text style={styles.reportText}>
          {reportSections.overallAssessment.split('Attention may be warranted for:').map((part, index) => {
            if (index === 0) {
              return <Text key={index}>{part}</Text>;
            }
            const [attentionText, rest] = part.split('.');
            return (
              <Text key={index}>
                <Text style={styles.attentionText}>Attention may be warranted for: </Text>
                {attentionText.split(',').map((note, noteIndex) => {
                  const [biomarker, status] = note.trim().split(' (');
                  return (
                    <Text key={noteIndex}>
                      <Text style={styles.biomarkerText}>{biomarker}</Text>
                      <Text style={styles.statusText}> ({status})</Text>
                      {noteIndex < attentionText.split(',').length - 1 ? ', ' : ''}
                    </Text>
                  );
                })}
                {rest}
              </Text>
            );
          })}
        </Text>
      </View>

      <View style={styles.reportSection}>
        <Text style={styles.sectionTitle}>Biomarker Analysis</Text>
        {Object.entries(analysis.biomarkers).map(([key, biomarker]) => {
          const isAbnormal = biomarker.status === 'high' || biomarker.status === 'low';
          return (
            <View 
              key={key} 
              style={[
                styles.biomarkerEntry, 
                isAbnormal && styles.abnormalBiomarkerBox
              ]}
            >
              <Text style={styles.biomarkerName}>{getBiomarkerName(key)}:</Text>
              <Text style={styles.biomarkerValue}>  Value: {biomarker.value} (Ref: {biomarker.reference})</Text>
              <Text style={[styles.biomarkerStatus, getStatusTextStyle(biomarker.status)]}>
                Status: {biomarker.status}
              </Text>
            </View>
          );
        })}
      </View>

      {!hideRecommendations && (
      <View style={styles.reportSection}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        <Text style={styles.reportText}>{reportSections.recommendations}</Text>
      </View>
      )}
      
      <View style={styles.reportSection}>
        <Text style={styles.sectionTitle}>Areas of Note</Text>
        <Text style={styles.reportText}>{reportSections.areasOfNote}</Text>
      </View>
      <Text style={styles.disclaimerText}>
        This is a mock report for demonstration purposes. In a production environment, this would be generated by AI based on your actual health data.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Kept original background
    padding: 10, // Added some padding to container
  },
  loadingContainer: { // For centering loading indicator
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  reportSection: { // Style for each major section
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#1C1C1E', // Slightly different background for sections
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 20, // Increased title size
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  reportText: {
    fontSize: 15, // Adjusted text size
    color: '#E0E0E0', // Slightly lighter text color
    lineHeight: 22,
  },
  biomarkerEntry: {
    paddingVertical: 8,
    paddingHorizontal: 10, // Add some horizontal padding
    marginBottom: 8, // Space between entries
    borderRadius: 6, // Rounded corners for entries
    backgroundColor: '#2C2C2E', // Background for normal entries
  },
  abnormalBiomarkerBox: {
    borderColor: '#ff3c5f',
    borderWidth: 1,
    backgroundColor: 'rgba(255, 60, 95, 0.1)', // Slight transparent red background
  },
  biomarkerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  biomarkerValue: {
    fontSize: 15,
    color: '#E0E0E0',
    marginTop: 2,
  },
  biomarkerStatus: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  statusNormal: { color: '#4CAF50' /* Green */ },
  statusHigh: { color: '#ff3c5f'   /* Red */ },
  statusLow: { color: '#ff3c5f'    /* Red, or a different color like blue/yellow if preferred */ },
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
  disclaimerText: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  attentionText: {
    color: '#ff3c5f',
    fontWeight: 'bold',
  },
  biomarkerText: {
    color: '#ff3c5f',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  statusText: {
    color: '#ff3c5f',
    fontWeight: 'bold',
  },
}); 