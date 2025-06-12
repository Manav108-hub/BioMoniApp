import { getToken } from '../utils/storage';

const BASE_URL = 'http://172.30.230.30:8000'; // Change this to your backend URL

class ApiService {
  async makeRequest(endpoint, options = {}) {
    try {
      const token = await getToken();
      const url = `${BASE_URL}${endpoint}`;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(username, password) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    return this.makeRequest('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }

  async register(username, password, adminSecret = null) {
    const body = { username, password };
    if (adminSecret) {
      body.admin_secret = adminSecret;
    }

    return this.makeRequest('/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getProfile() {
    return this.makeRequest('/profile');
  }

  async getStats() {
    return this.makeRequest('/stats');
  }

  // Species Management
  async getSpecies() {
    return this.makeRequest('/species');
  }

  async createSpecies(speciesData) {
    return this.makeRequest('/species', {
      method: 'POST',
      body: JSON.stringify(speciesData),
    });
  }

  // Questions
  async getQuestions() {
    return this.makeRequest('/questions');
  }

  // Species Logs
  async createSpeciesLog(logData) {
    const formData = new FormData();
    
    // Add basic log data
    formData.append('species_id', logData.species_id.toString());
    formData.append('location_name', logData.location_name);
    formData.append('latitude', logData.latitude.toString());
    formData.append('longitude', logData.longitude.toString());
    
    // Add answers
    formData.append('answers', JSON.stringify(logData.answers));
    
    // Add image if present
    if (logData.image) {
      formData.append('image', {
        uri: logData.image.uri,
        type: logData.image.type,
        name: logData.image.fileName,
      });
    }

    return this.makeRequest('/species-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }

  async getSpeciesLogs() {
    return this.makeRequest('/species-logs');
  }

  async getSpeciesLog(logId) {
    return this.makeRequest(`/species-logs/${logId}`);
  }
}

export default new ApiService();