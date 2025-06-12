import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LoginForm from '../components/LoginForm';
import ApiService from '../services/api';
import { saveToken, saveUser } from '../utils/storage';

export default function LoginScreen({ onLogin }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (username, password) => {
    setLoading(true);
    try {
      const response = await ApiService.login(username, password);
      await saveToken(response.access_token);

      const profile = await ApiService.getProfile();
      await saveUser(profile);

      Alert.alert('Success', 'Logged in successfully!');
      onLogin();
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (username, email, password, adminSecret) => {
    setLoading(true);
    try {
      await ApiService.register(username, email, password, adminSecret);
      Alert.alert('Success', 'Account created successfully! Please login.');
    } catch (error) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Biodiversity Tracker</Text>
          <Text style={styles.subtitle}>
            Log and explore wildlife observations
          </Text>
        </View>

        <LoginForm
          onLogin={handleLogin}
          onRegister={handleRegister}
          loading={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: { alignItems: 'center', marginBottom: 40 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 10,
  },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
});
