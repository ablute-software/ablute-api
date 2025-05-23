import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import ProfileForm from '../../components/ProfileForm';
import { ProfileFormData } from '../../types/profile';
import { loadProfiles, saveProfiles } from '../../utils/profileStorage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateBMI } from '../../utils/calculations';

export default function CreateProfileScreen() {
  const handleSubmit = async (data: ProfileFormData) => {
    try {
      // Generate a unique ID and code for the new profile
      const id = Date.now().toString();
      const code = `ABL_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Create the new profile object
      const newProfile = {
        id,
        code,
        name: data.name,
        birthDate: data.birthDate,
        height: data.height,
        weight: data.weight,
        profilePicture: data.profilePicture || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
        sex: data.sex,
        lastExamDate: null,
        bmi: calculateBMI(data.weight, data.height),
        settings: {
          automaticAnalysis: true,
          analysisFrequency: 7,
          notifications: true,
          darkMode: false,
          language: 'en'
        }
      };

      console.log('Creating new profile:', newProfile);

      // Load existing profiles and add the new one
      const profiles = await loadProfiles();
      console.log('Loaded existing profiles:', profiles);
      
      const updatedProfiles = [...profiles, newProfile];
      console.log('Updated profiles list:', updatedProfiles);
      
      // Save the updated profiles list
      await saveProfiles(updatedProfiles);
      console.log('Profiles saved successfully');
      
      // Store the selected profile ID
      await AsyncStorage.setItem('@selected_profile_id', id);
      
      // Navigate back to main page automatically
      router.back();
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert(
        'Error',
        'Failed to create profile. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => {}
          }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <ProfileForm onSubmit={handleSubmit} />
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
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
}); 