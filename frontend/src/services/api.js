import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and auth (if needed)
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 404) {
      console.warn('Resource not found:', error.config.url);
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Overlay API functions
export const overlayAPI = {
  // Get all overlays
  getAll: async (params = {}) => {
    const response = await api.get('/overlays', { params });
    return response.data;
  },

  // Get single overlay
  getById: async (id) => {
    const response = await api.get(`/overlays/${id}`);
    return response.data;
  },

  // Create new overlay
  create: async (overlayData) => {
    const response = await api.post('/overlays', overlayData);
    return response.data;
  },

  // Update overlay
  update: async (id, updateData) => {
    const response = await api.put(`/overlays/${id}`, updateData);
    return response.data;
  },

  // Delete overlay
  delete: async (id) => {
    const response = await api.delete(`/overlays/${id}`);
    return response.data;
  },

  // Batch update overlays
  batchUpdate: async (updates) => {
    const promises = updates.map(({ id, data }) => api.put(`/overlays/${id}`, data));
    const responses = await Promise.allSettled(promises);
    return responses;
  },

  // Get overlay statistics
  getStats: async () => {
    const response = await api.get('/overlays/stats');
    return response.data;
  }
};

// Stream API functions
export const streamAPI = {
  // Start stream
  start: async (rtspUrl) => {
    const response = await api.post('/stream/start', { rtsp_url: rtspUrl });
    return response.data;
  },

  // Stop stream
  stop: async () => {
    const response = await api.post('/stream/stop');
    return response.data;
  },

  // Get stream status
  getStatus: async () => {
    const response = await api.get('/stream/status');
    return response.data;
  },

  // Validate RTSP URL
  validate: async (rtspUrl) => {
    const response = await api.post('/stream/validate', { rtsp_url: rtspUrl });
    return response.data;
  }
};

// Health check API
export const healthAPI = {
  // Get API health status
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};

// Utility functions
export const apiUtils = {
  // Test API connectivity
  testConnection: async () => {
    try {
      await healthAPI.check();
      return { success: true, message: 'API connection successful' };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'API connection failed' 
      };
    }
  },

  // Handle API errors consistently
  handleError: (error, defaultMessage = 'An error occurred') => {
    if (error.response?.data?.error) {
      return error.response.data.error;
    } else if (error.message) {
      return error.message;
    } else {
      return defaultMessage;
    }
  },

  // Retry failed requests
  retry: async (apiCall, maxRetries = 3, delay = 1000) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        
        // Don't retry 4xx errors (client errors)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error;
        }
        
        // Wait before retrying
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }
    
    throw lastError;
  }
};

// Export default API instance
export default api;