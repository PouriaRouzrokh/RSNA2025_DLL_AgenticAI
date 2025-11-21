import { useState } from 'react';
import { processReport } from '@/utils/api';

/**
 * Custom hook for agent API interactions
 * @returns {Object} API functions and state
 */
export const useAgentAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agentThoughts, setAgentThoughts] = useState([]);

  /**
   * Process report through agent pipeline
   * @param {Object} params - Request parameters
   * @param {Object} params.currentReport - Current report state
   * @param {string} params.instruction - Custom instruction
   * @param {string[]} params.selectedMacros - Selected macro IDs
   * @returns {Promise<Object>} Response with diff and agent_thoughts
   */
  const executeProcessReport = async ({ currentReport, instruction, selectedMacros }) => {
    setIsLoading(true);
    setError(null);
    setAgentThoughts([]);

    try {
      const response = await processReport({
        currentReport,
        instruction,
        selectedMacros,
      });

      // Extract agent thoughts if available
      if (response.agent_thoughts && Array.isArray(response.agent_thoughts)) {
        setAgentThoughts(response.agent_thoughts);
      }

      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    executeProcessReport,
    isLoading,
    error,
    agentThoughts,
    clearError: () => setError(null),
    clearThoughts: () => setAgentThoughts([]),
  };
};




