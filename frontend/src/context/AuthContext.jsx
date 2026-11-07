import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest, setAccessToken } from '@/services/api';

const AuthContext = createContext(null);

/**
 * Authentication and Multi-Tenant Context Provider.
 * Adheres strictly to security best practices:
 * - Short-lived access token kept in memory only.
 * - Long-lived refresh token stored in secure HttpOnly cookie.
 * - Automatic silent refresh verification upon application load.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [accessTokenState, setAccessTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Updates memory token and API service token
  const updateTokensAndSession = useCallback((data) => {
    if (data?.access_token) {
      setAccessTokenState(data.access_token);
      setAccessToken(data.access_token);
    }
    if (data?.user) {
      setUser(data.user);
    }
    if (data?.organization) {
      setOrganization(data.organization);
    }
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setOrganization(null);
    setAccessTokenState(null);
    setAccessToken(null);
  }, []);

  // Silent refresh verification on initial mount
  const checkAuth = useCallback(async () => {
    try {
      const data = await apiRequest('/api/v1/auth/refresh', {
        method: 'POST',
      });
      updateTokensAndSession(data);
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [updateTokensAndSession, clearSession]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Registers a new user, organization, and owner membership.
   */
  const register = async ({ name, email, password, organization_name, business_type }) => {
    const data = await apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        organization_name,
        business_type,
      }),
    });
    updateTokensAndSession(data);
    return data;
  };

  /**
   * Authenticates user and establishes tenant session.
   */
  const login = async ({ email, password, remember_me }) => {
    const data = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        remember_me,
      }),
    });
    updateTokensAndSession(data);
    return data;
  };

  /**
   * Logs out user, invalidates server refresh session, and clears auth cookies.
   */
  const logout = async () => {
    try {
      await apiRequest('/api/v1/auth/logout', {
        method: 'POST',
      });
    } catch (e) {
      console.warn('Logout notification to server failed:', e);
    } finally {
      clearSession();
    }
  };

  const value = {
    user,
    organization,
    accessToken: accessTokenState,
    isAuthenticated: Boolean(user && organization && accessTokenState),
    isLoading,
    register,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
