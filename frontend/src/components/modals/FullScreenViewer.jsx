'use client';

import { useEffect } from 'react';
import CTViewer from '@/components/viewer/CTViewer';
import ViewerControls from '@/components/viewer/ViewerControls';

export default function FullScreenViewer({
  isOpen,
  onClose,
  currentSlice,
  onSliceChange,
  windowLevel,
  onWindowLevelChange,
  currentView = 'axial',
  onViewChange,
  totalSlices,
  niftiData,
  loading
}) {
  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <h2 style={{
          fontSize: '1rem',
          fontWeight: '500',
          color: 'var(--text-primary)',
          margin: 0
        }}>
          CT Viewer - Full Screen
        </h2>
        <button
          onClick={onClose}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'var(--hover-bg)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'var(--bg-tertiary)';
          }}
        >
          Close (ESC)
        </button>
      </div>

      {/* Viewer */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000',
          width: '100%',
          height: '100%',
          minHeight: 0
        }}>
          <CTViewer 
            currentSlice={currentSlice}
            totalSlices={totalSlices}
            onSliceChange={onSliceChange}
            currentView={currentView}
            onViewChange={onViewChange}
            windowLevel={windowLevel}
            onMaximize={() => {}} // Already maximized
            niftiData={niftiData}
            loading={loading}
          />
        </div>
        <ViewerControls
          currentSlice={currentSlice}
          totalSlices={totalSlices}
          onSliceChange={onSliceChange}
          windowLevel={windowLevel}
          onWindowLevelChange={onWindowLevelChange}
          onMaximize={onClose} // Close full screen
        />
      </div>
    </div>
  );
}

