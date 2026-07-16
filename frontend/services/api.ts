const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiService {
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      ...this.getHeaders(),
      ...(options.headers || {}),
    };
    
    if (options.body instanceof FormData) {
      if ((headers as any)['Content-Type']) {
        delete (headers as any)['Content-Type'];
      }
    }

    const res = await fetch(url, { 
      ...options, 
      headers,
      credentials: 'include' // Always send cookies for cross-origin requests
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(errorData.message || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  // Auth endpoints
  async login(body: any) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async register(body: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async googleLogin(body: any) {
    return this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async verifyEmail(token: string) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, passwordHash: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, passwordHash }),
    });
  }

  async completeProfile(profileData: any) {
    return this.request('/auth/complete-profile', {
      method: 'POST',
      body: JSON.stringify({ profileData }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
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

  async deleteEvent(id: string) {
    return this.request(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  // Volunteers endpoints
  async getVolunteers() {
    return this.request('/volunteers');
  }

  async getPendingVolunteers() {
    return this.request('/volunteers/pending');
  }

  async assignVolunteer(id: string, eventId: string) {
    return this.request(`/volunteers/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ eventId }),
    });
  }

  async rejectVolunteer(id: string) {
    return this.request(`/volunteers/${id}/reject`, {
      method: 'PATCH',
    });
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

  async createCamera(eventId: string, name: string, location: string, cameraSource: string, rtspUrl: string) {
    return this.request(`/events/${eventId}/cameras`, {
      method: 'POST',
      body: JSON.stringify({ name, location, cameraSource, rtspUrl }),
    });
  }

  async updateCamera(cameraId: string, body: { name?: string; location?: string; cameraSource?: string; rtspUrl?: string; aiEnabled?: boolean; status?: string }) {
    return this.request(`/cameras/${cameraId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async deleteCamera(cameraId: string) {
    return this.request(`/cameras/${cameraId}`, {
      method: 'DELETE',
    });
  }

  async testCameraConnection(cameraId: string) {
    return this.request(`/cameras/${cameraId}/test`, {
      method: 'POST',
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

  // Admin approvals
  async getPendingOrganizers() {
    return this.request('/auth/pending-organizers');
  }

  async approveOrganizer(id: string) {
    return this.request(`/auth/approve-organizer/${id}`, {
      method: 'POST',
    });
  }

  async rejectOrganizer(id: string) {
    return this.request(`/auth/reject-organizer/${id}`, {
      method: 'POST',
    });
  }

  // User Management
  async getAllUsers() {
    return this.request('/auth/users');
  }

  async updateUserRole(id: string, role: string) {
    return this.request(`/auth/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/auth/users/${id}`, {
      method: 'DELETE',
    });
  }

  async updateVolunteer(id: string, body: any) {
    return this.request(`/volunteers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  // Alerts
  async getActiveAlerts(eventId?: string) {
    const qs = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
    return this.request(`/crowd/alerts/active${qs}`);
  }

  async resolveAlert(id: string) {
    return this.request(`/crowd/alerts/${id}/resolve`, {
      method: 'PATCH',
    });
  }

  // Notifications
  async getNotifications() {
    return this.request('/notifications');
  }

  async getUnreadNotificationCount() {
    return this.request('/notifications/unread-count');
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', {
      method: 'PATCH',
    });
  }
}

export const api = new ApiService();
export { API_BASE_URL };
