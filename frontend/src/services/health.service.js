import { apiRequest } from './api';

/**
 * Health service to monitor backend and MongoDB database connectivity.
 */
export async function getSystemHealth() {
  const startTime = performance.now();
  try {
    const data = await apiRequest('/health', { timeoutMs: 5000 });
    const latencyMs = Math.round(performance.now() - startTime);

    return {
      isBackendAlive: true,
      isDatabaseConnected: data.database === 'connected',
      status: data.database === 'connected' ? 'connected' : 'degraded',
      service: data.service || 'vyapaar-setu-api',
      version: data.version || '1.0.0',
      database: data.database,
      latencyMs,
      timestamp: data.timestamp || new Date().toISOString(),
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startTime);
    
    // If backend returned HTTP 503, backend is alive but database is disconnected
    if (error.status === 503 && error.data) {
      return {
        isBackendAlive: true,
        isDatabaseConnected: false,
        status: 'degraded',
        service: error.data.service || 'vyapaar-setu-api',
        version: error.data.version || '1.0.0',
        database: 'disconnected',
        error: error.data.error || 'Database unavailable',
        latencyMs,
        timestamp: error.data.timestamp || new Date().toISOString(),
      };
    }

    return {
      isBackendAlive: false,
      isDatabaseConnected: false,
      status: 'disconnected',
      service: null,
      version: null,
      database: 'disconnected',
      error: error.message || 'Cannot reach API backend',
      latencyMs,
      timestamp: new Date().toISOString(),
    };
  }
}

