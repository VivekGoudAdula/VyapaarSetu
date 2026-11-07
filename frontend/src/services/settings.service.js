import { apiRequest } from './api';

/**
 * Frontend API client for Business Operating Settings.
 */
export const settingsService = {
  /**
   * Retrieves active business settings, operating hours, and delivery zones.
   */
  async getSettings() {
    return apiRequest('/api/v1/settings');
  },

  /**
   * Updates business operating configuration.
   */
  async updateSettings(data) {
    return apiRequest('/api/v1/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

