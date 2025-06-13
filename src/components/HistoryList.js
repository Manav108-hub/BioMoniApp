// components/HistoryList.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function HistoryList({ logs }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year:   'numeric',
      month:  'short',
      day:    'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    });
  };

  const handleLogPress = (log) => {
    // answers is an array of objects: { question_text, answer_text, … }
    const answersArray = Array.isArray(log.answers) ? log.answers : [];
    const answersText = answersArray
      .map(a => `• ${a.question_text}: ${a.answer_text}`)
      .join('\n');

    Alert.alert(
      'Observation Details',
      `Species: ${log.species_name || 'Unknown'}\n` +
      `Location: ${log.location_name || 'N/A'}\n` +
      `Date: ${formatDate(log.created_at)}\n\n` +
      `Answers:\n${answersText}`,
      [{ text: 'OK' }]
    );
  };

  if (!Array.isArray(logs) || logs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="search-off" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No observations yet</Text>
        <Text style={styles.emptySubtext}>
          Start logging species to see your history here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {logs.map((log) => (
        <TouchableOpacity
          key={log.id}
          style={styles.logCard}
          onPress={() => handleLogPress(log)}
        >
          <View style={styles.logContent}>
            <View style={styles.logHeader}>
              <Text style={styles.speciesName}>
                {log.species_name || 'Unknown'}
              </Text>
              <Text style={styles.scientificName}>
                {log.scientific_name || ''}
              </Text>
            </View>
            <View style={styles.logDetails}>
              <View style={styles.detailRow}>
                <Icon name="location-on" size={16} color="#666" />
                <Text style={styles.detailText}>
                  {log.location_name || 'N/A'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="schedule" size={16} color="#666" />
                <Text style={styles.detailText}>
                  {formatDate(log.created_at)}
                </Text>
              </View>
              {log.photo_path && (
                <Image
                  source={{ uri: log.photo_path }}
                  style={styles.logImage}
                  resizeMode="cover"
                />
              )}
            </View>
          </View>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    gap: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
  logCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    marginBottom: 10,
  },
  speciesName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  scientificName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 2,
  },
  logDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  logImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginTop: 10,
  },
});
