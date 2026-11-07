import { apiRequest } from './api';

/**
 * Frontend API client for Twilio Programmable Voice & Telephony Management.
 */
export const telephonyService = {
  /**
   * Fetches active organization phone configuration and voice persona defaults.
   */
  async getConfig() {
    return apiRequest('/api/v1/telephony/config');
  },

  /**
   * Updates organization's assigned Twilio phone number and voice persona settings.
   */
  async updateConfig(data) {
    return apiRequest('/api/v1/telephony/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Validates Twilio credentials and returns live account connection diagnostic.
   */
  async testConnection() {
    return apiRequest('/api/v1/telephony/test-connection', {
      method: 'POST',
    });
  },

  /**
   * Retrieves paginated list of inbound calls with caller ID resolution.
   */
  async listCalls({ page = 1, limit = 15, status = '' } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (status && status.trim()) {
      params.append('status', status.trim());
    }

    return apiRequest(`/api/v1/telephony/calls?${params.toString()}`);
  },

  /**
   * Retrieves single call detail with chronological audit events.
   */
  async getCallDetail(callId) {
    return apiRequest(`/api/v1/telephony/calls/${callId}`);
  },
};
