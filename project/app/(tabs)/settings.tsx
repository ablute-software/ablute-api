import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Profile, ProfileSettings } from '../../types/profile';
import { loadProfiles, saveProfiles } from '../../utils/profileStorage';

const ANALYSIS_FREQUENCIES = [
  { label: 'Every day', value: 1 },
  { label: 'Every two days', value: 2 },
  { label: 'Every three days', value: 3 },
  { label: 'Weekly', value: 7 },
  { label: 'Every two weeks', value: 14 },
  { label: 'Monthly', value: 30 },
];

export default function SettingsScreen() {
  const { profile } = useLocalSearchParams<{ profile: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [isAutomatic, setIsAutomatic] = useState(false);
  const [frequency, setFrequency] = useState(7);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!profile) {
          throw new Error('No profile data available');
        }
        
        const parsedProfile = JSON.parse(profile);
        setProfileData(parsedProfile);
        setIsAutomatic(parsedProfile.settings.automaticAnalysis);
        setFrequency(parsedProfile.settings.analysisFrequency);
      } catch (err) {
        setError('Failed to load profile settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [profile]);

  const handleSaveSettings = async () => {
    try {
      setStatus('Saving settings...');
      
      if (!profileData) {
        setError('No profile data available');
        setStatus(null);
        return;
      }

      // Create new settings
      const newSettings: ProfileSettings = {
        automaticAnalysis: isAutomatic,
        analysisFrequency: frequency,
        notifications: profileData.settings?.notifications ?? true,
        darkMode: profileData.settings?.darkMode ?? false,
        language: profileData.settings?.language ?? 'en'
      };

      // Load current profiles
      setStatus('Loading profiles...');
      const profiles = await loadProfiles();
      
      // Update the current profile
      setStatus('Updating profile...');
      const updatedProfiles = profiles.map(p => {
        if (p.id === profileData.id) {
          return { ...p, settings: newSettings };
        }
        return p;
      });

      // Save to storage
      setStatus('Saving to storage...');
      await saveProfiles(updatedProfiles);
      
      // Update local state
      setProfileData(prev => {
        if (!prev) return null;
        return { ...prev, settings: newSettings };
      });

      setStatus('Settings saved successfully!');
      
      // Go back after a short delay
      setTimeout(() => {
        router.back();
      }, 300);
      
    } catch (error) {
      setError('Failed to save settings');
      setStatus('Failed to save settings. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Loading Settings...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  if (error || !profileData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Failed to load settings'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings for {profileData.name}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analysis Settings</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Automatic Analysis</Text>
          <Switch
            value={isAutomatic}
            onValueChange={setIsAutomatic}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isAutomatic ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {isAutomatic && (
          <View style={styles.frequencySection}>
            <Text style={styles.frequencyTitle}>Analysis Frequency</Text>
            <ScrollView style={styles.frequencyList} contentContainerStyle={styles.scrollContent}>
              {ANALYSIS_FREQUENCIES.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.frequencyItem,
                    frequency === item.value && styles.frequencyItemSelected,
                  ]}
                  onPress={() => setFrequency(item.value)}>
                  <Text
                    style={[
                      styles.frequencyText,
                      frequency === item.value && styles.frequencyTextSelected,
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {status && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveSettings}>
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#111111',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#111111',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    minWidth: 120,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    padding: 20,
    backgroundColor: '#111111',
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  frequencySection: {
    marginTop: 20,
  },
  frequencyTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  frequencyList: {
    maxHeight: 200,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  frequencyItem: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#222222',
    marginBottom: 10,
  },
  frequencyItemSelected: {
    backgroundColor: '#007AFF',
  },
  frequencyText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  frequencyTextSelected: {
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    backgroundColor: '#222222',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
});