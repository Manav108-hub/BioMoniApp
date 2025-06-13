// src/components/QuestionnaireForm.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// This component renders the dynamic questions
export default function QuestionnaireForm({ questions, onSubmitQuestions, onBack }) {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Basic validation: ensure all questions have some answer if relevantQuestions is not empty
      if (questions.length > 0) {
        const allAnswered = questions.every(q => answers.hasOwnProperty(q.id) && answers[q.id] !== undefined && answers[q.id] !== '');
        if (!allAnswered) {
          Alert.alert('Validation Error', 'Please answer all the observation details questions.');
          setLoading(false);
          return;
        }
      }

      const formattedAnswers = Object.keys(answers).map(questionId => ({
        question_id: parseInt(questionId, 10),
        answer_text: answers[questionId].toString() // Ensure answer is string for backend
      }));

      await onSubmitQuestions(formattedAnswers);
      // Reset answers after successful submission
      setAnswers({});
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      Alert.alert('Error', 'Could not submit questionnaire. Please try again.');
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
        <Text style={styles.sectionTitle}>Observation Details</Text>
        {questions.length > 0 ? (
          questions.map(renderQuestion)
        ) : (
          <Text style={styles.noDataText}>No specific questions available.</Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.backButton]}
          onPress={onBack}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 30,
    gap: 10,
  },
  submitButton: {
    flex: 2, // Takes more space
    backgroundColor: '#2e7d32',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButton: {
    flex: 1, // Takes less space
    backgroundColor: '#6c757d', // Grey color for back button
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: { opacity: 0.6 },
  noDataText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
});
