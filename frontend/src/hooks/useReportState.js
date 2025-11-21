import { create } from 'zustand';

const useReportStore = create((set) => ({
  // Report fields
  indication: '',
  technique: '',
  findings: '',
  impression: '',
  
  // Cursor position tracking
  cursorPosition: {
    field: '',
    position: 0
  },

  // Actions
  updateField: (field, value) => 
    set((state) => ({ [field]: value })),

  setCursorPosition: (field, position) =>
    set({ cursorPosition: { field, position } }),

  resetReport: () =>
    set({
      indication: '',
      technique: '',
      findings: '',
      impression: '',
      cursorPosition: { field: '', position: 0 }
    }),

  // Get current report state
  getReport: () => {
    const state = useReportStore.getState();
    return {
      indication: state.indication,
      technique: state.technique,
      findings: state.findings,
      impression: state.impression
    };
  }
}));

export { useReportStore };

