import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { MapPin } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';

export default function MapScreen() {
  const mapUrl = 'https://www.google.com/maps/d/u/0/edit?mid=1VWxrwQIcG2CA2ri9iElJ0iIEuPMbQIs&usp=sharing';

  // Automatically open the map when the screen loads
  useEffect(() => {
    openMap();
  }, []);

  const openMap = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web platform, open in new tab
        window.open(mapUrl, '_blank', 'noopener,noreferrer');
      } else {
        // For mobile platforms, try to open in Google Maps app first
        const mapsUrl = `googlemaps://maps.google.com/maps?mid=1VWxrwQIcG2CA2ri9iElJ0iIEuPMbQIs`;
        const supported = await Linking.canOpenURL(mapsUrl);
        
        if (supported) {
          await Linking.openURL(mapsUrl);
        } else {
          // Fallback to browser if Google Maps app is not installed
          await Linking.openURL(mapUrl);
        }
      }
    } catch (error) {
      console.error("Error opening map:", error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.mapButton} onPress={openMap}>
        <MapPin size={24} color="#FFFFFF" />
        <Text style={styles.mapButtonText}>Open Map</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222222',
    padding: 15,
    borderRadius: 10,
  },
  mapButtonText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
  },
}); 