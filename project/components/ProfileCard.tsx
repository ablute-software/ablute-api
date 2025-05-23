import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { Trash2, Pencil } from 'lucide-react-native';
import { Profile } from '../types/profile';
import { calculateBMI, calculateAge } from '../utils/calculations';
import { router } from 'expo-router';

interface ProfileCardProps {
  profile: Profile;
  onSelect: (profile: Profile) => void;
  onDelete?: (profile: Profile) => void;
}

export default function ProfileCard({ profile, onSelect, onDelete }: ProfileCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Debug log to inspect profile data
  console.log('ProfileCard profile:', profile);

  const handleSelect = () => {
    onSelect(profile);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete(profile);
    }
    setShowDeleteModal(false);
  };
  
  // Calculate age from birthDate
  const age = calculateAge(profile.birthDate);
  
  // Use stored BMI or calculate it if not available
  const bmi = profile.bmi || calculateBMI(profile.weight, profile.height);
  const bmiValue = Number(bmi);
  const bmiDisplay = !isNaN(bmiValue) && bmiValue > 0 ? bmiValue.toFixed(1) : 'N/A';
  const bmiCategory = !isNaN(bmiValue) && bmiValue > 0 ? getBMICategory(bmiValue) : '';

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={handleSelect}>
        <Image
          source={{ uri: profile.profilePicture }}
          style={styles.profileImage}
        />
        <View style={styles.infoContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.name}>{profile.name}</Text>
            {onDelete && (
              <TouchableOpacity 
                style={styles.deleteIconButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}>
                <Trash2 size={16} color="#666" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.sex}>{profile.sex}</Text>
          <Text style={styles.info}>Age: {age} years</Text>
            <Text style={styles.info}>Height: {(profile.height / 100).toFixed(2)}m</Text>
          <Text style={styles.info}>Weight: {profile.weight}kg</Text>
            <Text style={styles.info}>BMI: {bmiDisplay}{bmiCategory ? ` (${bmiCategory})` : ''}</Text>
          </View>
          <Text style={styles.date}>
            Last Analysis: {profile.lastExamDate === null ? 'N/A' : profile.lastExamDate}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Profile</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete {profile.name}'s profile? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDelete}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  deleteIconButton: {
    padding: 4,
  },
  detailsContainer: {
    marginBottom: 8,
  },
  sex: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  info: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#999999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000000',
  },
  modalText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});