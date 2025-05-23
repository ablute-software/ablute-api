import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { loadProfiles } from '../../utils/profileStorage';
import { Profile } from '../../types/profile';
import { getLatestAnalysisForProfile, addAnalysis } from '../../utils/excelParser';
import { useCredits, loadCredits } from '../../utils/creditStorage';
import { calculateBMI, calculateAge } from '../../utils/calculations';
import { saveProfiles } from '../../utils/profileStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ClassIPage() {
  // Modal states
  const [explorerModalVisible, setExplorerModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [biomarkers, setBiomarkers] = useState<any[]>([]);
  const [analysisDate, setAnalysisDate] = useState('');
  const [credits, setCredits] = useState(0);
  const [showAnalysisConfirmModal, setShowAnalysisConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTokens, setCurrentTokens] = useState(0);
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
  const [showPurchaseTokensModal, setShowPurchaseTokensModal] = useState(false);
  const [tokensNeeded, setTokensNeeded] = useState(0);
  const [tokenCost, setTokenCost] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState('essential'); // or get from user profile

  useEffect(() => {
    const fetchProfiles = async () => {
      const loadedProfiles = await loadProfiles();
      setProfiles(loadedProfiles);
      setSelectedProfile(loadedProfiles[0]);
    };
    fetchProfiles();
  }, []);

  useEffect(() => {
    const fetchLastAnalysis = async () => {
      if (selectedProfile && selectedProfile.code) {
        const lastAnalysis = await getLatestAnalysisForProfile(selectedProfile.code);
        if (lastAnalysis && lastAnalysis.biomarkers) {
          setBiomarkers([
            { marker: 'Creatinine', value: lastAnalysis.biomarkers.creatinine.value + ' mg/dL', ref: lastAnalysis.biomarkers.creatinine.referenceValue },
            { marker: 'Glucose', value: lastAnalysis.biomarkers.glucose.value + ' mg/dL', ref: lastAnalysis.biomarkers.glucose.referenceValue },
            { marker: 'Nitrites', value: lastAnalysis.biomarkers.nitrites.value + ' µmol/L', ref: lastAnalysis.biomarkers.nitrites.referenceValue },
            { marker: 'Albumin', value: lastAnalysis.biomarkers.albumin.value + ' mg/g Cr', ref: lastAnalysis.biomarkers.albumin.referenceValue },
            { marker: 'NGAL', value: lastAnalysis.biomarkers.ngal.value + ' ng/mL', ref: lastAnalysis.biomarkers.ngal.referenceValue },
            { marker: 'NT-proBNP', value: lastAnalysis.biomarkers.ntProBNP.value + ' pg/mL', ref: lastAnalysis.biomarkers.ntProBNP.referenceValue },
            { marker: '8-OHdG', value: lastAnalysis.biomarkers.ohDG.value + ' ng/mg Cr', ref: lastAnalysis.biomarkers.ohDG.referenceValue },
            { marker: 'MCP-1', value: lastAnalysis.biomarkers.mcp1.value + ' pg/mL', ref: lastAnalysis.biomarkers.mcp1.referenceValue },
          ]);
          setAnalysisDate(lastAnalysis.date || '');
        } else {
          setBiomarkers([]);
          setAnalysisDate('');
        }
      } else {
        setBiomarkers([]);
        setAnalysisDate('');
      }
    };
    fetchLastAnalysis();
  }, [selectedProfile]);

  useEffect(() => {
    const fetchCredits = async () => {
      const c = await loadCredits();
      setCredits(c);
    };
    fetchCredits();
  }, []);

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const storedTokens = await AsyncStorage.getItem('@current_tokens');
        setCurrentTokens(storedTokens ? parseInt(storedTokens, 10) : 0);
      } catch (error) {
        console.error('Error loading tokens:', error);
      }
    };
    loadTokens();
  }, []);

  const getTokenPrice = (planId: string) => {
    switch (planId) {
      case 'essential': return 1.75;
      case 'plus': return 1.13;
      case 'total': return 0.75;
      case 'pro': return 0.46;
      default: return 1.75;
    }
  };

  const handleAnalysis = () => {
    setShowAnalysisConfirmModal(true);
  };

  const handleConfirmAnalysis = async () => {
    setShowAnalysisConfirmModal(false);
    setLoading(true);
    try {
      if (!selectedProfile) {
        Alert.alert('Error', 'No profile selected');
        setLoading(false);
        return;
      }
      if (credits < 10) {
        setShowOutOfCreditsModal(true);
        setLoading(false);
        return;
      }
      const used = await useCredits(10);
      if (!used) {
        setShowOutOfCreditsModal(true);
        setLoading(false);
        return;
      }
      setCredits(prev => prev - 10);
      await performAnalysis();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to perform analysis. Please try again.');
    }
  };

  const handleCancelAnalysis = () => {
    setShowAnalysisConfirmModal(false);
  };

  const handleOutOfCreditsYes = () => {
    setShowOutOfCreditsModal(false);
    if (currentTokens >= 10) {
      const newTokenCount = currentTokens - 10;
      setCurrentTokens(newTokenCount);
      AsyncStorage.setItem('@current_tokens', newTokenCount.toString());
      performAnalysis();
    } else {
      const tokensToBuy = 10 - currentTokens;
      const costPerToken = getTokenPrice(selectedPlan);
      setTokensNeeded(tokensToBuy);
      setTokenCost(tokensToBuy * costPerToken);
      setShowPurchaseTokensModal(true);
    }
  };

  const handleOutOfCreditsNo = () => {
    setShowOutOfCreditsModal(false);
  };

  const handlePurchaseTokensConfirm = async () => {
    const tokensToBuy = 10 - currentTokens;
    const tokensAfterPurchase = currentTokens + tokensToBuy;
    const tokensAfterUse = tokensAfterPurchase - 10;
    try {
      await AsyncStorage.setItem('@current_tokens', tokensAfterUse.toString());
      setCurrentTokens(tokensAfterUse);
      setTokensNeeded(0);
      setTokenCost(0);
      setShowPurchaseTokensModal(false);
      await performAnalysis();
    } catch (error) {
      console.error('Error updating tokens:', error);
      Alert.alert('Error', 'Failed to update tokens. Please try again.');
    }
  };

  const handlePurchaseTokensCancel = () => {
    setShowPurchaseTokensModal(false);
  };

  const performAnalysis = async () => {
    try {
      if (!selectedProfile) {
        Alert.alert('Error', 'No profile selected');
        return;
      }
      // Only check credits if we're not using tokens
      if (credits < 10 && currentTokens < 10) {
        Alert.alert(
          'Insufficient Credits',
          'You do not have enough credits or tokens to perform an analysis. Please purchase more credits or tokens.'
        );
        return;
      }
      // If using credits, deduct them
      if (credits >= 10) {
        const hasCredits = await useCredits(10);
        if (!hasCredits) {
          Alert.alert(
            'Insufficient Credits',
            'You do not have enough credits to perform an analysis. Please purchase more credits.'
          );
          return;
        }
        setCredits(prev => prev - 10);
      }
      // Generate new analysis (randomized for demo, adapt as needed)
      const analysis = {
        profileCode: selectedProfile.code || '',
        name: selectedProfile.name,
        age: calculateAge(selectedProfile.birthDate),
        height: selectedProfile.height,
        weight: selectedProfile.weight,
        bmi: calculateBMI(selectedProfile.weight, selectedProfile.height),
        sex: selectedProfile.sex,
        date: new Date().toLocaleDateString('en-GB'),
        biomarkers: {
          creatinine: { value: Math.floor(Math.random() * 70) + 80, referenceValue: 'Adults: 80-150; Children: 20-100', interpretation: 'Within normal range' },
          glucose: { value: Math.floor(Math.random() * 10), referenceValue: '< 15', interpretation: 'Within normal range' },
          albumin: { value: Math.floor(Math.random() * 20), referenceValue: '< 30', interpretation: 'Within normal range' },
          nitrites: { value: Number((Math.random() * 0.8).toFixed(1)), referenceValue: '< 1.0', interpretation: 'Within normal range' },
          ntProBNP: { value: Math.floor(Math.random() * 80), referenceValue: '< 100', interpretation: 'Within normal range' },
          ngal: { value: Math.floor(Math.random() * 120), referenceValue: '< 150', interpretation: 'Within normal range' },
          ohDG: { value: Number((Math.random() * 4 + 3).toFixed(1)), referenceValue: '3.0-7.0', interpretation: 'Within normal range' },
          mcp1: { value: Math.floor(Math.random() * 150), referenceValue: '< 200', interpretation: 'Within normal range' }
        }
      };
      await addAnalysis(analysis);
      // Update profile lastExamDate
      const updatedProfiles = profiles.map(p =>
        p.id === selectedProfile.id ? { ...p, lastExamDate: analysis.date } : p
      );
      await saveProfiles(updatedProfiles);
      setProfiles(updatedProfiles);
      setSelectedProfile(prev => prev ? { ...prev, lastExamDate: analysis.date } : prev);
      Alert.alert('Analysis Complete', 'Your analysis has been completed successfully.');
      // Optionally, refresh analysis table
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to perform analysis. Please try again.');
    }
  };

  if (!selectedProfile) return null;

  return (
    <View style={styles.container}>
      {/* Modal for Explorer Mode */}
      <Modal
        visible={explorerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExplorerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Warning</Text>
            <Text style={styles.modalText}>
              You are about to enter a section that contains scientific information not yet certified for medical use. Please read the following disclaimer carefully before proceeding.
            </Text>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setCheckboxChecked(!checkboxChecked)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, checkboxChecked && styles.checkboxChecked]}>
                {checkboxChecked && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I understand that the information presented is for exploratory or research purposes only and should not be used for medical diagnosis or treatment.
              </Text>
            </TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setExplorerModalVisible(false);
                  setCheckboxChecked(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, !checkboxChecked ? styles.disabledButton : styles.continueButton]}
                disabled={!checkboxChecked}
                onPress={() => {
                  setExplorerModalVisible(false);
                  setCheckboxChecked(false);
                  router.replace('/');
                }}
              >
                <Text style={[styles.modalButtonText, !checkboxChecked && { opacity: 0.5 }]}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Select Modal */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 400 }]}> 
            <Text style={styles.modalTitle}>Select Profile</Text>
            <ScrollView>
              {profiles.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#222' }}
                  onPress={() => {
                    setSelectedProfile(p);
                    setProfileModalVisible(false);
                  }}
                >
                  <Image source={{ uri: p.profilePicture }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                  <Text style={{ color: '#fff', fontSize: 16 }}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setProfileModalVisible(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>ablute_</Text>
        <View style={styles.creditsBox}>
          <Text style={styles.creditsText}>{credits}{"\n"}credits</Text>
        </View>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <TouchableOpacity onPress={() => setProfileModalVisible(true)}>
          <Image source={{ uri: selectedProfile.profilePicture }} style={styles.avatar} />
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{selectedProfile.name}</Text>
          <Text style={styles.profileDetails}>Age: {selectedProfile.birthDate} • Height: {selectedProfile.height} cm</Text>
          <Text style={styles.profileDetails}>Weight: {selectedProfile.weight} kg • BMI: {selectedProfile.bmi}</Text>
        </View>
        <TouchableOpacity style={styles.analysisButton} onPress={handleAnalysis} disabled={loading}>
          <Text style={styles.analysisButtonText}>Perform Analysis</Text>
        </TouchableOpacity>
      </View>

      {/* Analysis Card */}
      <View style={styles.analysisCard}>
        <View style={styles.analysisHeader}>
          <Text style={styles.analysisTitle}>Analysis</Text>
          <Text style={styles.analysisDateLabel}>Date of Evaluation</Text>
          <Text style={styles.analysisDate}>{analysisDate}</Text>
        </View>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderCell}>Biomarker</Text>
          <Text style={styles.tableHeaderCell}>Evaluation</Text>
          <Text style={styles.tableHeaderCell}>Statistical Reference</Text>
        </View>
        <View>
          {biomarkers.map((b, idx) => (
            <View key={b.marker} style={[styles.tableRow, idx % 2 === 0 && { backgroundColor: 'rgba(255,255,255,0.01)' }]}> 
              <Text style={styles.tableCell}>{b.marker}</Text>
              <Text style={styles.tableCell}>{b.value}</Text>
              <Text style={styles.tableCell}>{b.ref}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Explorer Mode Button */}
      <View style={styles.explorerButtonContainer}>
        <TouchableOpacity style={styles.explorerButton} onPress={() => setExplorerModalVisible(true)}>
          <Text style={styles.explorerButtonText}>EXPLORER MODE</Text>
        </TouchableOpacity>
      </View>

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        This section contains scientific information not yet certified for medical use.
      </Text>

      {/* Footer */}
      <Text style={styles.footer}>
        Certified Medical Device – Class I (EU MDR){"\n"}Manufacturer: ablute{"\n"}UDI-DI: 01019506001023{"\n"}Version certified: 1.0.3
      </Text>

      <Modal
        visible={showOutOfCreditsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleOutOfCreditsNo}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Not enough credits</Text>
            <Text style={styles.modalText}>You do not have enough credits to perform this analysis. Would you like to use tokens instead?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleOutOfCreditsNo}
              >
                <Text style={styles.modalButtonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.continueButton]}
                onPress={handleOutOfCreditsYes}
              >
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPurchaseTokensModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handlePurchaseTokensCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Purchase Tokens</Text>
            <Text style={styles.modalText}>
              You need to purchase {tokensNeeded} tokens to perform the analysis.\nTotal cost: {tokenCost.toFixed(2)}€
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handlePurchaseTokensCancel}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.continueButton]}
                onPress={handlePurchaseTokensConfirm}
              >
                <Text style={styles.modalButtonText}>Purchase</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000014',
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  creditsBox: {
    backgroundColor: '#23233B',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  creditsText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18182A',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileDetails: {
    color: '#B0B0B0',
    fontSize: 13,
  },
  analysisButton: {
    backgroundColor: '#23233B',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 8,
  },
  analysisButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  analysisCard: {
    backgroundColor: '#18182A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  analysisHeader: {
    marginBottom: 8,
  },
  analysisTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 2,
  },
  analysisDateLabel: {
    color: '#B0B0B0',
    fontSize: 12,
  },
  analysisDate: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#B38CBF',
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableHeaderCell: {
    color: '#B38CBF',
    fontWeight: 'bold',
    fontSize: 13,
    flex: 1,
    textAlign: 'left',
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  tableCell: {
    color: '#FFFFFF',
    fontSize: 13,
    flex: 1,
    textAlign: 'left',
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  explorerButtonContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  explorerButton: {
    backgroundColor: '#23233B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 8,
  },
  explorerButtonText: {
    color: '#00CFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disclaimer: {
    color: '#B0B0B0',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  footer: {
    color: '#B0B0B0',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#18182A',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#ff3c5f',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 18,
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#00CFFF',
    borderRadius: 6,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#23233B',
  },
  checkboxChecked: {
    backgroundColor: '#00CFFF',
    borderColor: '#00CFFF',
  },
  checkboxTick: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: -2,
  },
  checkboxLabel: {
    color: '#E0E0E0',
    fontSize: 13,
    flex: 1,
    marginTop: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#23233B',
    marginTop: 10,
    width: 100,
    alignSelf: 'center',
  },
  continueButton: {
    backgroundColor: '#00CFFF',
  },
  disabledButton: {
    backgroundColor: '#23233B',
    opacity: 0.5,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
}); 