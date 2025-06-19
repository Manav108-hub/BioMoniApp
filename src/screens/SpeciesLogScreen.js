// src/screens/SpeciesLogScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ApiService from '../services/api';
import SpeciesDetailsForm from '../components/SpeciesDetailForm';
import QuestionnaireForm from '../components/QuestionnaireForm';

export default function SpeciesLogScreen() {
  const navigation = useNavigation();

  const [species, setSpecies] = useState([]);
  const [speciesImages, setSpeciesImages] = useState({});
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [speciesLogDetails, setSpeciesLogDetails] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const speciesResponse = await ApiService.getSpecies();
      const questionsResponse = await ApiService.getQuestions();
      const imageResponse = await ApiService.makeRequest('/public/species-images');

      const imageMap = {};
      imageResponse.forEach(item => {
        imageMap[item.species_id] = item.photo_path;
      });

      setSpecies(speciesResponse?.species || []);
      setQuestions(questionsResponse?.questions || []);
      setSpeciesImages(imageMap);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      Alert.alert('Error', 'Failed to load form data. Please check your network and backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsSubmit = async (details) => {
    setLoading(true);

    try {
      if (details.new_species_name) {
        const newSpecies = await ApiService.createSpecies(
          details.new_species_name,
          details.new_species_scientific_name || '',
          details.new_species_category || ''
        );

        details.species_id = newSpecies.species.id;
        delete details.new_species_name;
        delete details.new_species_scientific_name;
        delete details.new_species_category;

        const refreshed = await ApiService.getSpecies();
        setSpecies(refreshed?.species || []);
      }

      setSpeciesLogDetails(details);
      setStep(2);
    } catch (error) {
      console.error('Error during species creation or step transition:', error);
      Alert.alert('Error', 'Failed to proceed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionsSubmit = async (answers) => {
    if (!speciesLogDetails) {
      Alert.alert('Error', 'Please complete species details first.');
      return;
    }

    try {
      const payload = {
        species_id: speciesLogDetails.species_id,
        location_name: speciesLogDetails.location_name,
        latitude: speciesLogDetails.latitude,
        longitude: speciesLogDetails.longitude,
        notes: speciesLogDetails.notes,
        image: speciesLogDetails.image,
        answers: answers,
      };

      console.log('Submitting payload:', payload);

      await ApiService.createSpeciesLog(payload);

      Alert.alert('Success', 'Observation logged successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);

      resetForm();
    } catch (error) {
      console.error('Error submitting observation log:', error);
      Alert.alert('Error', 'Failed to submit observation. Please try again.');
    }
  };

  const resetForm = () => {
    setStep(1);
    setSpeciesLogDetails(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading form data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Log Species Observation</Text>
          <Text style={styles.subtitle}>Record your wildlife sighting</Text>
        </View>

        {step === 1 && (
          <SpeciesDetailsForm
            species={species}
            speciesImages={speciesImages}
            onSubmitDetails={handleDetailsSubmit}
            onCancel={() => navigation.goBack()}
          />
        )}

        {step === 2 && (
          <QuestionnaireForm
            questions={questions}
            onSubmitQuestions={handleQuestionsSubmit}
            onBack={() => setStep(1)}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});