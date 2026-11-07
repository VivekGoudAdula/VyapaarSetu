import { apiRequest } from './api';

/**
 * Frontend API client for Telephony Management, Vobiz Phone Provisioning,
 * Call Logs, and Audio Stream Telemetry.
 */
export const telephonyService = {
  /**
   * Retrieves active Vobiz phone configuration and integration URLs.
   */
  async getPhoneConfig() {
    return apiRequest('/api/v1/telephony/config');
  },

  /**
   * Updates or assigns the dedicated Vobiz business phone number.
   */
  async updatePhoneConfig(data) {
    return apiRequest('/api/v1/telephony/config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Tests Vobiz API credentials and network connectivity.
   */
  async testConnection() {
    return apiRequest('/api/v1/telephony/test-connection', {
      method: 'POST',
    });
  },

  /**
   * Lists paginated call history with filters.
   */
  async listCalls({ page = 1, limit = 20, status = '', caller_classification = '' } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (status && status.trim()) {
      params.append('status', status.trim());
    }
    if (caller_classification && caller_classification.trim()) {
      params.append('caller_classification', caller_classification.trim());
    }

    return apiRequest(`/api/v1/telephony/calls?${params.toString()}`);
  },

  /**
   * Retrieves full details and event logs for a specific call session.
   */
  async getCallDetail(callId) {
    return apiRequest(`/api/v1/telephony/calls/${callId}`);
  },

  /**
   * Simulates an incoming call for testing Kirana retailer caller-ID resolution.
   */
  async simulateCall(data) {
    return apiRequest('/api/v1/telephony/simulate-call', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

