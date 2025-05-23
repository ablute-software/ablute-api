import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile } from '../types/profile';
import { initialProfiles } from '../data/profiles';
import { Platform } from 'react-native';

const PROFILES_STORAGE_KEY = '@profiles';
const isWeb = Platform.OS === 'web';

// Initial profiles for web platform
const WEB_INITIAL_PROFILES = initialProfiles;

export const loadProfiles = async (): Promise<Profile[]> => {
  try {
    console.log('Loading profiles from storage...');
    const storedProfiles = await AsyncStorage.getItem(PROFILES_STORAGE_KEY);
    console.log('Raw stored profiles:', storedProfiles);
    
    if (storedProfiles) {
      const parsedProfiles = JSON.parse(storedProfiles);
      console.log('Parsed profiles:', parsedProfiles);
      return parsedProfiles;
    }
    
    console.log('No stored profiles found, saving initial profiles');
    // If no stored profiles, save initial profiles
    const profilesToSave = isWeb ? WEB_INITIAL_PROFILES : initialProfiles;
    await saveProfiles(profilesToSave);
    return profilesToSave;
  } catch (error) {
    console.error('Error loading profiles:', error);
    return isWeb ? WEB_INITIAL_PROFILES : initialProfiles;
  }
};

export const saveProfiles = async (profiles: Profile[]): Promise<void> => {
  try {
    console.log('Saving profiles:', profiles);
    const profilesString = JSON.stringify(profiles);
    console.log('Stringified profiles:', profilesString);
    await AsyncStorage.setItem(PROFILES_STORAGE_KEY, profilesString);
    console.log('Profiles saved successfully');
    
    // Verify the save
    const savedProfiles = await AsyncStorage.getItem(PROFILES_STORAGE_KEY);
    console.log('Verified saved profiles:', savedProfiles);
  } catch (error) {
    console.error('Error saving profiles:', error);
    throw error; // Re-throw the error to handle it in the calling code
  }
}; 