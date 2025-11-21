'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import CTViewer from '@/components/viewer/CTViewer';
import ViewerControls from '@/components/viewer/ViewerControls';
import ReportEditor from '@/components/report/ReportEditor';
import FullScreenViewer from '@/components/modals/FullScreenViewer';
import { loadNiftiFile, calculateTargetSliceCount } from '@/utils/niftiLoader';
import { getNiftiFileUrl } from '@/utils/niftiFileUrl';

export default function ZoneA_Workspace() {
  const [currentSlice, setCurrentSlice] = useState(1);
  const [windowLevel, setWindowLevel] = useState('soft_tissue');
  const [currentView, setCurrentView] = useState('axial'); // 'axial', 'sagittal', 'coronal'
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [totalSlices, setTotalSlices] = useState(20); // Will be updated when NIfTI loads
  const [loading, setLoading] = useState(true);
  const [niftiDataVersion, setNiftiDataVersion] = useState(0); // Version counter to trigger re-renders
  
  // Store the actual volume data in a ref to avoid React DevTools serialization issues
  const niftiDataRef = useRef(null);
  
  // Track last slice for each view
  const [viewSlices, setViewSlices] = useState({
    axial: null,
    sagittal: null,
    coronal: null
  });
  
  // Memoized wrapper for niftiData to prevent unnecessary re-renders
  // Creates a wrapper with non-enumerable volume to prevent React DevTools serialization
  const niftiDataWrapper = useMemo(() => {
    const data = niftiDataRef.current;
    if (!data) return null;
    
    // Create a new object with all properties except volume
    const { volume, ...rest } = data;
    const wrapper = { ...rest };
    
    // Add volume as a non-enumerable property to prevent React DevTools serialization
    Object.defineProperty(wrapper, 'volume', {
      value: volume,
      enumerable: false,
      writable: false,
      configurable: false
    });
    
    return wrapper;
  }, [niftiDataVersion]); // Only recreate when data version changes
  
  // Getter function for use in effects
  const getNiftiData = useCallback(() => niftiDataRef.current, []);

  // Load NIfTI file once and share between regular and fullscreen views
  useEffect(() => {
    let cancelled = false;
    
    const loadFile = async () => {
      try {
        setLoading(true);
        const data = await loadNiftiFile(getNiftiFileUrl());
        
        if (cancelled) return;
        
        // Store in ref instead of state to avoid React DevTools serialization
        niftiDataRef.current = data;
        setLoading(false);
        setNiftiDataVersion(prev => prev + 1); // Trigger re-render
        
        const { dimensions } = data;
        let maxSlices = 20;
        
        if (currentView === 'axial') {
          maxSlices = dimensions.z;
        } else if (currentView === 'sagittal') {
          maxSlices = calculateTargetSliceCount(data, 'sagittal');
        } else if (currentView === 'coronal') {
          maxSlices = calculateTargetSliceCount(data, 'coronal');
        }

        setTotalSlices(maxSlices);
        
        // Initialize slices for all views to mid-slice on first load
        const axialSlices = dimensions.z;
        const sagittalSlices = calculateTargetSliceCount(data, 'sagittal');
        const coronalSlices = calculateTargetSliceCount(data, 'coronal');
        
        const initialSlices = {
          axial: Math.ceil(axialSlices / 2),
          sagittal: Math.ceil(sagittalSlices / 2),
          coronal: Math.ceil(coronalSlices / 2)
        };
        setViewSlices(initialSlices);
        
        // Set current slice to mid-slice for initial view
        setCurrentSlice(initialSlices[currentView]);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load NIfTI file:', err);
        setLoading(false);
      }
    };

    loadFile();
    
    return () => {
      cancelled = true;
    };
  }, []); // Only load once on mount

  // Track current slice per view when it changes (but not when view changes)
  const prevViewRef = useRef(currentView);
  useEffect(() => {
    const niftiData = getNiftiData();
    if (niftiData && currentSlice && prevViewRef.current === currentView) {
      setViewSlices(prev => ({
        ...prev,
        [currentView]: currentSlice
      }));
    }
    prevViewRef.current = currentView;
  }, [currentSlice, currentView, niftiDataVersion]);

  // Update total slices and restore last slice when view changes
  const prevViewForSliceRestore = useRef(currentView);
  const viewSlicesRef = useRef(viewSlices);
  
  // Keep ref in sync with state
  useEffect(() => {
    viewSlicesRef.current = viewSlices;
  }, [viewSlices]);
  
  useEffect(() => {
    const niftiData = getNiftiData();
    if (niftiData) {
      const { dimensions } = niftiData;
      let maxSlices = 20;
      
      if (currentView === 'axial') {
        maxSlices = dimensions.z;
      } else if (currentView === 'sagittal') {
        maxSlices = dimensions.x;
      } else if (currentView === 'coronal') {
        maxSlices = dimensions.y;
      }
      
      setTotalSlices(maxSlices);
      
      // Only restore slice if view actually changed (not on initial load)
      if (prevViewForSliceRestore.current !== currentView) {
        const lastSlice = viewSlicesRef.current[currentView];
        if (lastSlice) {
          // Clamp to valid range
          const clampedSlice = Math.max(1, Math.min(maxSlices, lastSlice));
          setCurrentSlice(clampedSlice);
        } else {
          // First time viewing this view - use mid-slice
          const midSlice = Math.ceil(maxSlices / 2);
          setCurrentSlice(midSlice);
          setViewSlices(prev => ({
            ...prev,
            [currentView]: midSlice
          }));
        }
        prevViewForSliceRestore.current = currentView;
      }
    }
  }, [currentView, niftiDataVersion]); // Removed viewSlices from dependencies

  const handleMaximize = () => {
    setIsFullScreen(true);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
  };

  return (
    <>
      <div className="zone-a">
        {/* Left Panel: CT Viewer */}
        <div 
          className="workspace-panel-left"
          style={{
            width: '50%',
            height: '100%',
            borderRight: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0 // Allow flex shrinking
          }}
        >
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <CTViewer 
              currentSlice={currentSlice}
              totalSlices={totalSlices}
              onSliceChange={setCurrentSlice}
              onTotalSlicesChange={setTotalSlices}
              currentView={currentView}
              onViewChange={setCurrentView}
              windowLevel={windowLevel}
              onMaximize={handleMaximize}
              niftiData={niftiDataWrapper}
              loading={loading}
            />
          </div>
          <ViewerControls
            currentSlice={currentSlice}
            totalSlices={totalSlices}
            onSliceChange={setCurrentSlice}
            windowLevel={windowLevel}
            onWindowLevelChange={setWindowLevel}
            onMaximize={handleMaximize}
            isMaximized={isFullScreen}
          />
        </div>

        {/* Right Panel: Report Editor */}
        <div 
          className="workspace-panel-right"
          style={{
            width: '50%',
            height: '100%',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <ReportEditor />
        </div>
      </div>

      {/* Full Screen Viewer Modal */}
      {isFullScreen && (
        <FullScreenViewer
          isOpen={isFullScreen}
          onClose={handleCloseFullScreen}
          currentSlice={currentSlice}
          onSliceChange={setCurrentSlice}
          windowLevel={windowLevel}
          onWindowLevelChange={setWindowLevel}
          currentView={currentView}
          onViewChange={setCurrentView}
          totalSlices={totalSlices}
          niftiData={niftiDataWrapper}
          loading={loading}
        />
      )}
    </>
  );
}

