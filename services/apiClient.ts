import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store'; // Or your preferred secure storage
import { refreshTokenService } from './authServices'; // Import your refresh token function

// --- Secure Storage Keys ---
const ACCESS_TOKEN_KEY = process.env.EXPO_PUBLIC_ACCESS_TOKEN_KEY || 'cheche_access_token';
const REFRESH_TOKEN_KEY = process.env.EXPO_PUBLIC_REFRESH_TOKEN_KEY || 'cheche_refresh_token';

// --- Helper functions for Secure Storage (replace with your actual implementation) ---
export const getToken = async (key: string): Promise<string | null> => {
  return await SecureStore.getItemAsync(key);
};

export const setToken = async (key: string, value: string): Promise<void> => {
  await SecureStore.setItemAsync(key, value);
};

export const clearTokens = async (): Promise<void> => {
  console.log('Tokens cleared, user should log in again.');

  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  // Potentially redirect to login screen here or handle logout state
  // Example: router.replace('/login'); 
};

// --- Axios Instance ---
const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL, // Your API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor ---
// Adds the access token to the Authorization header before sending requests
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const accessToken = await getToken(ACCESS_TOKEN_KEY);
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
// Handles 401 errors by attempting to refresh the token

let isRefreshing = false; // Flag to prevent multiple refresh attempts simultaneously
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void }[] = []; // Queue for requests failed during refresh

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    // If the request succeeds, just return the response
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Check if it's a 401 error and not a retry request
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      
      if (isRefreshing) {
        // If already refreshing, add the original request to a queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(token => {
          if (originalRequest.headers) {
             originalRequest.headers['Authorization'] = 'Bearer ' + token;
          }
          return apiClient(originalRequest); // Retry with new token
        })
        .catch(err => {
          return Promise.reject(err); // Propagate the error if queue processing fails
        });
      }

      originalRequest._retry = true; // Mark as retried
      isRefreshing = true;

      try {
        const currentRefreshToken = await getToken(REFRESH_TOKEN_KEY);
        if (!currentRefreshToken) {
          console.error('No refresh token available.');
          await clearTokens(); // Clear tokens if refresh token is missing
          processQueue(new Error('No refresh token'), null);
          return Promise.reject(error); // Reject the original request
        }

        const { access_token: newAccessToken, refresh_token: newRefreshToken } = await refreshTokenService({ refreshToken: currentRefreshToken });

        // Store the new tokens
        await setToken(ACCESS_TOKEN_KEY, newAccessToken);
        if (newRefreshToken) { // Store new refresh token if provided
          await setToken(REFRESH_TOKEN_KEY, newRefreshToken);
        }

        // Update the Authorization header for the original request
        if (apiClient.defaults.headers.common) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        }
        if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken); // Process queue with new token
        return apiClient(originalRequest); // Retry the original request

      } catch (refreshError: any) {
        console.error('Token refresh failed:', refreshError);
        processQueue(refreshError, null); // Process queue with error
        await clearTokens(); // Clear tokens on refresh failure
        // Redirect to login or handle logout state
        return Promise.reject(refreshError); // Reject the original request
      } finally {
        isRefreshing = false; // Reset refreshing flag
      }
    }

    // For errors other than 401, just reject
    return Promise.reject(error);
  }
);

export default apiClient; // Export the configured instance