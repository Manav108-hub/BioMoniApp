import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import SpeciesForm from '../components/SpeciesForm';
import ApiService from '../services/api';

export default function SpeciesLogScreen() {
  const [species, setSpecies] = useState([]);
  const [questions, setQuestions] = useState([]);    // <-- array state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { species: speciesArray }   = await ApiService.getSpecies();
      const { questions: questionsArr } = await ApiService.getQuestions();
      setSpecies(speciesArray);
      setQuestions(questionsArr);       // <-- set the array
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (logData) => {
    try {
      await ApiService.createSpeciesLog(logData);
      Alert.alert('Success', 'Species observation logged successfully!');
    } catch (error) {
      console.error('Error submitting log:', error);
      Alert.alert('Error', 'Failed to submit observation');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading form...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Log Species Observation</Text>
          <Text style={styles.subtitle}>Record your wildlife sighting</Text>
        </View>
        
        <SpeciesForm
          species={species}
          questions={questions}
          onSubmit={handleSubmit}
        />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});
