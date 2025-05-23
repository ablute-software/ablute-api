import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { loadCredits, updateSubscriptionPlan } from '../utils/creditStorage';
import { SubscriptionPlan } from '../types/profile';

const plans = [
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

export default function SubscriptionStore() {
  const [selectedPlan, setSelectedPlan] = useState('essential');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [planToConfirm, setPlanToConfirm] = useState<string | null>(null);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Load current credits and plan
  useEffect(() => {
    const loadCurrentCredits = async () => {
      try {
        setIsLoading(true);
        const credits = await loadCredits();
        setCurrentCredits(credits.currentCredits);
        
        // Set the selected plan based on current subscription
        const planId = plans.find(p => p.credits === credits.currentCredits)?.id || 'essential';
        setSelectedPlan(planId);
      } catch (error) {
        console.error('Error loading credits:', error);
        Alert.alert(
          'Error',
          'Failed to load subscription information. Please try again later.'
        );
        // Default to Essential plan if there's an error
        setSelectedPlan('essential');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCurrentCredits();
  }, []);

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
        // Convert plan ID to SubscriptionPlan type
        const planMap: Record<string, SubscriptionPlan> = {
          'essential': 'Essential',
          'plus': 'Plus',
          'total': 'Total',
          'pro': 'Pro'
        };
        
        const subscriptionPlan = planMap[planToConfirm];
        if (subscriptionPlan) {
          await updateSubscriptionPlan(subscriptionPlan);
          
          // Update UI
          setSelectedPlan(planToConfirm);
          const newCredits = plans.find(p => p.id === planToConfirm)?.credits || 0;
          setCurrentCredits(newCredits);
          
          Alert.alert(
            'Success',
            `Successfully updated to ${plans.find(p => p.id === planToConfirm)?.name} plan!`
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Plan</Text>
      <Text style={styles.subtitle}>Select the plan that best fits your needs</Text>
      
      <ScrollView style={styles.plansContainer}>
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              selectedPlan === plan.id && styles.selectedPlan
            ]}
            onPress={() => handlePlanSelect(plan.id)}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
            </View>
            
            <View style={styles.creditsContainer}>
              <Text style={styles.creditsText}>{plan.credits} Credits</Text>
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Check size={16} color="#4CAF50" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.subscribeButton,
                selectedPlan === plan.id && styles.selectedButton
              ]}
              onPress={() => handlePlanSelect(plan.id)}
            >
              <Text style={styles.subscribeButtonText}>
                {selectedPlan === plan.id ? 'Current Plan' : 'Subscribe'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={showConfirmation}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Subscription</Text>
            <Text style={styles.modalText}>
              Are you sure you want to subscribe to the {plans.find(p => p.id === planToConfirm)?.name} plan for {plans.find(p => p.id === planToConfirm)?.price}?
            </Text>
            <Text style={styles.modalText}>
              You will receive {plans.find(p => p.id === planToConfirm)?.credits} credits.
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
    </View>
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },
  plansContainer: {
    flex: 1,
  },
  planCard: {
    backgroundColor: '#222222',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  selectedPlan: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  creditsContainer: {
    backgroundColor: '#333333',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  creditsText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 14,
  },
  subscribeButton: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#4CAF50',
  },
  subscribeButtonText: {
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
}); 