import AsyncStorage from '@react-native-async-storage/async-storage';

const CREDITS_STORAGE_KEY = '@total_credits';

export const loadCredits = async (): Promise<number> => {
  try {
    const storedCredits = await AsyncStorage.getItem(CREDITS_STORAGE_KEY);
    return storedCredits ? parseInt(storedCredits, 10) : 0;
  } catch (error) {
    console.error('Error loading credits:', error);
    return 0;
  }
};

export const saveCredits = async (credits: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(CREDITS_STORAGE_KEY, credits.toString());
  } catch (error) {
    console.error('Error saving credits:', error);
  }
};

export const useCredits = async (amount: number): Promise<boolean> => {
  try {
    const currentCredits = await loadCredits();
    
    if (currentCredits < amount) {
      return false;
    }
    
    await saveCredits(currentCredits - amount);
    return true;
  } catch (error) {
    console.error('Error using credits:', error);
    return false;
  }
};

export const addCredits = async (amount: number): Promise<void> => {
  try {
    const currentCredits = await loadCredits();
    await saveCredits(currentCredits + amount);
  } catch (error) {
    console.error('Error adding credits:', error);
  }
}; 