import { getToken } from '../utils/storage';

const BASE_URL = 'http://10.0.2.2:8000';  // emulator → localhost alias

class ApiService {
  async makeRequest(endpoint, { method = 'GET', headers = {}, body = null } = {}) {
    const token = await getToken();
    const url = `${BASE_URL}${endpoint}`;

    // merge headers
    const finalHeaders = { ...headers };
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
    // stringify JSON bodies
    const payload =
      body && !(body instanceof FormData) ? JSON.stringify(body) : body;

    const res = await fetch(url, {
      method,
      headers: payload instanceof FormData
        ? finalHeaders
        : { 'Content-Type': 'application/json', ...finalHeaders },
      body: payload,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.error('API error', endpoint, res.status, data);
      throw new Error(data?.detail || data?.message || 'Request failed');
    }
    return data;
  }

  // ── Authentication ────────────────────────────────────────────────────────

  async login(username, password) {
    // your FastAPI login expects JSON (not form)
    return this.makeRequest('/login', {
      method: 'POST',
      body: { username, password },
    });
  }

 async register(username, email, password, adminSecret = null) {
  const headers = {};
  if (adminSecret) {headers['x-admin-secret'] = adminSecret;}

  return this.makeRequest('/register', {
    method: 'POST',
    headers,
    body: { username, email, password },
  });
}

  async getProfile() {
    return this.makeRequest('/profile');
  }

  async getStats() {
    return this.makeRequest('/stats');
  }

  // ── Species ───────────────────────────────────────────────────────────────

  async getSpecies() {
    return this.makeRequest('/species');
  }
  async createSpecies(data) {
    // your create_species route expects form-data fields:
    const form = new FormData();
    form.append('name', data.name);
    form.append('scientific_name', data.scientific_name || '');
    form.append('category', data.category);
    form.append('description', data.description || '');
    return this.makeRequest('/species', {
      method: 'POST',
      body: form,
    });
  }

  // ── Questions ─────────────────────────────────────────────────────────────

  async getQuestions() {
    return this.makeRequest('/questions');
  }
  async createQuestion(q) {
    return this.makeRequest('/questions', {
      method: 'POST',
      body: q, // JSON matches pydantic model
    });
  }

  // ── Logs ─────────────────────────────────────────────────────────────────

  async createSpeciesLog(logData) {
    const form = new FormData();
    form.append('species_log', JSON.stringify({
      species_id: logData.species_id,
      location_latitude: logData.latitude,
      location_longitude: logData.longitude,
      location_name: logData.location_name,
      notes: logData.notes,
      answers: logData.answers,
    }));
    if (logData.image) {
      form.append('photo', {
        uri: logData.image.uri,
        type: logData.image.type,
        name: logData.image.fileName,
      });
    }
    return this.makeRequest('/species-logs', {
      method: 'POST',
      body: form,
    });
  }

  async getSpeciesLogs() {
    return this.makeRequest('/species-logs');
  }
  async getSpeciesLog(id) {
    return this.makeRequest(`/species-logs/${id}`);
  }
}

export default new ApiService();
