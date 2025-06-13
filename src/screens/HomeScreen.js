import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import ApiService from '../services/api';
import {removeToken, getToken} from '../utils/storage';
import RNFS from 'react-native-fs';
import {useNavigation} from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const profileData = await ApiService.getProfile();
      setProfile(profileData.user);
      setIsAdmin(profileData.user?.is_admin || false);

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
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await removeToken();
        },
      },
    ]);
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs storage permission to download the CSV file.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    return true;
  };

  const handleDownloadCsv = async () => {
    try {
      const hasPermission = await requestStoragePermission();

      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Cannot download CSV without storage permission.',
        );
        return;
      }

      Alert.alert(
        'Download All Logs',
        'This will download a CSV file containing all species logs. Continue?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Download',
            onPress: async () => {
              try {
                const token = await getToken();
                const baseUrl = ApiService.BASE_URL;
                const csvEndpoint = `${baseUrl}/admin/export-csv`;

                const rawResponse = await fetch(csvEndpoint, {
                  method: 'GET',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'text/csv',
                  },
                });

                if (!rawResponse.ok) {
                  let errorBody = await rawResponse.text();
                  try {
                    const errorJson = JSON.parse(errorBody);
                    errorBody =
                      errorJson.detail || errorJson.message || errorBody;
                  } catch (e) {}
                  throw new Error(
                    `Server responded with status ${rawResponse.status}: ${errorBody}`,
                  );
                }

                const csvContent = await rawResponse.text();

                const fileName = `biodiversity_logs_${new Date()
                  .toISOString()
                  .slice(0, 10)}.csv`;
                const path = Platform.select({
                  ios: `${RNFS.DocumentDirectoryPath}/${fileName}`,
                  android: `${RNFS.DownloadDirectoryPath}/${fileName}`,
                });

                await RNFS.writeFile(path, csvContent, 'utf8');

                Alert.alert('Download Complete', `CSV saved to: ${path}`);
              } catch (downloadError) {
                console.error('Error during CSV download:', downloadError);
                Alert.alert(
                  'Download Failed',
                  downloadError.message || 'Failed to download CSV.',
                );
              }
            },
          },
        ],
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
      }>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.usernameText}>{profile?.username}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <FontAwesome5 name="sign-out-alt" size={24} color="#2e7d32" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <FontAwesome5 name="clipboard-list" size={32} color="#2e7d32" />
            <Text style={styles.statNumber}>{stats?.total_logs || 0}</Text>
            <Text style={styles.statLabel}>Total Observations</Text>
          </View>
          <View style={styles.statCard}>
            <FontAwesome5 name="paw" size={32} color="#2e7d32" />
            <Text style={styles.statNumber}>{stats?.unique_species || 0}</Text>
            <Text style={styles.statLabel}>Species Logged</Text>
          </View>
        </View>
      </View>

      {isAdmin && (
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>Admin Actions</Text>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleDownloadCsv}>
            <FontAwesome5 name="file-download" size={40} color="#2e7d32" />
            <Text style={styles.actionText}>Download All Logs (CSV)</Text>
            <Text style={styles.actionSubtext}>
              Export all observation data
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Log Species')}>
          <FontAwesome5 name="plus-circle" size={40} color="#2e7d32" />
          <Text style={styles.actionText}>Log New Species</Text>
          <Text style={styles.actionSubtext}>Record a new observation</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('History')}>
          <FontAwesome5 name="history" size={40} color="#2e7d32" />
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
    shadowOffset: {width: 0, height: 2},
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
    shadowOffset: {width: 0, height: 2},
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
  adminSection: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderColor: '#ffc107',
    borderWidth: 1,
  },
});
