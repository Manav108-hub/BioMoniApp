import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform, // Import Platform for OS-specific file saving
  PermissionsAndroid, // For Android permissions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ApiService from '../services/api';
import { removeToken, getToken } from '../utils/storage'; // Import getToken for CSV download auth
import RNFS from 'react-native-fs'; // Import react-native-fs for file operations
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook

export default function HomeScreen() {
  const navigation = useNavigation(); // Get the navigation object
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // New state for admin status

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch profile first, as it contains admin status
      const profileData = await ApiService.getProfile();
      setProfile(profileData.user); // Assuming backend returns {"user": {...}}
      setIsAdmin(profileData.user?.is_admin || false); // Set admin status based on profile data

      // Fetch stats after profile
      const statsData = await ApiService.getStats();
      setStats(statsData);

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await removeToken();
            // The app will automatically navigate to login screen
            // due to the authentication check in App.js (in App.js's useEffect)
          },
        },
      ]
    );
  };

  const handleDownloadCsv = async () => {
    try {
      if (Platform.OS === 'android') {
        // Request storage permission for Android
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'This app needs access to your storage to download the CSV.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Cannot download CSV without storage permission.');
          return;
        }
      }

      Alert.alert(
        "Download All Logs",
        "This will download a CSV file containing all species logs. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Download",
            onPress: async () => {
              try {
                const token = await getToken(); // Get token for authorization
                const baseUrl = ApiService.BASE_URL; // Access BASE_URL from ApiService
                const csvEndpoint = `${baseUrl}/admin/export-csv`; // Your backend CSV endpoint

                const rawResponse = await fetch(csvEndpoint, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`, // Include the authorization token
                    'Accept': 'text/csv', // Tell the server we prefer CSV
                  }
                });

                if (!rawResponse.ok) {
                  // Attempt to parse error message if available, otherwise use status
                  let errorBody = await rawResponse.text();
                  try {
                      const errorJson = JSON.parse(errorBody);
                      errorBody = errorJson.detail || errorJson.message || errorBody;
                  } catch (e) {
                      // Fallback to raw text if not JSON
                  }
                  throw new Error(`Server responded with status ${rawResponse.status}: ${errorBody}`);
                }

                const csvContent = await rawResponse.text(); // Get the raw CSV content

                const fileName = `biodiversity_logs_${new Date().toISOString().slice(0,10)}.csv`;
                const path = Platform.select({
                  ios: `${RNFS.DocumentDirectoryPath}/${fileName}`,
                  android: `${RNFS.DownloadDirectoryPath}/${fileName}`, // Use DownloadDirectoryPath for Android
                });

                // Write the CSV content to the file
                await RNFS.writeFile(path, csvContent, 'utf8');

                Alert.alert('Download Complete', `CSV saved to: ${path}`);
              } catch (downloadError) {
                console.error('Error during CSV download:', downloadError);
                Alert.alert('Download Failed', downloadError.message || 'Failed to download CSV.');
              }
            }
          }
        ]
      );
    } catch (permissionError) {
      console.error('Storage permission error:', permissionError);
      Alert.alert('Permission Error', 'Failed to get storage permission.');
    }
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.usernameText}>{profile?.username}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#2e7d32" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="visibility" size={32} color="#2e7d32" />
            <Text style={styles.statNumber}>{stats?.total_logs || 0}</Text>
            <Text style={styles.statLabel}>Total Observations</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="pets" size={32} color="#2e7d32" />
            <Text style={styles.statNumber}>{stats?.unique_species || 0}</Text>
            <Text style={styles.statLabel}>Species Logged</Text>
          </View>
        </View>
      </View>

      {/* NEW: Admin Download Button - Conditionally rendered */}
      {isAdmin && (
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>Admin Actions</Text>
          <TouchableOpacity style={styles.actionCard} onPress={handleDownloadCsv}>
            <Icon name="file-download" size={40} color="#2e7d32" />
            <Text style={styles.actionText}>Download All Logs (CSV)</Text>
            <Text style={styles.actionSubtext}>Export all observation data</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Log Species')} // Navigate to Log Species screen
        >
          <Icon name="add-circle" size={40} color="#2e7d32" />
          <Text style={styles.actionText}>Log New Species</Text>
          <Text style={styles.actionSubtext}>Record a new observation</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('History')} // Navigate to History screen
        >
          <Icon name="history" size={40} color="#2e7d32" />
          <Text style={styles.actionText}>View History</Text>
          <Text style={styles.actionSubtext}>Browse past observations</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  usernameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  logoutButton: {
    padding: 10,
  },
  statsContainer: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
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
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  quickActions: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 10,
  },
  actionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 15,
    flex: 1,
  },
  actionSubtext: {
    fontSize: 12,
    color: '#666',
    marginLeft: 15,
    flex: 1,
  },
  adminSection: { // NEW STYLE FOR ADMIN SECTION
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderColor: '#ffc107', // Highlight for admin section
    borderWidth: 1,
  }
});
