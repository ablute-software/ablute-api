import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { biomarkers } from '../../data/profiles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function BiomarkersScreen() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <TouchableOpacity
        style={{ margin: 16, padding: 8, backgroundColor: '#222', borderRadius: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' }}
        onPress={() => history.back()}
      >
        <ArrowLeft size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', alignSelf: 'center', marginBottom: 16 }}>Biomarkers</Text>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {biomarkers.map((marker, idx) => (
          <View key={marker.id} style={{ marginHorizontal: 10, marginBottom: 18 }}>
            <TouchableOpacity
              style={[styles.collapseHeader, expanded === idx && styles.collapseHeaderExpanded]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setExpanded(expanded === idx ? null : idx);
              }}
            >
              <Text style={styles.collapseHeaderText}>{marker.name}</Text>
              <Text style={styles.collapseHeaderArrow}>{expanded === idx ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {expanded === idx && (
              <View style={styles.markerDetails}>
                <Text style={styles.markerLabel}>Description:</Text>
                <Text style={styles.markerValue}>{marker.description}</Text>
                <Text style={styles.markerLabel}>Normal Range:</Text>
                <Text style={styles.markerValue}>{marker.normalRange}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  collapseHeader: {
    backgroundColor: '#181c3a',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapseHeaderExpanded: {
    backgroundColor: '#23275a',
  },
  collapseHeaderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  collapseHeaderArrow: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 12,
  },
  markerDetails: {
    backgroundColor: '#f9eaea',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: '#d1d1d1',
  },
  markerLabel: {
    color: '#181c3a',
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 8,
  },
  markerValue: {
    color: '#181c3a',
    fontSize: 15,
    marginBottom: 4,
  },
}); 