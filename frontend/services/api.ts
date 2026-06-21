const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiService {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('indranetra_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      ...this.getHeaders(),
      ...(options.headers || {}),
    };
    
    // If headers is not Content-Type multipart/form-data, we keep Content-Type
    if (options.body instanceof FormData) {
      // Browser automatically sets the content type boundary for FormData
      if ((headers as any)['Content-Type']) {
        delete (headers as any)['Content-Type'];
      }
    }

    const res = await fetch(url, { ...options, headers });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(errorData.message || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  // Auth endpoints
  async login(body: any) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('indranetra_token', data.token);
      localStorage.setItem('indranetra_user', JSON.stringify(data.user));
    }
    return data;
  }

  async register(body: any) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('indranetra_token', data.token);
      localStorage.setItem('indranetra_user', JSON.stringify(data.user));
    }
    return data;
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('indranetra_token');
      localStorage.removeItem('indranetra_user');
    }
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Events endpoints
  async getEvents() {
    return this.request('/events');
  }

  async getEvent(id: string) {
    return this.request(`/events/${id}`);
  }

  async createEvent(body: any) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateEvent(id: string, body: any) {
    return this.request(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  // Volunteers endpoints
  async getVolunteers() {
    return this.request('/volunteers');
  }

  async updateVolunteerLocation(latitude: number, longitude: number) {
    return this.request('/volunteers/location', {
      method: 'PATCH',
      body: JSON.stringify({ latitude, longitude }),
    });
  }

  async updateVolunteerStatus(status: string) {
    return this.request('/volunteers/status', {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // SOS endpoints
  async createSOS(latitude: number, longitude: number, issueType: string, description?: string) {
    return this.request('/volunteers/sos', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, issueType, description }),
    });
  }

  async getSOSRequests() {
    return this.request('/volunteers/sos');
  }

  async resolveSOS(id: string) {
    return this.request(`/volunteers/sos/${id}/resolve`, {
      method: 'PATCH',
    });
  }

  // Incident reports
  async createReport(body: any) {
    return this.request('/reports', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getReports() {
    return this.request('/reports');
  }

  async resolveReport(id: string) {
    return this.request(`/volunteers/reports/${id}/resolve`, {
      method: 'PATCH',
    });
  }

  // Volunteer Dispatch
  async dispatchVolunteer(volunteerId: string, incidentId: string, incidentType: 'SOS' | 'REPORT') {
    return this.request('/volunteers/dispatch', {
      method: 'PATCH',
      body: JSON.stringify({ volunteerId, incidentId, incidentType }),
    });
  }

  // Camera Management
  async getCameras(eventId: string) {
    return this.request(`/events/${eventId}/cameras`);
  }

  async createCamera(eventId: string, name: string, location: string, rtspUrl: string) {
    return this.request(`/events/${eventId}/cameras`, {
      method: 'POST',
      body: JSON.stringify({ name, location, rtspUrl }),
    });
  }

  async deleteCamera(cameraId: string) {
    return this.request(`/cameras/${cameraId}`, {
      method: 'DELETE',
    });
  }

  async analyzeCameraFrame(cameraId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request(`/cameras/${cameraId}/analyze`, {
      method: 'POST',
      body: formData,
    });
  }

  async analyzeCameraRtsp(cameraId: string) {
    return this.request(`/cameras/${cameraId}/analyze`, {
      method: 'POST',
    });
  }

  // Crowd Analysis endpoint
  async uploadFrame(eventId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request(`/crowd/${eventId}/analyze`, {
      method: 'POST',
      body: formData,
    });
  }

  async getCrowdHistory(eventId: string) {
    return this.request(`/crowd/${eventId}/history`);
  }
}

export const api = new ApiService();
export { API_BASE_URL };
