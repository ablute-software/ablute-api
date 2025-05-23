import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

export const saveProfile = async (profile: any) => {
  const userId = auth().currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const profileRef = database().ref(`users/${userId}/profiles/${profile.id}`);
  await profileRef.set(profile);
  return profile;
};

export const getProfiles = async () => {
  const userId = auth().currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const snapshot = await database().ref(`users/${userId}/profiles`).once('value');
  return snapshot.val() || {};
};

export const saveAnalysis = async (profileId: string, analysis: any) => {
  const userId = auth().currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const analysisRef = database().ref(`users/${userId}/analyses/${profileId}`).push();
  await analysisRef.set({
    ...analysis,
    id: analysisRef.key,
    timestamp: database.ServerValue.TIMESTAMP
  });
  return analysis;
};

export const getAnalyses = async (profileId: string) => {
  const userId = auth().currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const snapshot = await database().ref(`users/${userId}/analyses/${profileId}`).once('value');
  return snapshot.val() || {};
};

export const exportData = async () => {
  const userId = auth().currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const [profilesSnapshot, analysesSnapshot] = await Promise.all([
    database().ref(`users/${userId}/profiles`).once('value'),
    database().ref(`users/${userId}/analyses`).once('value')
  ]);

  return {
    profiles: profilesSnapshot.val() || {},
    analyses: analysesSnapshot.val() || {}
  };
};

export const importData = async (data: { profiles: any, analyses: any }) => {
  const userId = auth().currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const updates: any = {};
  
  // Prepare profile updates
  Object.entries(data.profiles).forEach(([id, profile]) => {
    updates[`users/${userId}/profiles/${id}`] = profile;
  });

  // Prepare analysis updates
  Object.entries(data.analyses).forEach(([profileId, analyses]) => {
    Object.entries(analyses).forEach(([analysisId, analysis]) => {
      updates[`users/${userId}/analyses/${profileId}/${analysisId}`] = analysis;
    });
  });

  await database().ref().update(updates);
  return true;
}; 