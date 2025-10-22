/**
 * Auto Login Hook
 *
 * Automatically authenticates the user with demo credentials if not already logged in.
 * This is a side-effect only hook that runs once on component mount.
 */

import { useEffect } from 'react';
import { API_ENDPOINTS, DEMO_CREDENTIALS } from '../constants/editorConstants';

/**
 * Custom hook for auto-login functionality
 *
 * Checks for existing authentication token and automatically logs in
 * with demo credentials if needed.
 */
export const useAutoLogin = (): void => {
  useEffect(() => {
    const autoLogin = async () => {
      // Check if we already have a valid token
      const existingToken = localStorage.getItem('access_token');
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
            email: DEMO_CREDENTIALS.email,
            password: DEMO_CREDENTIALS.password,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          console.log(`Auto-login successful for ${DEMO_CREDENTIALS.email}`);
        } else {
          console.error('Auto-login failed');
        }
      } catch (error) {
        console.error('Auto-login error:', error);
      }
    };

    autoLogin();
  }, []); // Run once on component mount
};
