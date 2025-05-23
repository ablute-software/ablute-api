import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Image,
} from 'react-native';
import { ProfileFormData } from '../types/profile';
import { calculateBMI, imperialToMetric, metricToImperial } from '../utils/calculations';

interface ProfileFormProps {
  onSubmit: (data: ProfileFormData) => void;
}

const MAX_HEIGHT_CM = 280;
const MAX_HEIGHT_INCHES = Number((MAX_HEIGHT_CM * 0.393701).toFixed(1)); // Convert 280 cm to inches

export default function ProfileForm({ onSubmit }: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    birthDate: '',
    height: 0,
    weight: 0,
    profilePicture: '',
    useImperial: false,
    code: '',
    sex: 'Female', // Default to Female
  });

  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [heightError, setHeightError] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleHeightChange = (text: string) => {
    const value = parseFloat(text) || 0;
    const maxHeight = formData.useImperial ? MAX_HEIGHT_INCHES : MAX_HEIGHT_CM;
    
    if (value > maxHeight) {
      setHeightError(`Maximum height is ${maxHeight} ${formData.useImperial ? 'inches' : 'cm'}`);
      setFormData({ ...formData, height: maxHeight });
    } else {
      setHeightError('');
      setFormData({ ...formData, height: value });
    }
  };

  const validateBirthDate = (date: string) => {
    // Check format DD/MM/YYYY
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(date)) {
      setBirthDateError('Birth date must be in DD/MM/YYYY format');
      return false;
    }
    const [day, month, year] = date.split('/').map(Number);
    const birth = new Date(year, month - 1, day);
    const now = new Date();
    if (birth > now) {
      setBirthDateError('Birth date cannot be in the future');
      return false;
    }
    const minYear = now.getFullYear() - 120;
    if (year < minYear) {
      setBirthDateError('Birth date is too far in the past');
      return false;
    }
    // Calendar validation
    const daysInMonth = [31, (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month < 1 || month > 12) {
      setBirthDateError('Invalid month');
      return false;
    }
    if (day < 1 || day > daysInMonth[month - 1]) {
      setBirthDateError(`Invalid day for the selected month/year`);
      return false;
    }
    if (birth.getDate() !== day || birth.getMonth() !== month - 1 || birth.getFullYear() !== year) {
      setBirthDateError('Invalid birth date');
      return false;
    }
    setBirthDateError('');
    return true;
  };

  const handleSubmit = () => {
    if (heightError) {
      return; // Don't submit if there's a height error
    }
    const birthDate = `${birthDay.padStart(2, '0')}/${birthMonth.padStart(2, '0')}/${birthYear}`;
    if (!validateBirthDate(birthDate)) {
      return; // Don't submit if birth date is invalid
    }
    const data = { 
      ...formData,
      birthDate,
    };
    if (formData.useImperial) {
      data.height = imperialToMetric.height(formData.height);
      data.weight = imperialToMetric.weight(formData.weight);
    }
    onSubmit(data);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setFormData({ ...formData, profilePicture: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Enter name"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sex</Text>
        <View style={styles.sexContainer}>
          <TouchableOpacity
            style={[
              styles.sexButton,
              formData.sex === 'Female' && styles.sexButtonSelected
            ]}
            onPress={() => setFormData({ ...formData, sex: 'Female' })}>
            <Text style={[
              styles.sexButtonText,
              formData.sex === 'Female' && styles.sexButtonTextSelected
            ]}>Female</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sexButton,
              formData.sex === 'Male' && styles.sexButtonSelected
            ]}
            onPress={() => setFormData({ ...formData, sex: 'Male' })}>
            <Text style={[
              styles.sexButtonText,
              formData.sex === 'Male' && styles.sexButtonTextSelected
            ]}>Male</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Birth Date</Text>
        <View style={styles.dateContainer}>
          <TextInput
            style={styles.dateInput}
            value={birthDay}
            onChangeText={(text) => {
              if (text.length <= 2 && /^\d*$/.test(text)) {
                setBirthDay(text);
              }
            }}
            placeholder="dd"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={2}
          />
          <Text style={styles.dateSeparator}>/</Text>
          <TextInput
            style={styles.dateInput}
            value={birthMonth}
            onChangeText={(text) => {
              if (text.length <= 2 && /^\d*$/.test(text)) {
                setBirthMonth(text);
              }
            }}
            placeholder="mm"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={2}
          />
          <Text style={styles.dateSeparator}>/</Text>
          <TextInput
            style={[styles.dateInput, styles.yearInput]}
            value={birthYear}
            onChangeText={(text) => {
              if (text.length <= 4 && /^\d*$/.test(text)) {
                setBirthYear(text);
              }
            }}
            placeholder="yyyy"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
        {birthDateError ? <Text style={styles.errorText}>{birthDateError}</Text> : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Profile Photo</Text>
        {image && (
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <Image source={{ uri: image }} style={{ width: 100, height: 100, borderRadius: 50 }} />
          </View>
        )}
        {/* Hidden file input for web */}
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => fileInputRef.current?.click()}
        >
          <Text style={styles.buttonText}>{image ? 'Change Photo' : 'Import Photo'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Profile Code (Optional)</Text>
        <TextInput
          style={styles.input}
          value={formData.code}
          onChangeText={(text) => setFormData({ ...formData, code: text })}
          placeholder="Enter profile code to import"
        />
      </View>

      <View style={styles.systemToggle}>
        <Text style={styles.label}>Use Imperial System</Text>
        <Switch
          value={formData.useImperial}
          onValueChange={(value) => setFormData({ ...formData, useImperial: value })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Height ({formData.useImperial ? 'inches' : 'centimeters'})
        </Text>
        <TextInput
          style={[styles.input, heightError ? styles.inputError : null]}
          value={formData.height.toString()}
          onChangeText={handleHeightChange}
          keyboardType="numeric"
          placeholder={`Enter height in ${formData.useImperial ? 'inches' : 'centimeters'}`}
        />
        {heightError ? <Text style={styles.errorText}>{heightError}</Text> : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Weight ({formData.useImperial ? 'pounds' : 'kg'})
        </Text>
        <TextInput
          style={styles.input}
          value={formData.weight.toString()}
          onChangeText={(text) => setFormData({ ...formData, weight: parseFloat(text) || 0 })}
          keyboardType="numeric"
          placeholder={`Enter weight in ${formData.useImperial ? 'pounds' : 'kg'}`}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Create Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#4a4a4a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    width: 60,
    textAlign: 'center',
  },
  yearInput: {
    width: 80,
  },
  dateSeparator: {
    fontSize: 20,
    marginHorizontal: 8,
    color: '#4a4a4a',
  },
  systemToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sexContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sexButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  sexButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sexButtonText: {
    fontSize: 16,
    color: '#4a4a4a',
  },
  sexButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
  },
});