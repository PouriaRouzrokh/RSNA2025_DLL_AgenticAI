"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import ViewSelector from "./ViewSelector";
import { extractSlice, normalizeSlice, WINDOW_LEVEL_PRESETS, calculateTargetSliceCount } from "@/utils/niftiLoader";

export default function CTViewer({
  currentSlice = 1,
  totalSlices = 20,
  onSliceChange,
  onTotalSlicesChange,
  currentView = "axial",
  onViewChange,
  windowLevel = "soft_tissue",
  onMaximize,
  niftiData: externalNiftiData = null,
  loading: externalLoading = false,
  onDownloadClick,
  downloadTriggered = false,
  isLoadingFromCache = false,
  hasCachedData = false,
  useCloudFiles = false,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 512, height: 512 });
  // Store niftiData in ref to avoid React DevTools serialization issues with large arrays
  const niftiDataRef = useRef(externalNiftiData);
  // Derive loading state directly from props
  const loading = externalNiftiData ? false : externalLoading;
  const [error, setError] = useState(null);
  const [dataVersion, setDataVersion] = useState(0); // Version counter to trigger re-renders
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  
  // Help dialog state
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  
  // Show download button when no data is loaded and download hasn't been triggered
  const showDownloadButton = !externalNiftiData && !loading && !downloadTriggered;

  useEffect(() => {
    if (externalNiftiData) {
      niftiDataRef.current = externalNiftiData;
      setDataVersion((prev) => prev + 1);
    }
  }, [externalNiftiData]);

  // Create render-safe version of niftiData (without volume array) using useMemo
  const niftiDataForRender = useMemo(() => {
    if (!externalNiftiData) return null;
    const { volume, ...rest } = externalNiftiData;
    return rest;
  }, [externalNiftiData]);

  // Compute total slices using useMemo
  const actualTotalSlices = useMemo(() => {
    const niftiData = niftiDataRef.current;
    if (!niftiData) return totalSlices;

    const { dimensions } = niftiData;
    if (currentView === "axial") {
      return dimensions.z;
    } else if (currentView === "sagittal") {
      return calculateTargetSliceCount(niftiData, "sagittal");
    } else if (currentView === "coronal") {
      return calculateTargetSliceCount(niftiData, "coronal");
    }
    return totalSlices;
    // dataVersion is used to trigger recomputation when niftiData changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, dataVersion, totalSlices]);

  // Call callback when total slices change
  useEffect(() => {
    if (onTotalSlicesChange && actualTotalSlices !== totalSlices) {
      onTotalSlicesChange(actualTotalSlices);
    }
  }, [actualTotalSlices, onTotalSlicesChange, totalSlices]);

  // Getter for niftiData (for effects/callbacks - not render)
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
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // Render slice on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    if (loading) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px monospace";
      ctx.textAlign = "center";
      let loadingText;
      if (!useCloudFiles) {
        // Local files - always loading, never downloading
        loadingText = "Loading CT scan study...";
      } else if (isLoadingFromCache) {
        // Cloud files with cache
        loadingText = "Loading CT scan study from cache...";
      } else {
        // Cloud files without cache - downloading
        loadingText = "Downloading CT scan study...";
      }
      ctx.fillText(loadingText, width / 2, height / 2);
      return;
    }

    const niftiData = niftiDataRef.current;
    if (error || !niftiData) {
      ctx.fillStyle = "#ff6b6b";
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.fillText(error ? `Error: ${error}` : "No data available", width / 2, height / 2);
      return;
    }

    const sliceInfo = extractSlice(niftiData, currentView, currentSlice - 1);
    const { data, width: sliceWidth, height: sliceHeight } = sliceInfo;

    // Validate slice dimensions before creating image data
    const validWidth = Math.max(1, Math.floor(sliceWidth)) || 1;
    const validHeight = Math.max(1, Math.floor(sliceHeight)) || 1;

    if (!isFinite(validWidth) || !isFinite(validHeight) || validWidth <= 0 || validHeight <= 0) {
      ctx.fillStyle = "#ff6b6b";
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`Invalid slice dimensions: ${sliceWidth}x${sliceHeight}`, width / 2, height / 2);
      return;
    }

    const preset = WINDOW_LEVEL_PRESETS[windowLevel] || WINDOW_LEVEL_PRESETS.soft_tissue;
    const normalizedSlice = normalizeSlice(
      data,
      niftiData.sclSlope,
      niftiData.sclInter || 0,
      preset.window,
      preset.level
    );

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = validWidth;
    tempCanvas.height = validHeight;
    const tempCtx = tempCanvas.getContext("2d");
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

    // Calculate base scale (fit to canvas)
    const baseScale = Math.min(width / validWidth, height / validHeight);
    
    // Apply zoom
    const finalScale = baseScale * zoom;
    const scaledWidth = validWidth * finalScale;
    const scaledHeight = validHeight * finalScale;
    
    // Calculate center offset
    const baseOffsetX = (width - scaledWidth) / 2;
    const baseOffsetY = (height - scaledHeight) / 2;
    
    // Apply pan offset (always allow panning, but it's most useful when zoomed in)
    const offsetX = baseOffsetX + panOffset.x;
    const offsetY = baseOffsetY + panOffset.y;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(tempCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
  }, [currentSlice, currentView, dataVersion, loading, error, windowLevel, canvasSize, zoom, panOffset, isLoadingFromCache]);

  // Throttle wheel events to prevent rapid updates
  const wheelTimeoutRef = useRef(null);
  const lastWheelTimeRef = useRef(0);
  const currentSliceRef = useRef(currentSlice);
  const actualTotalSlicesRef = useRef(actualTotalSlices);
  const totalSlicesRef = useRef(totalSlices);
  
  // Mouse drag state for slice scrolling (left click) or zooming (Ctrl + left click)
  const isMouseDownRef = useRef(false);
  const lastMouseYRef = useRef(0);
  const lastMouseMoveTimeRef = useRef(0);
  const isZoomingRef = useRef(false); // Track if Ctrl is held during left click
  
  // Right-click pan state
  const isRightMouseDownRef = useRef(false);
  const lastPanMousePosRef = useRef({ x: 0, y: 0 });

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

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Check if Ctrl key is pressed (or Cmd on Mac)
      const isZoomMode = e.ctrlKey || e.metaKey;

      if (isZoomMode) {
        // Zoom mode: Ctrl + scroll
        const zoomFactor = 1.1;
        const delta = e.deltaY > 0 ? 1 / zoomFactor : zoomFactor;
        
        setZoom((prevZoom) => {
          const newZoom = prevZoom * delta;
          // Clamp zoom between 0.5x and 5x
          const clampedZoom = Math.max(0.5, Math.min(5.0, newZoom));
          
          // Reset pan when zooming back to 1.0 or below
          if (clampedZoom <= 1.0) {
            setPanOffset({ x: 0, y: 0 });
          }
          
          return clampedZoom;
        });
      } else {
        // Slice scrolling mode: normal scroll
        if (!onSliceChange) return;

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
      }
    },
    [onSliceChange]
  ); // Only depend on onSliceChange which should be stable

  // Helper function to update slice based on movement
  const updateSliceFromMovement = useCallback(
    (deltaY) => {
      if (!onSliceChange) return;

      const now = Date.now();
      const timeSinceLastMove = now - lastMouseMoveTimeRef.current;

      // Throttle to max 1 update per 50ms
      if (timeSinceLastMove < 50) {
        return;
      }

      lastMouseMoveTimeRef.current = now;

      // Moving up (negative deltaY) should decrease slice number
      // Moving down (positive deltaY) should increase slice number
      // Scale the movement: every 5 pixels of movement = 1 slice change
      const sliceDelta = Math.round(-deltaY / 5);
      
      if (sliceDelta === 0) return;

      const niftiData = niftiDataRef.current;
      const maxSlices = niftiData ? actualTotalSlicesRef.current : totalSlicesRef.current;
      const currentSliceValue = currentSliceRef.current;
      const newSlice = currentSliceValue + sliceDelta;
      const clampedSlice = Math.max(1, Math.min(maxSlices, newSlice));

      // Only update if slice actually changed
      if (clampedSlice !== currentSliceValue) {
        onSliceChange(clampedSlice);
      }
    },
    [onSliceChange]
  );

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e) => {
      // Don't start drag if clicking on the download button
      if (showDownloadButton) return;
      
      e.preventDefault();
      
      // Handle left mouse button
      if (e.button === 0) {
        const isCtrlPressed = e.ctrlKey || e.metaKey;
        
        if (isCtrlPressed) {
          // Ctrl + Left Click: Zoom mode
          isMouseDownRef.current = true;
          isZoomingRef.current = true;
          setIsZooming(true);
          lastMouseYRef.current = e.clientY;
          
          // Add global mouse event listeners for zooming
          const handleGlobalMouseMove = (moveEvent) => {
            if (!isMouseDownRef.current || !isZoomingRef.current) return;
            const currentY = moveEvent.clientY;
            const deltaY = lastMouseYRef.current - currentY; // Inverted: drag up = zoom in
            
            // Zoom factor: every 10 pixels = 10% zoom change
            const zoomDelta = deltaY * 0.01;
            
            setZoom((prevZoom) => {
              const newZoom = prevZoom + zoomDelta;
              // Clamp zoom between 0.5x and 5x
              const clampedZoom = Math.max(0.5, Math.min(5.0, newZoom));
              
              // Reset pan when zooming back to 1.0 or below
              if (clampedZoom <= 1.0) {
                setPanOffset({ x: 0, y: 0 });
              }
              
              return clampedZoom;
            });
            
            lastMouseYRef.current = currentY;
          };

          const handleGlobalMouseUp = (upEvent) => {
            if (upEvent.button === 0) {
              isMouseDownRef.current = false;
              isZoomingRef.current = false;
              setIsZooming(false);
              window.removeEventListener("mousemove", handleGlobalMouseMove);
              window.removeEventListener("mouseup", handleGlobalMouseUp);
            }
          };

          window.addEventListener("mousemove", handleGlobalMouseMove);
          window.addEventListener("mouseup", handleGlobalMouseUp);
        } else {
          // Normal Left Click: Slice scrolling
          isMouseDownRef.current = true;
          isZoomingRef.current = false;
          setIsZooming(false);
          lastMouseYRef.current = e.clientY;
          lastMouseMoveTimeRef.current = Date.now();

          // Add global mouse event listeners for smooth dragging outside viewer bounds
          const handleGlobalMouseMove = (moveEvent) => {
            if (!isMouseDownRef.current || isZoomingRef.current) return;
            const currentY = moveEvent.clientY;
            const deltaY = currentY - lastMouseYRef.current;
            
            if (Math.abs(deltaY) > 0) {
              updateSliceFromMovement(deltaY);
              lastMouseYRef.current = currentY;
            }
          };

          const handleGlobalMouseUp = (upEvent) => {
            if (upEvent.button === 0) {
              isMouseDownRef.current = false;
              isZoomingRef.current = false;
              window.removeEventListener("mousemove", handleGlobalMouseMove);
              window.removeEventListener("mouseup", handleGlobalMouseUp);
            }
          };

          window.addEventListener("mousemove", handleGlobalMouseMove);
          window.addEventListener("mouseup", handleGlobalMouseUp);
        }
      }
      // Handle right mouse button for panning
      else if (e.button === 2) {
        isRightMouseDownRef.current = true;
        setIsPanning(true);
        lastPanMousePosRef.current = { x: e.clientX, y: e.clientY };

        // Add global mouse event listeners for panning
        const handleGlobalMouseMove = (moveEvent) => {
          if (!isRightMouseDownRef.current) return;
          const currentX = moveEvent.clientX;
          const currentY = moveEvent.clientY;
          const deltaX = currentX - lastPanMousePosRef.current.x;
          const deltaY = currentY - lastPanMousePosRef.current.y;
          
          setPanOffset((prev) => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY,
          }));
          
          lastPanMousePosRef.current = { x: currentX, y: currentY };
        };

        const handleGlobalMouseUp = (upEvent) => {
          if (upEvent.button === 2) {
            isRightMouseDownRef.current = false;
            setIsPanning(false);
            window.removeEventListener("mousemove", handleGlobalMouseMove);
            window.removeEventListener("mouseup", handleGlobalMouseUp);
          }
        };

        window.addEventListener("mousemove", handleGlobalMouseMove);
        window.addEventListener("mouseup", handleGlobalMouseUp);
      }
    },
    [showDownloadButton, updateSliceFromMovement]
  );

  // Handle mouse move (for local movement within viewer)
  const handleMouseMove = useCallback(
    (e) => {
      // Handle left-click zooming (Ctrl + drag)
      if (isMouseDownRef.current && isZoomingRef.current) {
        e.preventDefault();
        const currentY = e.clientY;
        const deltaY = lastMouseYRef.current - currentY; // Inverted: drag up = zoom in
        
        // Zoom factor: every 10 pixels = 10% zoom change
        const zoomDelta = deltaY * 0.01;
        
        setZoom((prevZoom) => {
          const newZoom = prevZoom + zoomDelta;
          const clampedZoom = Math.max(0.5, Math.min(5.0, newZoom));
          
          if (clampedZoom <= 1.0) {
            setPanOffset({ x: 0, y: 0 });
          }
          
          return clampedZoom;
        });
        
        lastMouseYRef.current = currentY;
      }
      // Handle left-click slice scrolling (normal drag)
      else if (isMouseDownRef.current && !isZoomingRef.current) {
        e.preventDefault();
        const currentY = e.clientY;
        const deltaY = currentY - lastMouseYRef.current;
        
        if (Math.abs(deltaY) > 0) {
          updateSliceFromMovement(deltaY);
          lastMouseYRef.current = currentY;
        }
      }
      // Handle right-click panning
      else if (isRightMouseDownRef.current) {
        e.preventDefault();
        const currentX = e.clientX;
        const currentY = e.clientY;
        const deltaX = currentX - lastPanMousePosRef.current.x;
        const deltaY = currentY - lastPanMousePosRef.current.y;
        
        setPanOffset((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));
        
        lastPanMousePosRef.current = { x: currentX, y: currentY };
      }
    },
    [updateSliceFromMovement]
  );

  // Handle mouse up
  const handleMouseUp = useCallback((e) => {
    if (e.button === 0) {
      isMouseDownRef.current = false;
      isZoomingRef.current = false;
      setIsZooming(false);
    } else if (e.button === 2) {
      isRightMouseDownRef.current = false;
      setIsPanning(false);
    }
  }, []);

  // Handle mouse leave (in case mouse is released outside viewer)
  const handleMouseLeave = useCallback(() => {
    isMouseDownRef.current = false;
    isZoomingRef.current = false;
    setIsZooming(false);
    isRightMouseDownRef.current = false;
    setIsPanning(false);
  }, []);
  
  // Reset pan when slice changes
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
  }, [currentSlice, currentView]);

  // Handle Escape key to close help dialog
  useEffect(() => {
    if (!showHelpDialog) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setShowHelpDialog(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showHelpDialog]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#000000",
        position: "relative",
        userSelect: "none", // Prevent text selection during drag
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => {
        // Always prevent context menu when right-clicking (for panning functionality)
        // This allows smooth panning without context menu interference
        e.preventDefault();
      }}
    >
      {/* Viewer Canvas */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          minWidth: 0,
          minHeight: 0,
        }}
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            cursor: showDownloadButton 
              ? "pointer" 
              : isPanning 
                ? "grabbing" 
                : isZooming
                  ? "ns-resize"
                  : (zoom > 1.0 ? "grab" : "crosshair"),
          }}
        />
        
        {/* Download Button - Centered overlay */}
        {showDownloadButton && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <button
              onClick={onDownloadClick}
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: "500",
                color: "#ffffff",
                backgroundColor: "#3b82f6",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#2563eb";
                e.target.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#3b82f6";
                e.target.style.transform = "scale(1)";
              }}
            >
              {hasCachedData ? "Load CT Data" : "Download CT Data"}
            </button>
            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                textAlign: "center",
                maxWidth: "300px",
              }}
            >
              {hasCachedData
                ? "Click to load the CT scan study from cache"
                : "Click to download the CT scan study"}
            </div>
          </div>
        )}
      </div>

      {/* Slice Indicator - Only show when data is fully loaded and slice count is calculated */}
      {(() => {
        // Use state instead of ref for render
        if (loading || !niftiDataForRender || !niftiDataForRender.dimensions) return null;

        const { dimensions } = niftiDataForRender;
        let expectedSlices = 20;
        if (currentView === "axial") expectedSlices = dimensions.z;
        else if (currentView === "sagittal") expectedSlices = dimensions.x;
        else if (currentView === "coronal") expectedSlices = dimensions.y;

        // Only show if actualTotalSlices matches expected (meaning it's been calculated)
        if (actualTotalSlices !== expectedSlices) return null;

        return (
          <div
            style={{
              position: "absolute",
              top: "0.5rem",
              left: "0.5rem",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "var(--text-primary)",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontFamily: "monospace",
              zIndex: 10,
            }}
          >
            Slice: {currentSlice} / {actualTotalSlices}
          </div>
        );
      })()}

      {/* Help Button - Symmetric to slice indicator on the right side */}
      {!loading && externalNiftiData && (
        <button
          onClick={() => setShowHelpDialog(true)}
          style={{
            position: "absolute",
            top: "0.5rem",
            right: "0.5rem",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "var(--text-primary)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            fontSize: "0.75rem",
            fontFamily: "monospace",
            cursor: "pointer",
            zIndex: 10,
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
            e.target.style.borderColor = "rgba(255, 255, 255, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
            e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
          }}
        >
          <span>?</span>
          <span>Help</span>
        </button>
      )}

      {/* Help Dialog */}
      {showHelpDialog && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowHelpDialog(false);
            }
          }}
        >
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "1.5rem",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                }}
              >
                CT Viewer Navigation Guide
              </h3>
              <button
                onClick={() => setShowHelpDialog(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  padding: "0",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "4px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "var(--bg-tertiary)";
                  e.target.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "var(--text-secondary)";
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                fontSize: "0.875rem",
                color: "var(--text-primary)",
                lineHeight: "1.6",
              }}
            >
              {/* Navigate Slices */}
              <div>
                <div
                  style={{
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                    color: "var(--text-primary)",
                    fontSize: "0.9375rem",
                  }}
                >
                  Navigate Through Slices
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1.25rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <li>Scroll wheel: Move forward/backward through slices</li>
                  <li>Left-click + drag up/down: Navigate through slices</li>
                </ul>
              </div>

              {/* Zoom */}
              <div>
                <div
                  style={{
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                    color: "var(--text-primary)",
                    fontSize: "0.9375rem",
                  }}
                >
                  Zoom In/Out
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1.25rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <li>Hold Ctrl (or Cmd on Mac) + left-click + drag up/down: Zoom in/out</li>
                  <li>Drag up to zoom in, drag down to zoom out</li>
                  <li>Zoom range: 0.5x to 5x</li>
                </ul>
              </div>

              {/* Pan */}
              <div>
                <div
                  style={{
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                    color: "var(--text-primary)",
                    fontSize: "0.9375rem",
                  }}
                >
                  Pan Image
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1.25rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <li>Right-click + drag: Move the field of view left/right/up/down</li>
                  <li>Useful for exploring different parts of the scan when zoomed in</li>
                </ul>
              </div>

              {/* View Selection */}
              <div>
                <div
                  style={{
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                    color: "var(--text-primary)",
                    fontSize: "0.9375rem",
                  }}
                >
                  Change View
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1.25rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <li>Use the view selector buttons below the viewer</li>
                  <li>Switch between Axial, Sagittal, and Coronal views</li>
                </ul>
              </div>

              {/* Tips */}
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.75rem",
                  backgroundColor: "var(--bg-tertiary)",
                  borderRadius: "4px",
                  borderLeft: "3px solid #3b82f6",
                }}
              >
                <div
                  style={{
                    fontWeight: "600",
                    marginBottom: "0.25rem",
                    color: "var(--text-primary)",
                    fontSize: "0.875rem",
                  }}
                >
                  💡 Tip
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                  Pan offset automatically resets when you change slices or views for easier navigation.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Selector - Vertically stacked below slice indicator */}
      <ViewSelector
        currentView={currentView}
        onViewChange={onViewChange}
        niftiData={externalNiftiData}
        windowLevel={windowLevel}
      />
    </div>
  );
}
