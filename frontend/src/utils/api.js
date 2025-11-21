import axios from 'axios';

// Create axios instance with base URL from environment
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens or headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', error.request);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Process report with agent pipeline
 * @param {Object} params - Request parameters
 * @param {Object} params.currentReport - Current report state
 * @param {string} params.instruction - Custom instruction (optional)
 * @param {string[]} params.selectedMacros - Array of selected macro IDs
 * @returns {Promise} API response
 */
export const processReport = async ({ currentReport, instruction, selectedMacros = [] }) => {
  // Determine mode_button based on selected macros
  // Priority: custom instruction > first selected macro > 'custom'
  let modeButton = 'custom';
  
  if (instruction && instruction.trim()) {
    modeButton = 'custom';
  } else if (selectedMacros.length > 0) {
    // Map macro IDs to backend expected values
    const macroMapping = {
      'add_background': 'add_history',
      'proofread': 'proofread',
      'make_impressions': 'check_completeness',
      'compare_priors': 'summarize_priors',
      'check_references': 'check_references'
    };
    
    // Use the first selected macro
    modeButton = macroMapping[selectedMacros[0]] || 'custom';
  }

  const requestBody = {
    current_report: {
      indication: currentReport.indication || '',
      technique: currentReport.technique || '',
      findings: currentReport.findings || '',
      impression: currentReport.impression || '',
    },
    instruction: instruction || '',
    mode_button: modeButton,
  };

  try {
    const response = await api.post('/agent/process', requestBody);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api;



