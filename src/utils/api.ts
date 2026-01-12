/**
 * API Service for communicating with backend
 * Handles all HTTP requests to Flask backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Store auth token in localStorage
export const setAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const clearAuthToken = () => {
  localStorage.removeItem('authToken');
};

// Helper function to make authenticated requests
const makeRequest = async (
  endpoint: string,
  method: string = 'GET',
  data?: any
) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
};

// ============================================
// AUTHENTICATION APIs
// ============================================

export const authAPI = {
  /**
   * Register new user
   */
  register: async (userData: {
    name: string;
    email: string;
    aadhar: string;
    password: string;
  }) => {
    const response = await makeRequest('/auth/register', 'POST', userData);
    if (response.access_token) {
      setAuthToken(response.access_token);
    }
    return response;
  },

  /**
   * Login user
   */
  login: async (credentials: { email: string; password: string }) => {
    const response = await makeRequest('/auth/login', 'POST', credentials);
    if (response.access_token) {
      setAuthToken(response.access_token);
    }
    return response;
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    return makeRequest('/auth/profile', 'GET');
  },

  /**
   * Logout (clear token)
   */
  logout: () => {
    clearAuthToken();
  },
};

// ============================================
// PREDICTION APIs
// ============================================

export const predictionAPI = {
  /**
   * Predict crop yield
   */
  predictYield: async (inputData: {
    crop: string;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    ph: number;
    rainfall: number;
    temperature: number;
  }) => {
    return makeRequest('/predict-yield', 'POST', inputData);
  },

  /**
   * Get crop recommendation
   */
  predictCrop: async (inputData: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    ph: number;
    rainfall: number;
    temperature: number;
  }) => {
    return makeRequest('/predict-crop', 'POST', inputData);
  },

  /**
   * Predict farming risk
   */
  predictRisk: async (inputData: {
    crop: string;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    ph: number;
    rainfall: number;
    temperature: number;
  }) => {
    return makeRequest('/predict-risk', 'POST', inputData);
  },

  /**
   * Get prediction history
   */
  getHistory: async () => {
    return makeRequest('/prediction-history', 'GET');
  },
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.ok;
  } catch {
    return false;
  }
};
