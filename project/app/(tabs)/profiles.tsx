import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { UserPlus, ArrowLeft, FileSpreadsheet, Activity, Lightbulb } from 'lucide-react-native';
import { router } from 'expo-router';
import { initialProfiles } from '../../data/profiles';
import { Profile, ProfileFormData } from '../../types/profile';
import ProfileCard from '../../components/ProfileCard';
import ProfileForm from '../../components/ProfileForm';
import { calculateBMI } from '../../utils/calculations';
import { loadProfiles, saveProfiles } from '../../utils/profileStorage';

export default function ProfilesScreen() {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [showForm, setShowForm] = useState(false);

  // Load profiles from storage when component mounts
  useEffect(() => {
    const loadStoredProfiles = async () => {
      const storedProfiles = await loadProfiles();
      setProfiles(storedProfiles);
    };
    loadStoredProfiles();
  }, []);

  const handleCreateProfile = () => {
    router.push("/(tabs)/create-profile");
  };

  const handleSelectProfile = (profile: Profile) => {
    // This function is called by the ProfileCard component
    // We can add any additional logic here if needed
    console.log('Profile selected:', profile.id);
  };

  const handleViewAnalyses = (profile: Profile) => {
    console.log('Navigating to analysis for profile:', profile.id);
    router.push({
      pathname: "/(tabs)/analysis/[id]",
      params: { id: profile.id }
    });
  };

  const handleViewBiomarkers = (profile: Profile) => {
    console.log('Biomarkers view not implemented yet');
  };

  const handleViewSuggestions = (profile: Profile) => {
    console.log('Suggestions view not implemented yet');
  };

  const handleEditProfile = (profile: Profile) => {
    router.push({
      pathname: "/(tabs)/edit-profile/[id]",
      params: { id: profile.id }
    });
  };

  const handleAddProfile = () => {
    router.push({
      pathname: "/(tabs)/create-profile",
    });
  };

  if (showForm) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowForm(false)}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Profile</Text>
        </View>
        <ProfileForm onSubmit={handleCreateProfile} />
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
        <Text style={styles.title}>Profiles</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddProfile}>
          <UserPlus size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.profileList} contentContainerStyle={styles.scrollContent}>
        {profiles.map((profile) => (
          <View key={profile.id} style={styles.profileContainer}>
            <ProfileCard
              profile={profile}
              onSelect={handleSelectProfile}
            />
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleViewAnalyses(profile)}>
                <FileSpreadsheet size={20} color="#007AFF" />
                <Text style={styles.actionButtonText}>Analyses</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleViewBiomarkers(profile)}>
                <Activity size={20} color="#007AFF" />
                <Text style={styles.actionButtonText}>Biomarkers</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleViewSuggestions(profile)}>
                <Lightbulb size={20} color="#007AFF" />
                <Text style={styles.actionButtonText}>Suggestions</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
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
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 15,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontWeight: '600',
  },
  profileList: {
    padding: 20,
  },
  profileContainer: {
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333333',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#007AFF',
    marginLeft: 5,
    fontWeight: '600',
    fontSize: 14,
  },
});