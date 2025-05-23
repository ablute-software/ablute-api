import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { ArrowLeft, Minus, Plus, Check, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { loadCredits, addCredits } from '../../utils/creditStorage';
import { SubscriptionPlan } from '../../types/profile';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUBSCRIPTION_PLANS = [
  {
    id: 'essential',
    name: 'Essential',
    price: '35€',
    credits: 20,
    features: [
      'Basic health tracking',
      'Limited analysis credits',
      'Standard support',
      'Basic meal planning',
      'Basic workout tracking'
    ]
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '45€',
    credits: 40,
    features: [
      'Advanced health tracking',
      'More analysis credits',
      'Priority support',
      'Advanced meal planning',
      'Advanced workout tracking',
      'Custom health goals'
    ]
  },
  {
    id: 'total',
    name: 'Total',
    price: '120€',
    credits: 160,
    features: [
      'Complete health tracking',
      'Maximum analysis credits',
      '24/7 premium support',
      'AI-powered meal planning',
      'AI-powered workout tracking',
      'Custom health goals',
      'Family accounts',
      'Health reports'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '550€',
    credits: 1200,
    features: [
      'Everything in Total',
      'Unlimited analysis credits',
      'Dedicated support team',
      'Custom AI solutions',
      'API access',
      'White-label options',
      'Enterprise features',
      'Custom integrations'
    ]
  }
];

export default function StoreScreen() {
  const [tokens, setTokens] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState('essential');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [planToConfirm, setPlanToConfirm] = useState<string | null>(null);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [currentTokens, setCurrentTokens] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showTokenConfirm, setShowTokenConfirm] = useState(false);

  // Load current credits and plan
  useEffect(() => {
    const loadCurrentCreditsAndPlan = async () => {
      try {
        setIsLoading(true);
        const currentCredits = await loadCredits();
        setCurrentCredits(currentCredits);
        // Load current tokens from AsyncStorage
        const storedTokens = await AsyncStorage.getItem('@current_tokens');
        setCurrentTokens(storedTokens ? parseInt(storedTokens, 10) : 0);
        // Try to load selected plan from AsyncStorage
        const storedPlanId = await AsyncStorage.getItem('@selected_subscription_plan');
        if (storedPlanId && SUBSCRIPTION_PLANS.some(p => p.id === storedPlanId)) {
          setSelectedPlan(storedPlanId);
        } else {
        // Set the selected plan based on current credits
        const plan = SUBSCRIPTION_PLANS.find(p => p.credits === currentCredits) || SUBSCRIPTION_PLANS[0];
        setSelectedPlan(plan.id);
        }
      } catch (error) {
        console.error('Error loading credits:', error);
        Alert.alert(
          'Error',
          'Failed to load subscription information. Please try again later.'
        );
        setSelectedPlan('essential');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCurrentCreditsAndPlan();
  }, []);

  const handleTokenChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setTokens(num);
    }
  };

  const handlePlanSelect = (planId: string) => {
    if (planId !== selectedPlan) {
      setPlanToConfirm(planId);
      setShowConfirmation(true);
    }
  };

  const handleConfirmSubscription = async () => {
    if (planToConfirm) {
      try {
        setIsLoading(true);
        const selectedPlanObj = SUBSCRIPTION_PLANS.find(p => p.id === planToConfirm);
        if (selectedPlanObj) {
          // Add the new credits
          await addCredits(selectedPlanObj.credits);
          
          // Update UI
          setSelectedPlan(planToConfirm);
          setCurrentCredits(selectedPlanObj.credits);
          
          // Persist selected plan
          await AsyncStorage.setItem('@selected_subscription_plan', planToConfirm);
          
          Alert.alert(
            'Success',
            `Successfully purchased ${selectedPlanObj.name} plan!`
          );
        }
      } catch (error) {
        console.error('Error updating subscription:', error);
        Alert.alert(
          'Error',
          'Failed to update subscription. Please try again later.'
        );
      } finally {
        setIsLoading(false);
      }
    }
    setShowConfirmation(false);
    setPlanToConfirm(null);
  };

  const getTokenPrice = (planId: string) => {
    switch (planId) {
      case 'essential': return 1.75;
      case 'plus': return 1.13;
      case 'total': return 0.75;
      case 'pro': return 0.46;
      default: return 1.75;
    }
  };

  const handlePurchaseTokens = () => {
    if (tokens > 0) {
      setShowTokenConfirm(true);
    }
  };

  const handleConfirmTokenPurchase = async () => {
    try {
      setIsLoading(true);
      // Update tokens instead of credits
      const newTokens = currentTokens + tokens;
      await AsyncStorage.setItem('@current_tokens', newTokens.toString());
      setCurrentTokens(newTokens);
      setTokens(0);
      setShowTokenConfirm(false);
      Alert.alert('Success', `Successfully purchased ${tokens} tokens!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to purchase tokens. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top right corner credits and tokens display */}
      <View style={styles.topRightBoxes}>
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxLabel}>Credits</Text>
          <Text style={styles.infoBoxValue}>{currentCredits}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxLabel}>Tokens</Text>
          <Text style={styles.infoBoxValue}>{currentTokens}</Text>
        </View>
      </View>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Store</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Purchase Tokens</Text>
        <View style={styles.tokenInput}>
          <TouchableOpacity
            style={styles.tokenButton}
            onPress={() => setTokens(Math.max(0, tokens - 1))}>
            <Minus size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TextInput
            style={styles.tokenCount}
            value={tokens.toString()}
            onChangeText={handleTokenChange}
            keyboardType="numeric"
            maxLength={3}
          />
          <TouchableOpacity
            style={styles.tokenButton}
            onPress={() => setTokens(tokens + 1)}>
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.purchaseButton, tokens === 0 && { opacity: 0.5 }]} onPress={handlePurchaseTokens} disabled={tokens === 0}>
          <Text style={styles.purchaseButtonText}>Purchase Tokens</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription Plans</Text>
        <View style={styles.plansGrid}>
          {SUBSCRIPTION_PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
              ]}
              onPress={() => handlePlanSelect(plan.id)}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planDetails}>{plan.credits} credits</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Modal
        visible={showConfirmation}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Subscription</Text>
            <Text style={styles.modalText}>
              Are you sure you want to subscribe to the {SUBSCRIPTION_PLANS.find(p => p.id === planToConfirm)?.name} plan for {SUBSCRIPTION_PLANS.find(p => p.id === planToConfirm)?.price}?
            </Text>
            <Text style={styles.modalText}>
              You will receive {SUBSCRIPTION_PLANS.find(p => p.id === planToConfirm)?.credits} credits.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmation(false)}
              >
                <X size={20} color="#FFFFFF" />
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmSubscription}
              >
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTokenConfirm}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Token Purchase</Text>
            <Text style={styles.modalText}>
              You are about to purchase {tokens} tokens at {getTokenPrice(selectedPlan).toFixed(2)}€ each.
            </Text>
            <Text style={styles.modalText}>
              Total: {(tokens * getTokenPrice(selectedPlan)).toFixed(2)}€
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowTokenConfirm(false)}
              >
                <X size={20} color="#FFFFFF" />
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmTokenPurchase}
              >
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.modalButtonText}>Confirm</Text>
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
    backgroundColor: '#000000',
    paddingBottom: 60,
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
  tokenInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tokenButton: {
    backgroundColor: '#333333',
    padding: 10,
    borderRadius: 10,
  },
  tokenCount: {
    backgroundColor: '#222222',
    color: '#FFFFFF',
    fontSize: 24,
    padding: 10,
    marginHorizontal: 20,
    minWidth: 100,
    textAlign: 'center',
    borderRadius: 10,
  },
  purchaseButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  planCard: {
    width: '48%',
    backgroundColor: '#222222',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  planCardSelected: {
    backgroundColor: '#007AFF',
  },
  planName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  planDetails: {
    color: '#888888',
    fontSize: 14,
    marginBottom: 5,
  },
  planPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#222222',
    borderRadius: 15,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#666666',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  topRightBoxes: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    zIndex: 1000,
    elevation: 5,
  },
  infoBox: {
    backgroundColor: '#222222',
    padding: 10,
    borderRadius: 10,
    marginLeft: 10,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  infoBoxLabel: {
    color: '#888888',
    fontSize: 12,
    marginBottom: 4,
  },
  infoBoxValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});