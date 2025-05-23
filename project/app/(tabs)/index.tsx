import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, Alert, ScrollView, Dimensions, Platform, Switch } from 'react-native';
import { Activity, Pencil, MapPin, Beaker, Brain, Settings, ShoppingBag, Apple, Pill, ChefHat, Medal, ArrowLeft } from 'lucide-react-native';
import { useState, useMemo, useEffect } from 'react';
import { initialProfiles } from '../../data/profiles';
import { Profile, SubscriptionPlan, PLAN_PROFILE_LIMITS, PLAN_CREDITS } from '../../types/profile';
import ProfileCard from '../../components/ProfileCard';
import { calculateMonitoringScore, calculateAge, calculateDaysSinceAnalysis } from '../../utils/calculations';
import { router, useNavigation, useLocalSearchParams } from 'expo-router';
import Animated, { useAnimatedProps, useAnimatedStyle, withRepeat, withTiming, useSharedValue, withSequence, Easing } from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { loadProfiles, saveProfiles } from '../../utils/profileStorage';
import { loadCredits, useCredits } from '../../utils/creditStorage';
import { addAnalysis, getLatestAnalysisForProfile } from '../../utils/excelParser';
import { calculateBMI } from '../../utils/calculations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateMockReportSections } from '../../components/AnalysisReport';
import { determineBiomarkerStatus } from '../../utils/biomarkerUtils';

const mockNews = [{
  id: '1',
  title: 'New Study Links Gut Health to Cognitive Function',
  summary: 'Researchers discover correlation between microbiome and brain...',
}];

const CIRCLE_RADIUS = 70;
const STROKE_WIDTH = 12;
const SVG_SIZE = (CIRCLE_RADIUS + STROKE_WIDTH) * 2;
const CENTER = SVG_SIZE / 2;

const START_ANGLE = 210;
const END_ANGLE = 150;
const ANGLE_RANGE = END_ANGLE - START_ANGLE + 360;

const polarToCartesian = (radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: CENTER + radius * Math.cos(angleInRadians),
    y: CENTER + radius * Math.sin(angleInRadians),
  };
};

