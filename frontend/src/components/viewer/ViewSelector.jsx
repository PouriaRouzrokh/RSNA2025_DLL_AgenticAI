'use client';

import { useRef, useEffect } from 'react';
import { extractSlice, normalizeSlice, WINDOW_LEVEL_PRESETS } from '@/utils/niftiLoader';

// Helper component to generate thumbnail preview from actual NIfTI data
function ViewThumbnail({ view, isSelected, onClick, niftiData, windowLevel }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // If we have NIfTI data, render actual mid-slice
    if (niftiData) {
      try {
        // Get dimensions for this view
        const { dimensions } = niftiData;
        let maxSlices;
        
        if (view === 'axial') {
          maxSlices = dimensions.z;
        } else if (view === 'sagittal') {
          maxSlices = dimensions.x;
        } else {
          maxSlices = dimensions.y;
        }

        // Get mid-slice index
        const midSliceIndex = Math.floor(maxSlices / 2);

        // Extract the mid-slice
        const sliceInfo = extractSlice(niftiData, view, midSliceIndex);
        const { data, width: sliceWidth, height: sliceHeight } = sliceInfo;

        // Get window/level preset
        const preset = WINDOW_LEVEL_PRESETS[windowLevel] || WINDOW_LEVEL_PRESETS.soft_tissue;
        const sclSlope = niftiData.sclSlope;
        const sclInter = niftiData.sclInter || 0;

        // Normalize slice
        const normalizedSlice = normalizeSlice(data, sclSlope, sclInter, preset.window, preset.level);

        // Render thumbnail (scaled down)
        const scale = Math.min(width / sliceWidth, height / sliceHeight);
        const scaledWidth = sliceWidth * scale;
        const scaledHeight = sliceHeight * scale;
        const offsetX = (width - scaledWidth) / 2;
        const offsetY = (height - scaledHeight) / 2;

        const imageData = ctx.createImageData(width, height);

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            
            const sliceX = Math.floor((x - offsetX) / scale);
            const sliceY = Math.floor((y - offsetY) / scale);
            
            if (sliceX >= 0 && sliceX < sliceWidth && sliceY >= 0 && sliceY < sliceHeight) {
              const sliceIdx = sliceY * sliceWidth + sliceX;
              const normalized = normalizedSlice[sliceIdx];
              
              imageData.data[index] = normalized;
              imageData.data[index + 1] = normalized;
              imageData.data[index + 2] = normalized;
              imageData.data[index + 3] = 255;
            } else {
              imageData.data[index] = 0;
              imageData.data[index + 1] = 0;
              imageData.data[index + 2] = 0;
              imageData.data[index + 3] = 255;
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
      } catch (error) {
        console.error(`Error rendering thumbnail for ${view}:`, error);
      }
    }
  }, [view, niftiData, windowLevel]);

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.375rem',
        backgroundColor: isSelected ? 'rgba(96, 165, 250, 0.2)' : 'rgba(0, 0, 0, 0.6)',
        border: `2px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        width: '100%'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'var(--accent-blue)';
          e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        }
      }}
    >
      <canvas
        ref={canvasRef}
        width={32}
        height={32}
        style={{
          borderRadius: '4px',
          border: '1px solid var(--border-subtle)'
        }}
      />
      <span style={{
        fontSize: '0.65rem',
        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontWeight: isSelected ? '500' : '400',
        textTransform: 'capitalize'
      }}>
        {view}
      </span>
    </button>
  );
}


export default function ViewSelector({ currentView, onViewChange, niftiData, windowLevel }) {
  const views = [
    { id: 'axial', label: 'Axial' },
    { id: 'sagittal', label: 'Sagittal' },
    { id: 'coronal', label: 'Coronal' }
  ];

  return (
    <div style={{
      position: 'absolute',
      top: '3rem', // Below slice indicator
      left: '0.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      zIndex: 10
    }}>
      {views.map((view) => (
        <ViewThumbnail
          key={view.id}
          view={view.id}
          isSelected={currentView === view.id}
          onClick={() => onViewChange && onViewChange(view.id)}
          niftiData={niftiData}
          windowLevel={windowLevel}
        />
      ))}
    </div>
  );
}
