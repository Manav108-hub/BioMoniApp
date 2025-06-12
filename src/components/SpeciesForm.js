// components/SpeciesForm.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function SpeciesForm({ species, questions, onSubmit }) {
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [answers, setAnswers] = useState({});
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImagePick = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.error) return;
      if (response.assets && response.assets[0]) {
        setImage(response.assets[0]);
      }
    });
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedSpecies || !locationName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const logData = {
        species_id: parseInt(selectedSpecies, 10),
        location_name: locationName,
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        answers,
        image,
      };

      await onSubmit(logData);

      // Reset form
      setSelectedSpecies('');
      setLocationName('');
      setLatitude('');
      setLongitude('');
      setAnswers({});
      setImage(null);
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'Could not submit observation');
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = (question) => {
    switch (question.question_type) {
      case 'multiple_choice':
        return (
          <View key={question.id} style={styles.questionContainer}>
            <Text style={styles.questionText}>{question.question_text}</Text>
            <View style={styles.optionsContainer}>
              {question.options.map((option, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.optionButton,
                    answers[question.id] === option && styles.selectedOption,
                  ]}
                  onPress={() => handleAnswerChange(question.id, option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      answers[question.id] === option && styles.selectedOptionText,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 'text':
        return (
          <View key={question.id} style={styles.questionContainer}>
            <Text style={styles.questionText}>{question.question_text}</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={3}
              value={answers[question.id] || ''}
              onChangeText={text => handleAnswerChange(question.id, text)}
              placeholder="Enter your answer..."
            />
          </View>
        );
      case 'number':
        return (
          <View key={question.id} style={styles.questionContainer}>
            <Text style={styles.questionText}>{question.question_text}</Text>
            <TextInput
              style={styles.numberInput}
              keyboardType="numeric"
              value={answers[question.id]?.toString() || ''}
              onChangeText={text => handleAnswerChange(question.id, parseInt(text, 10) || 0)}
              placeholder="Enter number..."
            />
          </View>
        );
      case 'yes_no':
        return (
          <View key={question.id} style={styles.questionContainer}>
            <Text style={styles.questionText}>{question.question_text}</Text>
            <View style={styles.yesNoContainer}>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  answers[question.id] === true && styles.selectedYesNo,
                ]}
                onPress={() => handleAnswerChange(question.id, true)}
              >
                <Text
                  style={[
                    styles.yesNoText,
                    answers[question.id] === true && styles.selectedYesNoText,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  answers[question.id] === false && styles.selectedYesNo,
                ]}
                onPress={() => handleAnswerChange(question.id, false)}
              >
                <Text
                  style={[
                    styles.yesNoText,
                    answers[question.id] === false && styles.selectedYesNoText,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Species</Text>
        <View style={styles.speciesContainer}>
          {species.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.speciesButton,
                selectedSpecies === s.id.toString() && styles.selectedSpecies,
              ]}
              onPress={() => setSelectedSpecies(s.id.toString())}
            >
              <Text
                style={[
                  styles.speciesText,
                  selectedSpecies === s.id.toString() && styles.selectedSpeciesText,
                ]}
              >
                {s.common_name}
              </Text>
              <Text style={styles.scientificName}>{s.scientific_name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Location Name</Text>
          <TextInput
            style={styles.input}
            value={locationName}
            onChangeText={setLocationName}
            placeholder="Enter location name"
          />
        </View>
        <View style={[styles.coordinatesRow]}>
          <View style={styles.coordinateField}>
            <Text style={styles.fieldLabel}>Latitude</Text>
            <TextInput
              style={styles.input}
              value={latitude}
              onChangeText={setLatitude}
              keyboardType="numeric"
              placeholder="Latitude"
            />
          </View>
          <View style={styles.coordinateField}>
            <Text style={styles.fieldLabel}>Longitude</Text>
            <TextInput
              style={styles.input}
              value={longitude}
              onChangeText={setLongitude}
              keyboardType="numeric"
              placeholder="Longitude"
            />
          </View>
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Photo</Text>
        <TouchableOpacity style={styles.imageButton} onPress={handleImagePick}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.selectedImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name="photo-camera" size={30} color="#666" />
              <Text style={styles.imageButtonText}>Pick an image</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Observation Details</Text>
        {questions.map(renderQuestion)}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitButtonText}>Submit Observation</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  fieldContainer: { marginBottom: 20 },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  speciesContainer: { gap: 10 },
  speciesButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
  },
  selectedSpecies: {
    borderColor: '#2e7d32',
    backgroundColor: '#e8f5e8',
  },
  speciesText: { fontSize: 16, fontWeight: '500', color: '#333' },
  selectedSpeciesText: { color: '#2e7d32' },
  scientificName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 2,
  },
  coordinatesRow: { flexDirection: 'row', gap: 15 },
  coordinateField: { flex: 1 },
  imageButton: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  imagePlaceholder: { alignItems: 'center' },
  imageButtonText: {
    marginTop: 8,
    color: '#666',
    fontSize: 16,
  },
  selectedImage: { width: 100, height: 100, borderRadius: 8 },
  questionContainer: { marginBottom: 25 },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  optionsContainer: { gap: 8 },
  optionButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  selectedOption: {
    borderColor: '#2e7d32',
    backgroundColor: '#e8f5e8',
  },
  optionText: { fontSize: 14, color: '#333' },
  selectedOptionText: {
    color: '#2e7d32',
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  yesNoContainer: { flexDirection: 'row', gap: 15 },
  yesNoButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  selectedYesNo: {
    borderColor: '#2e7d32',
    backgroundColor: '#e8f5e8',
  },
  yesNoText: { fontSize: 16, color: '#333' },
  selectedYesNoText: {
    color: '#2e7d32',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#2e7d32',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 15,
    marginBottom: 30,
  },
  disabledButton: { opacity: 0.6 },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