const createArc = (radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(radius, startAngle);
  const end = polarToCartesian(radius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

const createArcSegment = (radius: number, startAngle: number, endAngle: number, color: string) => {
  return (
    <Path
      key={`${startAngle}-${endAngle}`}
      d={createArc(radius, startAngle, endAngle)}
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      fill="none"
      strokeLinecap="round"
    />
  );
};

const getGradientColor = (percentage: number): string => {
  // Convert percentage (0-100) to a position in the color spectrum
  const hue = (percentage * 1.2); // Multiplying by 1.2 to get a good range of colors
  return `hsl(${hue}, 70%, 50%)`;
};

const createArcSegments = (score: number) => {
  const segments = [];
  const segmentAngle = ANGLE_RANGE / 100; // Each segment represents 1%
  
  // If score is 0, show 5% in dark red
  const effectiveScore = score === 0 ? 5 : score;
  
  // Create segments up to the current score
  for (let i = 0; i < Math.min(effectiveScore, 100); i++) {
    const startAngle = START_ANGLE + (i * segmentAngle);
    const endAngle = startAngle + segmentAngle;
    // For score 0, use dark red (#8B0000) for all segments
    const color = score === 0 ? 'rgb(139, 0, 0)' : getGradientColor(i);
    segments.push(createArcSegment(CIRCLE_RADIUS, startAngle, endAngle, color));
  }
  
  return segments;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

const EKGGraph = () => {
  const { width } = Dimensions.get('window');
  const graphWidth = Math.max(width - 40, 300); // 40 for padding, min 300px
  const graphHeight = 80;
  const baseline = graphHeight / 2;
  const fullWidth = graphWidth * 2;

  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(-graphWidth, { duration: 4000, easing: Easing.linear })
      ),
      -1,
      false
    );
  }, [graphWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Hand-crafted EKG path for one cycle (P-QRS-T)
  const ekgCycle = [
    `M0,${baseline}`,
    `L20,${baseline}`,
    `L28,${baseline - 5}`,
    `L36,${baseline}`,
    `L44,${baseline}`,
    `L48,${baseline + 10}`,
    `L52,${baseline - 25}`,
    `L60,${baseline + 20}`,
    `L68,${baseline}`,
    `L80,${baseline}`,
    `L90,${baseline - 8}`,
    `L100,${baseline}`,
    `L120,${baseline}`
  ].join(' ');

  // Repeat the cycle to fill at least 2x the graphWidth
  let repeatedPath = ekgCycle;
  const cycleLength = 120;
  const repeatCount = Math.ceil((graphWidth * 2) / cycleLength) + 1;
  for (let i = 1; i < repeatCount; i++) {
    const offset = i * cycleLength;
    repeatedPath += ekgCycle.replace(/(\d+\.?\d*),/g, (match, p1) => `${parseFloat(p1) + offset},`);
  }

  // Grid lines (horizontal) for the container (static, always visible)
  const gridLinesStatic = [baseline - 20, baseline, baseline + 20].map((y, i) => (
    <Path
      key={i}
      d={`M0,${y} H${graphWidth}`}
      stroke="#444"
      strokeDasharray="4 4"
      strokeWidth="1"
      fill="none"
    />
  ));

  return (
    <View style={styles.ekgContainer}>
      <View style={styles.ekgHeader}>
        <Activity size={16} color="#A259F7" />
        <Text style={styles.ekgTitle}>Heart Rate Monitor</Text>
      </View>
      <View style={[styles.ekgGraphContainer, { width: graphWidth, height: graphHeight }]}> 
        {/* Static grid lines as background */}
        <Svg height={graphHeight} width={graphWidth} style={{ position: 'absolute', top: 0, left: 0 }}>
          {gridLinesStatic}
        </Svg>
        {/* Animated EKG waveform on top */}
        <Animated.View style={[styles.ekgGraph, animatedStyle, { width: graphWidth * 2, height: graphHeight, position: 'absolute', top: 0, left: 0 }]}> 
          <Svg height={graphHeight} width={graphWidth * 2}>
            <Defs>
              <LinearGradient id="ekgGradient" x1="0" y1="0" x2={graphWidth * 2} y2="0">
                <Stop offset="0%" stopColor="#A259F7" stopOpacity="1" />
                <Stop offset="100%" stopColor="#C471F5" stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Path
              d={repeatedPath}
              stroke="url(#ekgGradient)"
              strokeWidth="2"
              fill="none"
            />
            <Path
              d={repeatedPath}
              stroke="#A259F7"
              strokeWidth="5"
              fill="none"
              opacity="0.7"
            />
          </Svg>
        </Animated.View>
      </View>
      <View style={styles.ekgStats}>
        <Text style={styles.ekgStat}>HR: 72 BPM</Text>
        <Text style={styles.ekgStat}>Last updated: 2m ago</Text>
      </View>
    </View>
  );
};

const HealthReportSection = ({ currentProfile, showNotification }: { currentProfile: Profile | null, showNotification: boolean }) => {
  if (!currentProfile) {
    return null; 
  }
  const [reportPreviewText, setReportPreviewText] = useState("Loading health report...");

  useEffect(() => {
    const generateReportPreview = async () => {
      try {
        if (!currentProfile.code) {
          setReportPreviewText("Profile code not available");
          return;
        }
        const latestAnalysis = await getLatestAnalysisForProfile(currentProfile.code);
        if (latestAnalysis) {
          const biomarkers = {
            creatinine: {
              value: latestAnalysis.biomarkers.creatinine.value,
              reference: latestAnalysis.biomarkers.creatinine.referenceValue,
              status: determineBiomarkerStatus(latestAnalysis.biomarkers.creatinine.value, latestAnalysis.biomarkers.creatinine.referenceValue)
            },
            glucose: {
              value: latestAnalysis.biomarkers.glucose.value,
              reference: latestAnalysis.biomarkers.glucose.referenceValue,
              status: determineBiomarkerStatus(latestAnalysis.biomarkers.glucose.value, latestAnalysis.biomarkers.glucose.referenceValue)
            },
            albumin: {
              value: latestAnalysis.biomarkers.albumin.value,
              reference: latestAnalysis.biomarkers.albumin.referenceValue,
              status: determineBiomarkerStatus(latestAnalysis.biomarkers.albumin.value, latestAnalysis.biomarkers.albumin.referenceValue)
            },
            nitrites: {
              value: latestAnalysis.biomarkers.nitrites.value,
              reference: latestAnalysis.biomarkers.nitrites.referenceValue,
              status: determineBiomarkerStatus(latestAnalysis.biomarkers.nitrites.value, latestAnalysis.biomarkers.nitrites.referenceValue)
            },
            ntProBNP: {
              value: latestAnalysis.biomarkers.ntProBNP.value,
              reference: latestAnalysis.biomarkers.ntProBNP.referenceValue,
              status: determineBiomarkerStatus(latestAnalysis.biomarkers.ntProBNP.value, latestAnalysis.biomarkers.ntProBNP.referenceValue)
            },
            ngal: {
              value: latestAnalysis.biomarkers.ngal.value,
              reference: latestAnalysis.biomarkers.ngal.referenceValue,
              status: determineBiomarkerStatus(latestAnalysis.biomarkers.ngal.value, latestAnalysis.biomarkers.ngal.referenceValue)
            },
            ohDG: {
              value: latestAnalysis.biomarkers.ohDG.value,
              reference: latestAnalysis.biomarkers.ohDG.referenceValue,
              status: determineBiomarkerStatus(latestAnalysis.biomarkers.ohDG.value, latestAnalysis.biomarkers.ohDG.referenceValue)
            },
            mcp1: {
              value: latestAnalysis.biomarkers.mcp1.value,
              reference: latestAnalysis.biomarkers.mcp1.referenceValue,
              status: determineBiomarkerStatus(latestAnalysis.biomarkers.mcp1.value, latestAnalysis.biomarkers.mcp1.referenceValue)
            }
          } as const;

          const sections = generateMockReportSections(currentProfile, {
            id: 'preview',
            profileId: currentProfile.id,
            date: latestAnalysis.date,
            biomarkers
          });
          setReportPreviewText(sections.overallAssessment);
        } else {
          setReportPreviewText("No analysis data available");
        }
      } catch (error) {
        console.error('Error generating report preview:', error);
        setReportPreviewText("Unable to load health report");
      }
    };

    generateReportPreview();
  }, [currentProfile]);

  return (
    <View style={styles.healthReportSection}>
      <View style={styles.sectionHeader}>
        <Beaker size={16} color="#00c4cc" />
        <Text style={styles.sectionHeaderTitle}>Health Report</Text>
        {showNotification && <View style={styles.notificationDot} />}
      </View>

      <TouchableOpacity onPress={() => router.push({ pathname: '/test-chatgpt', params: { profileId: currentProfile.id } })}>
        <View style={styles.healthReportCard}>
          <Text style={styles.reportPreviewText} numberOfLines={2} ellipsizeMode="tail">
            {reportPreviewText}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default function HomeScreen() {
  console.log('HomeScreen rendered');
  const [currentProfile, setCurrentProfile] = useState<Profile>(initialProfiles[0]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [credits, setCredits] = useState<number>(0);
  const [currentTokens, setCurrentTokens] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState('essential');
  const navigation = useNavigation();
  const [showAnalysisConfirmModal, setShowAnalysisConfirmModal] = useState(false);
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
  const [showPurchaseTokensModal, setShowPurchaseTokensModal] = useState(false);
  const [tokensNeeded, setTokensNeeded] = useState(0);
  const [tokenCost, setTokenCost] = useState(0);
  const [showReportNotification, setShowReportNotification] = useState(false);
  const { selectedProfileId } = useLocalSearchParams<{ selectedProfileId: string }>();
  const [isMedicalDeviceMode, setIsMedicalDeviceMode] = useState(false);
  
  const loadData = async () => {
    try {
      const storedProfiles = await loadProfiles();
      // Add BMI to each profile
      const profilesWithBMI = storedProfiles.map(p => ({
        ...p,
        bmi: calculateBMI(p.weight, p.height),
      }));
      setProfiles(profilesWithBMI);
      
      const storedCredits = await loadCredits();
      console.log('Loaded credits:', storedCredits);
      setCredits(storedCredits);

      const newAnalysisPending = await AsyncStorage.getItem('@new_analysis_pending');
      setShowReportNotification(newAnalysisPending === 'true');
      
      // Check for selected profile ID in AsyncStorage
      const selectedProfileId = await AsyncStorage.getItem('@selected_profile_id');
      if (selectedProfileId) {
        const selectedProfile = storedProfiles.find(p => p.id === selectedProfileId);
        if (selectedProfile) {
          setCurrentProfile(selectedProfile);
          // Clear the selected profile ID after using it
          await AsyncStorage.removeItem('@selected_profile_id');
        } else if (storedProfiles.length > 0) {
          setCurrentProfile(storedProfiles[0]);
        }
      } else {
        const updatedCurrentProfile = storedProfiles.find(p => p.id === currentProfile.id);
        if (updatedCurrentProfile) {
          setCurrentProfile(updatedCurrentProfile);
        } else if (storedProfiles.length > 0) {
          setCurrentProfile(storedProfiles[0]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setCredits(0);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation, currentProfile.id]);
  
  const monitoringScore = useMemo(() => 
    calculateMonitoringScore(currentProfile.lastExamDate),
    [currentProfile.lastExamDate]
  );

  const daysSinceAnalysis = useMemo(() => 
    calculateDaysSinceAnalysis(currentProfile.lastExamDate || ''),
    [currentProfile.lastExamDate]
  );

  const animatedProps = useAnimatedProps(() => {
    const progress = monitoringScore / 100;
    const sweepAngle = ANGLE_RANGE * progress;
    return {
      d: createArc(CIRCLE_RADIUS, START_ANGLE, START_ANGLE + sweepAngle)
    };
  });

  useEffect(() => {
    if (monitoringScore <= 30) {
      Alert.alert(
        'Monitoring Alert',
        "Let's stay ahead! Your monitoring is insufficient — a quick check now can make a big difference. Stay proactive. You've got this!",
        [{ text: 'OK' }]
      );
    }
  }, [monitoringScore]);

  // Load current tokens
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

  const handleSelectProfile = (profile: Profile) => {
    setCurrentProfile(profile);
    setShowProfileModal(false);
  };

  const handleDeleteProfile = async (profile: Profile) => {
    if (profiles.length <= 1) {
      Alert.alert(
        'Cannot Delete',
        'You must have at least one profile.',
        [{ text: 'OK' }]
      );
      return;
    }

    const updatedProfiles = profiles.filter(p => p.id !== profile.id);
    setProfiles(updatedProfiles);
    await saveProfiles(updatedProfiles);
    
    if (currentProfile.id === profile.id) {
      setCurrentProfile(updatedProfiles[0]);
    }
  };

  const handleAddProfile = () => {
    setShowProfileModal(false);
    router.push("/(tabs)/create-profile");
  };

  const handleAnalysis = async () => {
    if (credits >= 10) {
      setShowAnalysisConfirmModal(true);
    } else {
      setShowOutOfCreditsModal(true);
    }
  };

  const handleConfirmAnalysis = () => {
    setShowAnalysisConfirmModal(false);
    performAnalysis();
    setCredits(prev => prev - 10);
  };

  const handleCancelAnalysis = () => {
    setShowAnalysisConfirmModal(false);
  };

  const handleOutOfCreditsYes = () => {
    console.log('Current tokens before check:', currentTokens);
    setShowOutOfCreditsModal(false);
    if (currentTokens >= 10) {
      console.log('Enough tokens, proceeding with analysis');
      const newTokenCount = currentTokens - 10;
      console.log('New token count will be:', newTokenCount);
      setCurrentTokens(newTokenCount);
      AsyncStorage.setItem('@current_tokens', newTokenCount.toString());
      performAnalysis();
    } else {
      console.log('Not enough tokens, showing purchase modal');
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
      // First update the tokens in storage
      await AsyncStorage.setItem('@current_tokens', tokensAfterUse.toString());
      
      // If we get here, storage update was successful
      setCurrentTokens(tokensAfterUse);
      setTokensNeeded(0);
      setTokenCost(0);
      setShowPurchaseTokensModal(false);
      
      // Then perform the analysis
      await performAnalysis();
    } catch (error) {
      console.error('Error updating tokens:', error);
      Alert.alert('Error', 'Failed to update tokens. Please try again.');
    }
  };

  const handlePurchaseTokensCancel = () => {
    setShowPurchaseTokensModal(false);
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

  const performAnalysis = async () => {
    try {
      console.log('Starting analysis process...');
      console.log('Current credits:', credits);
      console.log('Current tokens:', currentTokens);
      
      // Only check credits if we're not using tokens
      if (credits < 10 && currentTokens < 10) {
        console.log('Not enough credits or tokens:', { credits, tokens: currentTokens });
        Alert.alert(
          'Insufficient Credits',
          'You do not have enough credits or tokens to perform an analysis. Please purchase more credits or tokens.'
        );
        return;
      }

      // If using credits, deduct them
      if (credits >= 10) {
        console.log('Attempting to use credits...');
        const hasCredits = await useCredits(10);
        console.log('useCredits result:', hasCredits);
        if (!hasCredits) {
          console.log('useCredits returned false');
          Alert.alert(
            'Insufficient Credits',
            'You do not have enough credits to perform an analysis. Please purchase more credits.'
          );
          return;
        }
        setCredits(prev => prev - 10);
      }

      // Rest of the analysis logic remains the same
      if (!currentProfile.code) {
        console.log('No profile code found');
        Alert.alert(
          'Error',
          'Invalid profile configuration. Please try again or contact support.'
        );
        return;
      }
      console.log('Generating analysis data...');
      const analysis = {
        profileCode: currentProfile.code,
        name: currentProfile.name,
        age: calculateAge(currentProfile.birthDate),
        height: currentProfile.height,
        weight: currentProfile.weight,
        bmi: calculateBMI(currentProfile.weight, currentProfile.height),
        sex: currentProfile.sex,
        date: new Date().toLocaleDateString('en-GB'),
        biomarkers: {
          creatinine: {
            value: Math.floor(Math.random() * 70) + 80,
            referenceValue: 'Adults: 80-150; Children: 20-100',
            interpretation: 'Within normal range'
          },
          glucose: {
            value: Math.floor(Math.random() * 10),
            referenceValue: '< 15',
            interpretation: 'Within normal range'
          },
          albumin: {
            value: Math.floor(Math.random() * 20),
            referenceValue: '< 30',
            interpretation: 'Within normal range'
          },
          nitrites: {
            value: Number((Math.random() * 0.8).toFixed(1)),
            referenceValue: '< 1.0',
            interpretation: 'Within normal range'
          },
          ntProBNP: {
            value: Math.floor(Math.random() * 80),
            referenceValue: '< 100',
            interpretation: 'Within normal range'
          },
          ngal: {
            value: Math.floor(Math.random() * 120),
            referenceValue: '< 150',
            interpretation: 'Within normal range'
          },
          ohDG: {
            value: Number((Math.random() * 4 + 3).toFixed(1)),
            referenceValue: '3.0-7.0',
            interpretation: 'Within normal range'
          },
          mcp1: {
            value: Math.floor(Math.random() * 150),
            referenceValue: '< 200',
            interpretation: 'Within normal range'
          }
        }
      };
      console.log('Saving analysis to CSV file...');
      try {
        console.log('Analysis data to save:', JSON.stringify(analysis, null, 2));
        await addAnalysis(analysis);
        console.log('Analysis saved to CSV file successfully');
      } catch (error) {
        console.error('Error saving analysis to CSV:', error);
        Alert.alert(
          'Error',
          'Failed to save analysis data. Please try again.'
        );
        return;
      }
      console.log('Updating profile last exam date...');
      const updatedProfiles = profiles.map(p => {
        if (p.id === currentProfile.id) {
          const updatedProfile = {
            ...p,
            lastExamDate: analysis.date
          };
          console.log('Updated profile:', updatedProfile);
          return updatedProfile;
        }
        return p;
      });
      console.log('Saving updated profiles...');
      await saveProfiles(updatedProfiles);
      setProfiles(updatedProfiles);
      setCurrentProfile(prev => {
        const updated = {
          ...prev,
          lastExamDate: analysis.date
        };
        console.log('Setting current profile with new lastExamDate:', updated);
        return updated;
      });
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('Current profile after update:', currentProfile);
      console.log('Monitoring score should update to:', calculateMonitoringScore(analysis.date));
      console.log('Reloading credits...');
      const updatedCredits = await loadCredits();
      console.log('Updated credits:', updatedCredits);
      setCredits(updatedCredits);
      await AsyncStorage.setItem('@new_analysis_pending', 'true');
      setShowReportNotification(true);
      Alert.alert(
        'Analysis Complete',
        'Your analysis has been completed successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Navigating to analysis results...');
              router.push({
                pathname: "/(tabs)/analysis/[id]",
                params: { id: currentProfile.id }
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleAnalysis:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      Alert.alert(
        'Error',
        'Failed to perform analysis. Please try again.'
      );
    }
  };

  const handleNutrition = () => {
    Alert.alert('Coming Soon', 'This feature will be available in a future update.');
  };

  const handleDebugStorage = async () => {
    try {
      const storedData = await AsyncStorage.getItem('@analyses_data');
      console.log('Current AsyncStorage data:', storedData);
      
      let formattedData = 'No data';
      if (storedData) {
        const rows = storedData.split('\n');
        formattedData = rows.map((row, index) => {
          if (index === 0) return 'HEADER: ' + row;
          if (index === 1) return 'REFERENCE: ' + row;
          return `Row ${index}: ${row}`;
        }).join('\n\n');
      }
      
      Alert.alert(
        'AsyncStorage Data',
        `Current data: ${storedData ? 'Present' : 'Empty'}`,
        [
          {
            text: 'View Data',
            onPress: () => {
              Alert.alert(
                'Stored Data',
                formattedData,
                [{ text: 'OK' }]
              );
            }
          },
          {
            text: 'Clear Data',
            onPress: async () => {
              await AsyncStorage.removeItem('@analyses_data');
              Alert.alert('Success', 'AsyncStorage data cleared');
              loadData();
            },
            style: 'destructive'
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error accessing AsyncStorage:', error);
      Alert.alert('Error', 'Failed to access AsyncStorage');
    }
  };

  useEffect(() => {
    if (isMedicalDeviceMode) {
      router.push('/(tabs)/classI');
    }
  }, [isMedicalDeviceMode]);

  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showProfileModal}
        onRequestClose={() => setShowProfileModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <View style={[styles.modalContent, { flex: 1, width: '100%', maxWidth: '100%', borderRadius: 0, justifyContent: 'flex-start' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setShowProfileModal(false)}>
                <ArrowLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Profile</Text>
            </View>
            <TouchableOpacity 
              style={styles.addProfileButton}
              onPress={handleAddProfile}>
              <Text style={styles.addProfileButtonText}>+ Add New Profile</Text>
            </TouchableOpacity>
            <ScrollView style={[styles.profileList, { flex: 1 }]} contentContainerStyle={{ paddingBottom: 40 }}>
              {profiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onSelect={handleSelectProfile}
                  onDelete={handleDeleteProfile}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAnalysisConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelAnalysis}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pair with ablute_?</Text>
            <Text style={styles.modalText}>This is the "Longevity package". This exam will cost 10 Credits</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelAnalysis}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmAnalysis}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showOutOfCreditsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleOutOfCreditsNo}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Out of Credits</Text>
            <Text style={styles.modalText}>Looks like you've run out of credits. Use/purchase tokens instead?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleOutOfCreditsNo}
              >
                <Text style={styles.modalButtonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
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
              You need to purchase {tokensNeeded} tokens to perform the analysis.
              Total cost: {tokenCost.toFixed(2)}€
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handlePurchaseTokensCancel}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handlePurchaseTokensConfirm}
              >
                <Text style={styles.modalButtonText}>Purchase</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={() => setShowProfileModal(true)}>
            <Image
              source={{ uri: currentProfile.profilePicture }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.profileName}>{currentProfile.name}</Text>
              <TouchableOpacity 
                onPress={() => router.push({
                  pathname: "/(tabs)/edit-profile",
                  params: { id: currentProfile.id }
                })}
                style={styles.editButton}>
                <Pencil size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.toggleContainer}>
                <Switch
                  value={isMedicalDeviceMode}
                  onValueChange={setIsMedicalDeviceMode}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={isMedicalDeviceMode ? '#007AFF' : '#f4f3f4'}
                  style={styles.toggleSwitch}
                />
                <Text style={styles.toggleLabel}>Medical Device</Text>
              </View>
            </View>
            <View style={styles.profileDetailsContainer}>
              <Text style={styles.profileDetails}>
                Age: {calculateAge(currentProfile.birthDate)} • Height: {currentProfile.height}cm
              </Text>
              <Text style={styles.profileDetails}>
                Weight: {currentProfile.weight}kg • BMI: {currentProfile.bmi}
              </Text>
            </View>
            <Text style={styles.profileCode}>Code: {currentProfile.code}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.creditsBox}
            onPress={() => router.push('/store')}>
            <Text style={styles.creditsText}>{credits}</Text>
            <Text style={styles.creditsLabel}>credits</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={() => router.push('/map')}>
            <MapPin size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.scoreContainer}>
        <Svg height={SVG_SIZE} width={SVG_SIZE}>
          <Path
            d={createArc(CIRCLE_RADIUS, START_ANGLE, START_ANGLE + ANGLE_RANGE)}
            stroke="#333333"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
          />
          
          {createArcSegments(monitoringScore)}
        </Svg>
        
        <View style={styles.scoreTextContainer}>
          <Text style={styles.scoreNumber}>{Math.round(monitoringScore)}%</Text>
          <Text style={styles.scoreLabel}>Monitoring Score</Text>
          <Text style={styles.lastAnalysis}>
            Last Analysis: {currentProfile.lastExamDate === null ? 'N/A' : `${daysSinceAnalysis} ${daysSinceAnalysis === 1 ? 'day' : 'days'} ago`}
          </Text>
        </View>
      </View>

      {/* Perform Analysis Button - styled for web, TouchableOpacity for native */}
      {typeof window !== 'undefined' ? (
        <button
          style={{
            backgroundColor: '#545454',
            color: 'white',
            fontWeight: 'bold',
            fontSize: 15,
            borderRadius: 20,
            padding: 7,
            margin: '0 auto 15px auto',
            display: 'block',
            minWidth: 180,
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
          onClick={handleAnalysis}
        >
          Perform Analysis
        </button>
      ) : (
        <TouchableOpacity
          style={styles.examButton}
          onPress={handleAnalysis}
        >
          <Text style={styles.examButtonText}>
            Perform Analysis
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}
          onPress={() => router.push({
            pathname: '/(tabs)/analysis/[id]',
            params: { id: currentProfile.id }
          })}>
          <Activity size={20} color="#FFFFFF" />
          <Text style={styles.actionText}>Analyses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}
          onPress={() => router.push('/(tabs)/biomarkers')}>
          <Beaker size={20} color="#FFFFFF" />
          <Text style={styles.actionText}>Biomarkers</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push({
            pathname: '/(tabs)/suggestions',
            params: { profileId: currentProfile.id }
          })}>
          <Brain size={20} color="#FFFFFF" />
          <Text style={styles.actionText}>Suggestions</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            if (!currentProfile) {
              Alert.alert('Error', 'No profile selected');
              return;
            }
            const profileData = {
              ...currentProfile,
              settings: {
                ...currentProfile.settings
              }
            };
            router.push({
              pathname: '/settings',
              params: { profile: JSON.stringify(profileData) }
            });
          }}>
          <Settings size={20} color="#FFFFFF" />
          <Text style={styles.actionText}>Settings</Text>
        </TouchableOpacity>
      </View>

      <HealthReportSection currentProfile={currentProfile} showNotification={showReportNotification} />

      <EKGGraph />

      <View style={styles.newsSection}>
        {mockNews.map(news => (
          <TouchableOpacity key={news.id} style={styles.newsCard}>
            <Text style={styles.newsTitle}>{news.title}</Text>
            <Text style={styles.newsSummary} numberOfLines={2}>{news.summary}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.appsSection}>
        <Text style={styles.appsSectionTitle}>Apps Center</Text>
        <View style={styles.appsContainer}>
          <TouchableOpacity 
            style={styles.appButton}
            onPress={() => router.push('/app-store')}>
            <ShoppingBag size={18} color="#A259F7"/>
            <Text style={styles.appButtonText}>Store</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.appButton}
            onPress={handleNutrition}>
            <Apple size={18} color="#FFFFFF" />
            <Text style={styles.appButtonText}>Nutrition</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.appButton}>
            <Pill size={18} color="#FFFFFF" />
            <Text style={styles.appButtonText}>Medication</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.appButton}>
            <ChefHat size={18} color="#FFFFFF" />
            <Text style={styles.appButtonText}>Recipes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.appButton}>
            <Medal size={18} color="#FFFFFF" />
            <Text style={styles.appButtonText}>Fitness</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000014',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 5,
    backgroundColor: '#000014',
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 10,
  },
  profileDetailsContainer: {
    marginBottom: 4,
  },
  profileDetails: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 3,
  },
  profileCode: {
    fontSize: 7,
    color: '#232222',
  },
  editButton: {
    padding: 3,
  },
  mapButton: {
    backgroundColor: '#222222',
    padding: 12,
    borderRadius: 20,
    marginLeft: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditsBox: {
    backgroundColor: '#222222',
    padding: 8,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 60,
  },
  creditsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  creditsLabel: {
    color: '#888888',
    fontSize: 10,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: SVG_SIZE,
    position: 'relative',
    marginTop: -20,
  },
  scoreTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#888888',
    marginVertical: 2,
  },
  lastAnalysis: {
    fontSize: 9,
    color: '#888888',
    marginTop: 2,
  },
  examButton: {
    backgroundColor: '#545454',
    padding: 7,
    marginHorizontal: 150,
    marginTop: -10,
    marginBottom: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  examButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#18182A',
    marginTop: -5,
    marginLeft:15,
    marginRight: 15,
    borderRadius: 10,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    marginTop: 4,
    fontSize: 10,
  },
  healthReportSection: {
    padding: 15,
    marginTop: 5,
    paddingHorizontal: 16,
  },
  healthReportCard: {
    backgroundColor: '#18182A',
    borderRadius: 10,
    padding: 15,
  },
  reportPreviewText: {
    color: '#DDDDDD',
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  newsSection: {
    padding: 15,
    backgroundColor: '#000014',
    marginTop: -5,
  },
  newsCard: {
    backgroundColor: '#18182A',
    padding: 12,
    borderRadius: 10,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  newsSummary: {
    fontSize: 12,
    color: '#888888',
    lineHeight: 16,
  },
  appsSection: {
    padding: 12,
    backgroundColor: '#18182A',
    marginTop: 0,
    borderRadius: 20,
    marginLeft: 15,
    marginRight: 15,
  },
  appsSectionTitle: {
    fontSize: 14,
    color: '#536878',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  appsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  appButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: 5,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#111111',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#A259F7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#222222',
    padding: 10,
    borderRadius: 15,
    marginRight: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  addProfileButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  addProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileList: {
    flex: 1,
  },
  creditsBox: {
    backgroundColor: '#23233B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  creditsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    color: '#00c4cc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  ekgContainer: {
    backgroundColor: '#000014',
    padding: 15,
    marginTop: -15,
    marginBottom: -10,
  },
  ekgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  ekgTitle: {
    color: '#A259F7',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  ekgStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ekgStat: {
    color: '#888888',
    fontSize: 10,
    marginLeft: 15,
    marginRight: 15,
  },
  ekgGraphContainer: {
    height: 80,
    backgroundColor: '#181C23',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#23263A',
    alignSelf: 'center',
  },
  ekgGraph: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  modalText: {
    color: '#FFFFFF',
    fontSize: 10,
    marginBottom: 30,
    alignItems: 'center',
    marginLeft: 20,
    marginRight: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#222222',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333333',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    marginRight: 10,
  },
  toggleLabel: {
    color: '#FFFFFF',
    fontSize: 8,
    marginLeft: 4,
  },
  toggleSwitch: {
    transform: [{ scale: 0.7 }],
  },
});
