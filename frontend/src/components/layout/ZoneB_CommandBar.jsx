'use client';

import { useState } from 'react';
import MicrophoneButton from '@/components/report/MicrophoneButton';

export default function ZoneB_CommandBar() {
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMacros, setSelectedMacros] = useState([
    'add_background',
    'proofread',
    'make_impressions',
    'compare_priors',
    'check_references'
  ]);

  const macroOptions = [
    { id: 'add_background', label: 'Add Further Clinical Background' },
    { id: 'proofread', label: 'Proofread' },
    { id: 'make_impressions', label: 'Make Impressions' },
    { id: 'compare_priors', label: 'Compare to Priors' },
    { id: 'check_references', label: 'Check References' }
  ];

  const handleExecute = () => {
    if (!instruction.trim() && selectedMacros.length === 0) {
      return;
    }
    setIsProcessing(true);
    // TODO: Implement API call
    setTimeout(() => {
      setIsProcessing(false);
      setInstruction('');
    }, 2000);
  };

  const handleMacroToggle = (macroId) => {
    setSelectedMacros(prev => 
      prev.includes(macroId)
        ? prev.filter(id => id !== macroId)
        : [...prev, macroId]
    );
  };

  return (
    <div className="zone-b">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        width: '100%',
        padding: '0 1.5rem'
      }}>
        {/* Macro Checkboxes */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {macroOptions.map((macro) => {
            const isSelected = selectedMacros.includes(macro.id);
            return (
              <label
                key={macro.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.5 : 1,
                  userSelect: 'none'
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleMacroToggle(macro.id)}
                  disabled={isProcessing}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    accentColor: 'var(--accent-blue)'
                  }}
                />
                <span style={{
                  fontSize: '0.875rem',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? '500' : '400',
                  transition: 'color var(--transition-fast)'
                }}>
                  {macro.label}
                </span>
              </label>
            );
          })}
        </div>

        {/* Custom Instruction Input */}
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Enter custom instruction..."
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '0.625rem 1rem 0.625rem 1rem',
              paddingRight: '3rem',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              transition: 'all var(--transition-fast)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-blue)';
              e.target.style.backgroundColor = 'var(--bg-elevated)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-subtle)';
              e.target.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleExecute();
              }
            }}
          />
          <div style={{
            position: 'absolute',
            right: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <MicrophoneButton
              fieldId="custom-instruction"
              currentValue={instruction}
              onTranscriptionComplete={(transcription) => {
                setInstruction(transcription);
              }}
            />
          </div>
        </div>

        {/* Execute Button */}
        <button
          onClick={handleExecute}
          disabled={isProcessing || (!instruction.trim() && selectedMacros.length === 0)}
          style={{
            padding: '0.625rem 2rem',
            backgroundColor: isProcessing ? 'var(--bg-tertiary)' : 'var(--accent-blue)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.5 : 1,
            transition: 'all var(--transition-fast)',
            boxShadow: isProcessing ? 'none' : 'var(--shadow-sm)',
            letterSpacing: '0.025em'
          }}
          onMouseEnter={(e) => {
            if (!isProcessing) {
              e.target.style.backgroundColor = 'var(--accent-blue-hover)';
              e.target.style.boxShadow = 'var(--shadow-md)';
              e.target.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isProcessing) {
              e.target.style.backgroundColor = 'var(--accent-blue)';
              e.target.style.boxShadow = 'var(--shadow-sm)';
              e.target.style.transform = 'translateY(0)';
            }
          }}
          onMouseDown={(e) => {
            if (!isProcessing) {
              e.target.style.transform = 'translateY(0)';
            }
          }}
        >
          {isProcessing ? 'Processing...' : 'Execute'}
        </button>

        {/* Processing Indicator */}
        {isProcessing && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem'
          }}>
            <div style={{
              width: '14px',
              height: '14px',
              border: '2px solid var(--border-subtle)',
              borderTopColor: 'var(--accent-blue)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span>Processing...</span>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
