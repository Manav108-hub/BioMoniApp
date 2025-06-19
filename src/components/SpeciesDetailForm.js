// src/components/SpeciesDetailsForm.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  ScrollView,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Geolocation from 'react-native-geolocation-service';
import ApiService from '../services/api';

export default function SpeciesDetailsForm({ species, onSubmitDetails, onCancel }) {
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('');
  const [useNewSpecies, setUseNewSpecies] = useState(false);
  const [newSpeciesCommonName, setNewSpeciesCommonName] = useState('');
  const [newSpeciesScientificName, setNewSpeciesScientificName] = useState('');
  const [newSpeciesCategory, setNewSpeciesCategory] = useState('');

  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [speciesImages, setSpeciesImages] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await ApiService.makeRequest('/public/species-images');
        const imageMap = {};
        res.forEach(item => {
          if (item.species_id && item.photo_path) {
            imageMap[item.species_id] = item.photo_path;
          }
        });
        setSpeciesImages(imageMap);
      } catch (error) {
        console.error('Error fetching species images:', error);
      }
    })();
  }, []);

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

  const handleGetLocation = async () => {
    setLocationLoading(true);
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Location permission denied.');
          setLocationLoading(false);
          return;
        }
      }

      Geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
          setLocationLoading(false);
        },
        (error) => {
          Alert.alert('Location Error', error.message);
          console.error('Location Error:', error);
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (err) {
      console.warn(err);
      Alert.alert('Location Error', 'Error getting location.');
      setLocationLoading(false);
    }
  };

  const handleNext = async () => {
    if (useNewSpecies) {
      if (!newSpeciesCommonName || !newSpeciesCategory || !locationName) {
        Alert.alert('Error', 'Fill New Species Common Name, Category, and Location Name.');
        return;
      }
    } else {
      if (!selectedSpeciesId || !locationName) {
        Alert.alert('Error', 'Select a species and fill Location Name.');
        return;
      }
    }

    setLoading(true);
    try {
      const details = {
        location_name: locationName,
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        notes,
        image,
      };

      if (useNewSpecies) {
        details.new_species_name = newSpeciesCommonName;
        details.new_species_scientific_name = newSpeciesScientificName;
        details.new_species_category = newSpeciesCategory;
      } else {
        details.species_id = parseInt(selectedSpeciesId, 10);
      }

      onSubmitDetails(details);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Species</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, !useNewSpecies && styles.toggleButtonActive]}
            onPress={() => {
              setUseNewSpecies(false);
              setNewSpeciesCommonName('');
              setNewSpeciesScientificName('');
              setNewSpeciesCategory('');
            }}>
            <Text style={[styles.toggleButtonText, !useNewSpecies && styles.toggleButtonTextActive]}>
              Select Existing
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, useNewSpecies && styles.toggleButtonActive]}
            onPress={() => {
              setUseNewSpecies(true);
              setSelectedSpeciesId('');
            }}>
            <Text style={[styles.toggleButtonText, useNewSpecies && styles.toggleButtonTextActive]}>
              Add New
            </Text>
          </TouchableOpacity>
        </View>

        {useNewSpecies ? (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Common Name*"
              value={newSpeciesCommonName}
              onChangeText={setNewSpeciesCommonName}
            />
            <TextInput
              style={styles.input}
              placeholder="Scientific Name"
              value={newSpeciesScientificName}
              onChangeText={setNewSpeciesScientificName}
            />
            <TextInput
              style={styles.input}
              placeholder="Category*"
              value={newSpeciesCategory}
              onChangeText={setNewSpeciesCategory}
            />
          </View>
        ) : (
          <View>
            {species.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.speciesButton, selectedSpeciesId === s.id.toString() && styles.selectedSpecies]}
                onPress={() => setSelectedSpeciesId(s.id.toString())}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {speciesImages[s.id] && (
                    <Image source={{ uri: speciesImages[s.id] }} style={styles.speciesThumb} />
                  )}
                  <View>
                    <Text style={styles.speciesText}>{s.name}</Text>
                    <Text style={styles.scientificName}>{s.scientific_name}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Location Name*"
          value={locationName}
          onChangeText={setLocationName}
        />
        <View style={styles.coordinatesRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="Latitude"
            value={latitude}
            onChangeText={setLatitude}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Longitude"
            value={longitude}
            onChangeText={setLongitude}
            keyboardType="numeric"
          />
        </View>
        <TouchableOpacity
          style={[styles.locationButton, locationLoading && styles.disabledButton]}
          onPress={handleGetLocation}
          disabled={locationLoading}
        >
          {locationLoading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Icon name="my-location" size={20} color="#fff" />
              <Text style={styles.locationButtonText}>Get Location</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.textInput}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Observation notes..."
        />
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

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.disabledButton]}
        onPress={handleNext}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Continue</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  formSection: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fff',
    height: 100,
    textAlignVertical: 'top',
  },
  coordinatesRow: { flexDirection: 'row', marginBottom: 10 },
  locationButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 6,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  imageButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: { alignItems: 'center' },
  imageButtonText: { color: '#888', marginTop: 5 },
  selectedImage: { width: 100, height: 100, borderRadius: 6 },
  submitButton: {
    backgroundColor: '#2e7d32',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: { color: '#fff', fontSize: 18 },
  disabledButton: { opacity: 0.6 },
  toggleContainer: { flexDirection: 'row', marginBottom: 10 },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  toggleButtonActive: {
    backgroundColor: '#2e7d32',
  },
  toggleButtonText: { fontSize: 14, color: '#333' },
  toggleButtonTextActive: { color: '#fff', fontWeight: 'bold' },
  speciesButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  selectedSpecies: {
    borderColor: '#2e7d32',
    backgroundColor: '#e0f2f1',
  },
  speciesText: { fontSize: 16, fontWeight: 'bold' },
  scientificName: { fontStyle: 'italic', color: '#555' },
  speciesThumb: { width: 50, height: 50, marginRight: 10, borderRadius: 6 },
});
