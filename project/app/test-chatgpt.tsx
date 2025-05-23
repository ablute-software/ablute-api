import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Profile, Analysis } from '../types/profile';
import AnalysisReport from '../components/AnalysisReport';
import { initialProfiles } from '../data/profiles';

// Sample analysis data for testing
const sampleAnalysis: Analysis = {
  id: '1',
  profileId: '1',
  date: new Date().toISOString(),
  biomarkers: {
    creatinine: {
      value: 85,
      reference: '80-150',
      status: 'normal'
    },
    glucose: {
      value: 12,
      reference: '< 15',
      status: 'normal'
    },
    albumin: {
      value: 25,
      reference: '< 30',
      status: 'normal'
    },
    nitrites: {
      value: 0.8,
      reference: '< 1.0',
      status: 'normal'
    },
    ntProBNP: {
      value: 90,
      reference: '< 100',
      status: 'normal'
    },
    ngal: {
      value: 140,
      reference: '< 150',
      status: 'normal'
    },
    ohDG: {
      value: 5.0,
      reference: '3.0-7.0',
      status: 'normal'
    },
    mcp1: {
      value: 180,
      reference: '< 200',
      status: 'normal'
    }
  }
};

export default function TestChatGPT() {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [testAnalysis, setTestAnalysis] = useState<Analysis>(sampleAnalysis);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>ChatGPT Integration Test</Text>
      
      {/* Profile Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select a Profile</Text>
        {initialProfiles.map((profile) => (
          <TouchableOpacity
            key={profile.id}
            style={[
              styles.profileButton,
              selectedProfile?.id === profile.id && styles.selectedProfile
            ]}
            onPress={() => setSelectedProfile(profile)}
          >
            <Text style={styles.profileButtonText}>{profile.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Analysis Report */}
      {selectedProfile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis Report</Text>
          <AnalysisReport
            profile={selectedProfile}
            analysis={testAnalysis}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  profileButton: {
    backgroundColor: '#222222',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedProfile: {
    backgroundColor: '#4CAF50',
  },
  profileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
}); 