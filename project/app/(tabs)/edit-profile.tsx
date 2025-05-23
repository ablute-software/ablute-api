import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Profile } from '../../types/profile';
import { loadProfiles, saveProfiles } from '../../utils/profileStorage';
import { imperialToMetric, metricToImperial } from '../../utils/calculations';

const MAX_HEIGHT_CM = 280;
const MAX_HEIGHT_INCHES = Number((MAX_HEIGHT_CM * 0.393701).toFixed(1)); // Convert 280 cm to inches

export default function EditProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useImperial, setUseImperial] = useState(false);
  const [heightError, setHeightError] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadProfile();
    // Scroll to top when component mounts
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!id) {
        setError('Profile ID is required');
        return;
      }
      const profiles = await loadProfiles();
      const foundProfile = profiles.find(p => p.id === id);
      if (foundProfile) {
        setProfile(foundProfile);
      } else {
        setError('Profile not found');
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHeightChange = (text: string) => {
    if (!profile) return;
    
    // Remove any non-numeric characters except decimal point
    const cleanText = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleanText.split('.');
    if (parts.length > 2) {
      return; // Don't update if there are multiple decimal points
    }
    
    const value = parseFloat(cleanText) || 0;
    const maxHeight = useImperial ? MAX_HEIGHT_INCHES : MAX_HEIGHT_CM;
    
    if (value > maxHeight) {
      setHeightError(`Maximum height is ${maxHeight} ${useImperial ? 'inches' : 'cm'}`);
      // Set the value to the maximum allowed
      const maxValue = useImperial ? metricToImperial.height(maxHeight) : maxHeight;
      setProfile({ ...profile, height: maxValue });
    } else {
      setHeightError('');
      setProfile({ ...profile, height: value });
    }
  };

  const validateBirthDate = (dateStr: string): boolean => {
    // Check if the date format is valid (DD-MM-YYYY)
    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!dateRegex.test(dateStr)) {
      setBirthDateError('Invalid date format. Use DD-MM-YYYY');
      return false;
    }

    const [day, month, year] = dateStr.split('-').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    // Check if the date is valid
    if (birthDate.toString() === 'Invalid Date') {
      setBirthDateError('Invalid date');
      return false;
    }

    // Check if the date is in the future
    if (birthDate > today) {
      setBirthDateError('Birth date cannot be in the future');
      return false;
    }

    // Check if the date is reasonable (not too old)
    const maxAge = 120; // Maximum reasonable age
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - maxAge);
    if (birthDate < minDate) {
      setBirthDateError('Birth date seems too old');
      return false;
    }

    setBirthDateError('');
    return true;
  };

  const handleBirthDateChange = (text: string) => {
    if (!profile) return;
    
    // Only allow numbers and hyphens
    const cleanText = text.replace(/[^0-9-]/g, '');
    
    // Format the date as the user types
    let formattedText = cleanText;
    if (cleanText.length > 2) {
      formattedText = cleanText.slice(0, 2) + '-' + cleanText.slice(2);
    }
    if (cleanText.length > 5) {
      formattedText = formattedText.slice(0, 5) + '-' + formattedText.slice(5);
    }
    
    // Limit the total length to 10 characters (DD-MM-YYYY)
    formattedText = formattedText.slice(0, 10);
    
    setProfile({ ...profile, birthDate: formattedText });
    validateBirthDate(formattedText);
  };

  const handleSave = async () => {
    if (!profile) return;

    // Validate height before saving
    const maxHeight = useImperial ? MAX_HEIGHT_INCHES : MAX_HEIGHT_CM;
    if (profile.height > maxHeight) {
      Alert.alert('Error', `Height cannot exceed ${maxHeight} ${useImperial ? 'inches' : 'cm'}`);
      return;
    }

    // Validate birth date before saving
    if (!validateBirthDate(profile.birthDate)) {
      Alert.alert('Error', 'Please fix the birth date before saving');
      return;
    }

    try {
      const profiles = await loadProfiles();
      const updatedProfile = { ...profile };
      
      // Convert height and weight back to metric if using imperial
      if (useImperial) {
        updatedProfile.height = imperialToMetric.height(updatedProfile.height);
        updatedProfile.weight = imperialToMetric.weight(updatedProfile.weight);
      }
      
      const updatedProfiles = profiles.map(p => 
        p.id === updatedProfile.id ? updatedProfile : p
      );
      await saveProfiles(updatedProfiles);
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
      console.error('Error updating profile:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
              value={profile.name}
              onChangeText={(text) => setProfile({ ...profile, name: text })}
              placeholder="Enter name"
            />
          </View>

          <View style={styles.systemToggle}>
            <Text style={styles.label}>Use Imperial System</Text>
            <Switch
              value={useImperial}
              onValueChange={(value) => {
                setUseImperial(value);
                // Convert height and weight when switching systems
                if (value) {
                  setProfile({
                    ...profile,
                    height: metricToImperial.height(profile.height),
                    weight: metricToImperial.weight(profile.weight)
                  });
                } else {
                  setProfile({
                    ...profile,
                    height: imperialToMetric.height(profile.height),
                    weight: imperialToMetric.weight(profile.weight)
                  });
                }
              }}
          />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Height ({useImperial ? 'inches' : 'centimeters'})
            </Text>
            <TextInput
              style={[styles.input, heightError ? styles.inputError : null]}
              value={profile.height.toString()}
              onChangeText={handleHeightChange}
              keyboardType="numeric"
              placeholder={`Enter height in ${useImperial ? 'inches' : 'centimeters'}`}
            />
            {heightError ? <Text style={styles.errorText}>{heightError}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Weight ({useImperial ? 'pounds' : 'kg'})
            </Text>
          <TextInput
            style={styles.input}
              value={profile.weight.toString()}
              onChangeText={(text) => setProfile({ ...profile, weight: parseFloat(text) || 0 })}
            keyboardType="numeric"
              placeholder={`Enter weight in ${useImperial ? 'pounds' : 'kg'}`}
          />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Birth Date (DD-MM-YYYY)</Text>
          <TextInput
              style={[styles.input, birthDateError ? styles.inputError : null]}
            value={profile.birthDate}
              onChangeText={handleBirthDateChange}
              placeholder="Enter birth date (DD-MM-YYYY)"
              keyboardType="numeric"
          />
            {birthDateError ? <Text style={styles.errorText}>{birthDateError}</Text> : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  scrollContent: {
    flexGrow: 1,
  },
  systemToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
});