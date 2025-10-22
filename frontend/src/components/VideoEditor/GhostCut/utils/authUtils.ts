/**
 * Authentication utility functions for GhostCut Editor
 */

import { API_ENDPOINTS, AUTH_CONFIG } from '../constants/editorConstants';

/**
 * Auto-login function to ensure user is authenticated
 */
export const autoLogin = async (): Promise<void> => {
  // Check if we already have a valid token
  const existingToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  if (existingToken) {
    // Try to verify the token by making a test request
    try {
      const response = await fetch(API_ENDPOINTS.AUTH_ME, {
        headers: {
          'Authorization': `Bearer ${existingToken}`,
        },
      });
      if (response.ok) {
        console.log('Already authenticated');
        return; // Token is valid, no need to login
      }
    } catch (error) {
      console.log('Existing token invalid, logging in...');
    }
  }

  // Auto-login with demo account
  try {
    const response = await fetch(API_ENDPOINTS.AUTH_LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: AUTH_CONFIG.DEMO_EMAIL,
        password: AUTH_CONFIG.DEMO_PASSWORD,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, data.access_token);
      localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, data.refresh_token);
      console.log(`Auto-login successful for ${AUTH_CONFIG.DEMO_EMAIL}`);
    } else {
      console.error('Auto-login failed');
    }
  } catch (error) {
    console.error('Auto-login error:', error);
  }
};

/**
 * Get authorization headers for API requests
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};
