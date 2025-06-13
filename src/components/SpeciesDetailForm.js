// src/components/SpeciesDetailsForm.js
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
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Geolocation from 'react-native-geolocation-service';

export default function SpeciesDetailsForm({ species, onSubmitDetails, onCancel }) {
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(''); // Stores ID of existing species
  const [useNewSpecies, setUseNewSpecies] = useState(false); // Toggle for new species input
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

  const handleImagePick = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.error) { return; }
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
            message: 'This app needs access to your location to automatically log coordinates.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          // Permission granted
        } else {
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
      Alert.alert('Location Error', 'An error occurred while getting location.');
      setLocationLoading(false);
    }
  };

  const handleNext = async () => {
    // Validate based on whether adding new species or selecting existing
    if (useNewSpecies) {
      if (!newSpeciesCommonName || !newSpeciesCategory || !locationName) {
        Alert.alert('Error', 'Please fill in New Species Common Name, Category, and Location Name.');
        return;
      }
    } else { // Using existing species
      if (!selectedSpeciesId || !locationName) {
        Alert.alert('Error', 'Please select an existing species and fill in the Location Name.');
        return;
      }
    }

    setLoading(true); // Start loading indicator for this component's submission
    try {
        const details = {
            location_name: locationName,
            latitude: parseFloat(latitude) || 0,
            longitude: parseFloat(longitude) || 0,
            notes: notes,
            image: image,
        };

        if (useNewSpecies) {
            details.new_species_name = newSpeciesCommonName;
            details.new_species_scientific_name = newSpeciesScientificName;
            details.new_species_category = newSpeciesCategory;
        } else {
            details.species_id = parseInt(selectedSpeciesId, 10);
        }

        onSubmitDetails(details); // Pass all details to the parent screen
    } finally {
        setLoading(false); // Stop loading indicator regardless of success/failure
    }
  };

  return (
    <View style={styles.container}>
      {/* Species Selection/Creation Section */}
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
              Select Existing Species
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, useNewSpecies && styles.toggleButtonActive]}
            onPress={() => {
              setUseNewSpecies(true);
              setSelectedSpeciesId('');
            }}>
            <Text style={[styles.toggleButtonText, useNewSpecies && styles.toggleButtonTextActive]}>
              Add New Species
            </Text>
          </TouchableOpacity>
        </View>

        {useNewSpecies ? (
          <View style={styles.newSpeciesInputContainer}>
            <Text style={styles.fieldLabel}>Common Name*</Text>
            <TextInput
              style={styles.input}
              value={newSpeciesCommonName}
              onChangeText={setNewSpeciesCommonName}
              placeholder="e.g., Bengal Tiger"
            />
            <Text style={styles.fieldLabel}>Scientific Name</Text>
            <TextInput
              style={styles.input}
              value={newSpeciesScientificName}
              onChangeText={setNewSpeciesScientificName}
              placeholder="e.g., Panthera tigris tigris"
            />
            <Text style={styles.fieldLabel}>Category*</Text>
            <TextInput
              style={styles.input}
              value={newSpeciesCategory}
              onChangeText={setNewSpeciesCategory}
              placeholder="e.g., Mammal, Reptile, Bird"
            />
          </View>
        ) : (
          <View style={styles.speciesContainer}>
            {species.length > 0 ? (
              species.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.speciesButton,
                    selectedSpeciesId === s.id.toString() && styles.selectedSpecies,
                  ]}
                  onPress={() => setSelectedSpeciesId(s.id.toString())}
                >
                  <Text
                    style={[
                      styles.speciesText,
                      selectedSpeciesId === s.id.toString() && styles.selectedSpeciesText,
                    ]}
                  >
                    {s.common_name}
                  </Text>
                  <Text style={styles.scientificName}>{s.scientific_name}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noDataText}>No existing species available. Try adding a new one.</Text>
            )}
          </View>
        )}
      </View>

      {/* Location Details Section */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Location Details</Text>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Location Name*</Text>
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
        <TouchableOpacity
          style={[styles.locationButton, locationLoading && styles.disabledButton]}
          onPress={handleGetLocation}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="my-location" size={20} color="#fff" />
              <Text style={styles.locationButtonText}>Get Current Location</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Additional Notes Section */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Additional Notes</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any additional observations or notes..."
        />
      </View>

      {/* Photo Section */}
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
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitButtonText}>Continue to Questions</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0, backgroundColor: '#f5f5f5' },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    marginHorizontal: 15,
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
    borderColor: '#ddd', // Default border color
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
  },
  selectedSpecies: {
    borderColor: '#2e7d32',
    backgroundColor: '#e8f5e8',
    borderWidth: 2, // Highlight selected
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
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
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
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  noDataText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  toggleButtonActive: {
    backgroundColor: '#2e7d32',
  },
  toggleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  newSpeciesInputContainer: {
    marginTop: 10,
  },
});
