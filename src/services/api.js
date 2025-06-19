import {
  getToken,
  setToken,
  clearToken,
  getUser,
  setUser,
  clearUser,
} from '../utils/storage';

const BASE_URL = 'http://10.0.2.2:8000'; // Android emulator localhost

class ApiService {
  async makeRequest(endpoint, { method = 'GET', headers = {}, body = null } = {}) {
    const token = await getToken();
    const url = `${BASE_URL}${endpoint}`;

    const finalHeaders = { ...headers };
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }

    const payload = body && !(body instanceof FormData) ? JSON.stringify(body) : body;

    const res = await fetch(url, {
      method,
      headers: payload instanceof FormData
        ? finalHeaders
        : { 'Content-Type': 'application/json', ...finalHeaders },
      body: payload,
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json().catch(() => null) : null;

    if (!res.ok) {
      console.error('API Error:', res.status, endpoint, data);
      throw new Error(data?.detail || data?.message || 'Request failed');
    }

    return data;
  }

  // ── Authentication ────────────────────────────────

  async login(username, password) {
    const response = await this.makeRequest('/login', {
      method: 'POST',
      body: { username, password },
    });

    if (response?.access_token) {
      await setToken(response.access_token);
      await setUser(response.user);
    }

    return response;
  }

  async register(username, email, password, isAdmin = false, adminSecret = null) {
    const headers = adminSecret ? { 'X-Admin-Secret': adminSecret } : {};

    const response = await this.makeRequest('/register', {
      method: 'POST',
      headers,
      body: { username, email, password, is_admin: isAdmin },
    });

    if (response?.access_token) {
      await setToken(response.access_token);
      await setUser(response.user);
    }

    return response;
  }

  async logout() {
    await clearToken();
    await clearUser();
  }

  async getProfile() {
    return this.makeRequest('/profile');
  }

  async getStats() {
    return this.makeRequest('/stats');
  }

  // ── Species ───────────────────────────────────────

  async getSpecies() {
    return this.makeRequest('/species');
  }

  async createSpecies(name, scientific_name, category, description = '') {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('scientific_name', scientific_name || '');
    formData.append('category', category);
    formData.append('description', description);

    return this.makeRequest('/species', {
      method: 'POST',
      body: formData,
    });
  }

  // ✅ NEW: Public Species Images
  async getPublicSpeciesImages() {
    return this.makeRequest('/public/species-images');
  }

  // ── Questions ─────────────────────────────────────

  async getQuestions() {
    return this.makeRequest('/questions');
  }

  async createQuestion(questionObject) {
    return this.makeRequest('/questions', {
      method: 'POST',
      body: questionObject,
    });
  }

  // ── Species Logs ──────────────────────────────────

  async createSpeciesLog(logData) {
    const formData = new FormData();

    const speciesLogJson = JSON.stringify({
      species_id: logData.species_id,
      location_latitude: logData.latitude,
      location_longitude: logData.longitude,
      location_name: logData.location_name,
      notes: logData.notes,
      answers: logData.answers,
    });

    formData.append('species_log', speciesLogJson);

    if (logData.image?.uri) {
      formData.append('photo', {
        uri: logData.image.uri,
        name: logData.image.fileName || 'photo.jpg',
        type: logData.image.type || 'image/jpeg',
      });
    }

    return this.makeRequest('/species-logs', {
      method: 'POST',
      body: formData,
    });
  }

  async getSpeciesLogs() {
    return this.makeRequest('/species-logs');
  }

  async getSpeciesLog(id) {
    return this.makeRequest(`/species-logs/${id}`);
  }

  // ── Admin Endpoints ───────────────────────────────

  async getAllUsers() {
    return this.makeRequest('/admin/users');
  }

  async getAllSpeciesLogs() {
    return this.makeRequest('/admin/all-logs');
  }

  async exportCsv() {
    const token = await getToken();
    const response = await fetch(`${BASE_URL}/admin/export-csv`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Export CSV Error: ${response.status} - ${errorText}`);
      throw new Error(`Failed to export CSV: ${errorText}`);
    }

    return response.blob(); // The blob can be used for file downloads
  }
}

export default new ApiService();
