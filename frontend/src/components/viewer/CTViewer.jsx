'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import ViewSelector from './ViewSelector';
import { extractSlice, normalizeSlice, WINDOW_LEVEL_PRESETS, calculateTargetSliceCount } from '@/utils/niftiLoader';

export default function CTViewer({ 
  currentSlice = 1, 
  totalSlices = 20,
  onSliceChange,
  onTotalSlicesChange,
  currentView = 'axial',
  onViewChange,
  windowLevel = 'soft_tissue',
  onMaximize,
  niftiData: externalNiftiData = null,
  loading: externalLoading = false
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 512, height: 512 });
  // Store niftiData in ref to avoid React DevTools serialization issues with large arrays
  const niftiDataRef = useRef(externalNiftiData);
  const [loading, setLoading] = useState(externalNiftiData ? false : true);
  const [error, setError] = useState(null);
  const [actualTotalSlices, setActualTotalSlices] = useState(20);
  const [dataVersion, setDataVersion] = useState(0); // Version counter to trigger re-renders
  const lastMaxSlicesRef = useRef(0); // Track last maxSlices to prevent unnecessary updates

  useEffect(() => {
    if (externalNiftiData) {
      niftiDataRef.current = externalNiftiData;
      setLoading(false);
      setDataVersion(prev => prev + 1);
    } else {
      setLoading(externalLoading);
    }
  }, [externalNiftiData, externalLoading]);
  
  // Getter for niftiData
  const niftiData = niftiDataRef.current;

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height);
        setCanvasSize({ width: size, height: size });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    const niftiData = niftiDataRef.current;
    if (niftiData) {
      const { dimensions } = niftiData;
      let maxSlices = 20;
      
      if (currentView === 'axial') {
        maxSlices = dimensions.z;
      } else if (currentView === 'sagittal') {
        // Use resampled slice count if resampling is enabled
        maxSlices = calculateTargetSliceCount(niftiData, 'sagittal');
      } else if (currentView === 'coronal') {
        // Use resampled slice count if resampling is enabled
        maxSlices = calculateTargetSliceCount(niftiData, 'coronal');
      }

      // Only update if maxSlices actually changed
      if (maxSlices !== lastMaxSlicesRef.current) {
        setActualTotalSlices(maxSlices);
        lastMaxSlicesRef.current = maxSlices;
        // Call callback only if provided and value changed
        if (onTotalSlicesChange) {
          onTotalSlicesChange(maxSlices);
        }
      }
    }
  }, [currentView, dataVersion]); // Removed onTotalSlicesChange from dependencies

  // Render slice on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    if (loading) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Loading NIfTI file...', width / 2, height / 2);
      return;
    }

    const niftiData = niftiDataRef.current;
    if (error || !niftiData) {
      ctx.fillStyle = '#ff6b6b';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(error ? `Error: ${error}` : 'No data available', width / 2, height / 2);
      return;
    }

    const sliceInfo = extractSlice(niftiData, currentView, currentSlice - 1);
    const { data, width: sliceWidth, height: sliceHeight } = sliceInfo;

    // Validate slice dimensions before creating image data
    const validWidth = Math.max(1, Math.floor(sliceWidth)) || 1;
    const validHeight = Math.max(1, Math.floor(sliceHeight)) || 1;
    
    if (!isFinite(validWidth) || !isFinite(validHeight) || validWidth <= 0 || validHeight <= 0) {
      ctx.fillStyle = '#ff6b6b';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Invalid slice dimensions: ${sliceWidth}x${sliceHeight}`, width / 2, height / 2);
      return;
    }

    const preset = WINDOW_LEVEL_PRESETS[windowLevel] || WINDOW_LEVEL_PRESETS.soft_tissue;
    const normalizedSlice = normalizeSlice(data, niftiData.sclSlope, niftiData.sclInter || 0, preset.window, preset.level);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = validWidth;
    tempCanvas.height = validHeight;
    const tempCtx = tempCanvas.getContext('2d');
    const tempImageData = tempCtx.createImageData(validWidth, validHeight);
    
    for (let i = 0; i < normalizedSlice.length; i++) {
      const idx = i * 4;
      const gray = normalizedSlice[i];
      tempImageData.data[idx] = gray;
      tempImageData.data[idx + 1] = gray;
      tempImageData.data[idx + 2] = gray;
      tempImageData.data[idx + 3] = 255;
    }
    tempCtx.putImageData(tempImageData, 0, 0);

    const scale = Math.min(width / validWidth, height / validHeight);
    const scaledWidth = validWidth * scale;
    const scaledHeight = validHeight * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(tempCanvas, offsetX, offsetY, scaledWidth, scaledHeight);

    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [currentSlice, currentView, dataVersion, loading, error, windowLevel, canvasSize]);

  // Throttle wheel events to prevent rapid updates
  const wheelTimeoutRef = useRef(null);
  const lastWheelTimeRef = useRef(0);
  const currentSliceRef = useRef(currentSlice);
  const actualTotalSlicesRef = useRef(actualTotalSlices);
  const totalSlicesRef = useRef(totalSlices);
  
  // Keep refs in sync
  useEffect(() => {
    currentSliceRef.current = currentSlice;
  }, [currentSlice]);
  
  useEffect(() => {
    actualTotalSlicesRef.current = actualTotalSlices;
  }, [actualTotalSlices]);
  
  useEffect(() => {
    totalSlicesRef.current = totalSlices;
  }, [totalSlices]);
  
  const handleWheel = useCallback((e) => {
    if (!onSliceChange) return;
    e.preventDefault();
    
    const now = Date.now();
    const timeSinceLastWheel = now - lastWheelTimeRef.current;
    
    // Throttle to max 1 update per 50ms
    if (timeSinceLastWheel < 50) {
      return;
    }
    
    // Clear any pending timeout
    if (wheelTimeoutRef.current) {
      clearTimeout(wheelTimeoutRef.current);
      wheelTimeoutRef.current = null;
    }
    
    lastWheelTimeRef.current = now;
    
    const delta = e.deltaY > 0 ? 1 : -1;
    const niftiData = niftiDataRef.current;
    const maxSlices = niftiData ? actualTotalSlicesRef.current : totalSlicesRef.current;
    const currentSliceValue = currentSliceRef.current;
    const newSlice = currentSliceValue + delta;
    const clampedSlice = Math.max(1, Math.min(maxSlices, newSlice));
    
    // Only update if slice actually changed
    if (clampedSlice !== currentSliceValue) {
      onSliceChange(clampedSlice);
    }
  }, [onSliceChange]); // Only depend on onSliceChange which should be stable

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#000000',
        position: 'relative'
      }}
      onWheel={handleWheel}
    >
      {/* Viewer Canvas */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          minWidth: 0,
          minHeight: 0
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            cursor: 'crosshair'
          }}
        />
      </div>

      {/* Slice Indicator - Only show when data is fully loaded and slice count is calculated */}
      {(() => {
        const niftiData = niftiDataRef.current;
        if (loading || !niftiData || !niftiData.dimensions) return null;
        
        const { dimensions } = niftiData;
        let expectedSlices = 20;
        if (currentView === 'axial') expectedSlices = dimensions.z;
        else if (currentView === 'sagittal') expectedSlices = dimensions.x;
        else if (currentView === 'coronal') expectedSlices = dimensions.y;
        
        // Only show if actualTotalSlices matches expected (meaning it's been calculated)
        if (actualTotalSlices !== expectedSlices) return null;
        
        return (
          <div
            style={{
              position: 'absolute',
              top: '0.5rem',
              left: '0.5rem',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'var(--text-primary)',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              zIndex: 10
            }}
          >
            Slice: {currentSlice} / {actualTotalSlices}
          </div>
        );
      })()}

      {/* View Selector - Vertically stacked below slice indicator */}
      <ViewSelector
        currentView={currentView}
        onViewChange={onViewChange}
        niftiData={niftiDataRef.current}
        windowLevel={windowLevel}
      />
    </div>
  );
}

