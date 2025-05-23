import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import { AppItem } from '../types/profile';
import React, { useState, useMemo } from 'react';

const mockApps: AppItem[] = [
  {
    id: '1',
    name: 'Nutrition Tracker',
    icon: '🍎',
    available: true,
    installed: true,
    route: '/nutrition',
    description: 'Track your daily nutrition and meal planning',
    rating: 4.8,
    downloads: '10K+',
    category: 'Health & Fitness',
    price: 'Installed',
    features: [
      'Meal planning',
      'Nutrition tracking',
      'Recipe suggestions',
      'Progress reports'
    ],
    inAppPurchases: [
      { type: 'Premium Features', price: '$4.99/month' },
      { type: 'Recipe Pack', price: '$2.99' }
    ]
  },
  {
    id: '2',
    name: 'Medication Manager',
    icon: '💊',
    available: true,
    route: '/medication',
    description: 'Manage medications and set reminders',
    rating: 4.9,
    downloads: '5K+',
    category: 'Health',
    price: 'Free',
    features: [
      'Medication reminders',
      'Refill tracking',
      'Side effect logging',
      'Doctor reports'
    ],
    inAppPurchases: [
      { type: 'Family Sharing', price: '$2.99/month' },
      { type: 'Advanced Reports', price: '$1.99' }
    ]
  },
  {
    id: '3',
    name: 'Fitness Coach',
    icon: '🏋️',
    available: true,
    route: '/fitness',
    description: 'Personalized workout plans and tracking',
    rating: 4.7,
    downloads: '15K+',
    category: 'Health & Fitness',
    price: 'Free',
    features: [
      'Workout plans',
      'Progress tracking',
      'Nutrition guidance',
      'Community support'
    ],
    inAppPurchases: []
  },
  {
    id: '4',
    name: 'Sleep Monitor',
    icon: '😴',
    available: false,
    description: 'Track and improve your sleep quality',
    rating: 0,
    downloads: 'Coming Soon',
    category: 'Health',
    price: 'Free',
    features: [],
    inAppPurchases: []
  },
  {
    id: '5',
    name: 'Mental Health',
    icon: '🧠',
    available: false,
    description: 'Mindfulness and mental wellness tools',
    rating: 0,
    downloads: 'Coming Soon',
    category: 'Health',
    price: 'Free',
    features: [],
    inAppPurchases: []
  },
  {
    id: '6',
    name: 'Water Tracker',
    icon: '💧',
    available: true,
    route: '/water',
    description: 'Stay hydrated with smart reminders',
    rating: 4.6,
    downloads: '8K+',
    category: 'Health',
    price: 'Free',
    features: [
      'Water intake tracking',
      'Reminder notifications',
      'Progress reports',
      'Goal setting'
    ],
    inAppPurchases: []
  },
  {
    id: '7',
    name: 'Health Journal',
    icon: '📝',
    available: true,
    route: '/journal',
    description: 'Track symptoms and health patterns',
    rating: 4.5,
    downloads: '3K+',
    category: 'Health',
    price: 'Free',
    features: [
      'Symptom tracking',
      'Health diary',
      'Reminder notifications',
      'Progress reports'
    ],
    inAppPurchases: []
  },
  {
    id: '8',
    name: 'Vital Signs',
    icon: '❤️',
    available: true,
    route: '/vitals',
    description: 'Monitor blood pressure and heart rate',
    rating: 4.8,
    downloads: '12K+',
    category: 'Health',
    price: 'Free',
    features: [
      'Blood pressure monitoring',
      'Heart rate monitoring',
      'Progress reports',
      'Doctor reports'
    ],
    inAppPurchases: []
  },
  {
    id: '9',
    name: 'Allergy Tracker',
    icon: '🤧',
    available: false,
    description: 'Track allergies and symptoms',
    rating: 0,
    downloads: 'Coming Soon',
    category: 'Health',
    price: 'Free',
    features: [],
    inAppPurchases: []
  },
  {
    id: '10',
    name: 'Pregnancy Tracker',
    icon: '🤰',
    available: false,
    description: 'Track pregnancy milestones and health',
    rating: 0,
    downloads: 'Coming Soon',
    category: 'Health',
    price: 'Free',
    features: [],
    inAppPurchases: []
  }
];

export default function AppStoreScreen() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFeatureDropdown, setShowFeatureDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Get unique features from all apps
  const features = useMemo(() => {
    const uniqueFeatures = new Set<string>();
    mockApps.forEach(app => {
      app.features.forEach(feature => uniqueFeatures.add(feature));
    });
    return Array.from(uniqueFeatures).sort();
  }, []);

  // Get unique categories from all apps
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    mockApps.forEach(app => {
      if (app.category) {
        uniqueCategories.add(app.category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, []);

  // Filter apps based on selected feature and category
  const filteredApps = useMemo(() => {
    return mockApps.filter(app => {
      const matchesFeature = !selectedFeature || app.features.includes(selectedFeature);
      const matchesCategory = !selectedCategory || app.category === selectedCategory;
      return matchesFeature && matchesCategory;
    });
  }, [selectedFeature, selectedCategory]);

  const handleAppPress = (app: AppItem) => {
    if (app.available && app.route) {
      router.push(app.route);
    }
  };

  const handleFeatureTagPress = (feature: string) => {
    setSelectedFeature(feature);
    setShowFeatureDropdown(false);
  };

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
    setShowCategoryDropdown(false);
  };

  const AppCard = ({ app }: { app: AppItem }) => (
    <TouchableOpacity 
      style={[
        styles.appCard,
        !app.available && styles.appCardDisabled
      ]}
      onPress={() => handleAppPress(app)}
      disabled={!app.available}>
      <Text style={styles.appIcon}>{app.icon}</Text>
      <View style={styles.appInfo}>
        <View style={styles.appHeader}>
          <Text style={styles.appName}>{app.name}</Text>
          <Text style={[
            styles.appPrice,
            app.installed && styles.appInstalled
          ]}>{app.price}</Text>
        </View>
        <Text style={styles.appCategory}>{app.category}</Text>
        <Text style={styles.appDescription}>{app.description}</Text>
        
        <View style={styles.featuresContainer}>
          {app.features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={styles.featureTag}
              onPress={() => handleFeatureTagPress(feature)}>
              <Text style={styles.featureText}>{feature}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.appStats}>
          {app.available ? (
            <>
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingText}>★ {app.rating}</Text>
              </View>
              <Text style={styles.downloadsText}>{app.downloads}</Text>
            </>
          ) : (
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          )}
        </View>

        {app.inAppPurchases && app.inAppPurchases.length > 0 && (
          <View style={styles.inAppPurchases}>
            <Text style={styles.inAppTitle}>In-App Purchases:</Text>
            {app.inAppPurchases.map((purchase, index) => (
              <Text key={index} style={styles.inAppText}>
                {purchase.type} - {purchase.price}
              </Text>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>App Store</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            styles.allButton,
            !selectedFeature && !selectedCategory && styles.filterButtonActive
          ]}
          onPress={() => {
            setSelectedFeature(null);
            setSelectedCategory(null);
            setShowFeatureDropdown(false);
            setShowCategoryDropdown(false);
          }}>
          <Text style={[
            styles.filterButtonText,
            !selectedFeature && !selectedCategory && styles.filterButtonTextActive
          ]}>All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedCategory && styles.filterButtonActive
          ]}
          onPress={() => {
            setShowCategoryDropdown(!showCategoryDropdown);
            setShowFeatureDropdown(false);
          }}>
          <Text style={[
            styles.filterButtonText,
            selectedCategory && styles.filterButtonTextActive
          ]}>
            {selectedCategory || 'Select Category'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFeature && styles.filterButtonActive
          ]}
          onPress={() => {
            setShowFeatureDropdown(!showFeatureDropdown);
            setShowCategoryDropdown(false);
          }}>
          <Text style={[
            styles.filterButtonText,
            selectedFeature && styles.filterButtonTextActive
          ]}>
            {selectedFeature || 'Select Feature'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCategoryDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryDropdown(false)}>
        <TouchableOpacity
          style={[styles.modalOverlay, styles.categoryOverlay]}
          activeOpacity={1}
          onPress={() => setShowCategoryDropdown(false)}>
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownArrow} />
            <ScrollView 
              style={styles.dropdownScroll}
              showsVerticalScrollIndicator={true}
              indicatorStyle="black">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.dropdownItem,
                    selectedCategory === category && styles.dropdownItemActive
                  ]}
                  onPress={() => handleCategoryPress(category)}>
                  <Text style={[
                    styles.dropdownItemText,
                    selectedCategory === category && styles.dropdownItemTextActive
                  ]}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showFeatureDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFeatureDropdown(false)}>
        <TouchableOpacity
          style={[styles.modalOverlay, styles.featureOverlay]}
          activeOpacity={1}
          onPress={() => setShowFeatureDropdown(false)}>
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownArrow} />
            <ScrollView 
              style={styles.dropdownScroll}
              showsVerticalScrollIndicator={true}
              indicatorStyle="black">
              {features.map((feature) => (
                <TouchableOpacity
                  key={feature}
                  style={[
                    styles.dropdownItem,
                    selectedFeature === feature && styles.dropdownItemActive
                  ]}
                  onPress={() => handleFeatureTagPress(feature)}>
                  <Text style={[
                    styles.dropdownItemText,
                    selectedFeature === feature && styles.dropdownItemTextActive
                  ]}>{feature}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView style={styles.appsContainer}>
        {filteredApps.map((app) => (
          <AppCard key={app.id} app={app} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50,
    backgroundColor: '#111111',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#111111',
    zIndex: 1,
  },
  filterButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  allButton: {
    minWidth: 45,
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    color: '#BBBBBB',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 145,
    paddingLeft: 95,
  },
  dropdownContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    maxHeight: 200,
    width: 'auto',
    minWidth: 200,
    maxWidth: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  dropdownArrow: {
    position: 'absolute',
    top: -10,
    left: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#F5F5F5',
  },
  dropdownScroll: {
    maxHeight: 176,
    paddingRight: 4,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  dropdownItemActive: {
    backgroundColor: '#4CAF50',
  },
  dropdownItemText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  appsContainer: {
    flex: 1,
    padding: 15,
  },
  appCard: {
    backgroundColor: '#222222',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  appCardDisabled: {
    opacity: 0.5,
  },
  appIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  appInfo: {
    flex: 1,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appPrice: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  appInstalled: {
    color: '#007AFF',
  },
  appCategory: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 14,
    color: '#BBBBBB',
    marginBottom: 12,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  featureTag: {
    backgroundColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  appStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    backgroundColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#FFD700',
  },
  downloadsText: {
    fontSize: 12,
    color: '#888888',
  },
  comingSoonText: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
  },
  inAppPurchases: {
    marginTop: 8,
  },
  inAppTitle: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
  },
  inAppText: {
    fontSize: 12,
    color: '#BBBBBB',
    marginBottom: 2,
  },
  categoryOverlay: {
    paddingLeft: 60,
  },
  featureOverlay: {
    paddingLeft: 185,
  },
}); 