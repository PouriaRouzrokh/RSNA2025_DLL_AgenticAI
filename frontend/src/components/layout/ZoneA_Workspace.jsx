"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import CTViewer from "@/components/viewer/CTViewer";
import ViewerControls from "@/components/viewer/ViewerControls";
import ReportEditor from "@/components/report/ReportEditor";
import FullScreenViewer from "@/components/modals/FullScreenViewer";
import { loadNiftiFile, calculateTargetSliceCount } from "@/utils/niftiLoader";
import { getNiftiFileUrl, shouldUseCloudFiles } from "@/utils/niftiFileUrl";
import { hasCachedData } from "@/utils/niftiCache";

export default function ZoneA_Workspace() {
  const [currentSlice, setCurrentSlice] = useState(1);
  const [windowLevel, setWindowLevel] = useState("soft_tissue");
  const [currentView, setCurrentView] = useState("axial"); // 'axial', 'sagittal', 'coronal'
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [totalSlices, setTotalSlices] = useState(20); // Will be updated when NIfTI loads
  const [loading, setLoading] = useState(false); // Start as false - don't load automatically
  const [niftiDataVersion, setNiftiDataVersion] = useState(0); // Version counter to trigger re-renders
  const [downloadTriggered, setDownloadTriggered] = useState(false); // Track if download has been triggered
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(false); // Track if loading from cache
  const [hasCachedDataState, setHasCachedDataState] = useState(false); // Track if cached data exists
  const [useCloudFiles, setUseCloudFiles] = useState(false); // Track if using cloud files

  // Store the actual volume data in a ref to avoid React DevTools serialization issues
  const niftiDataRef = useRef(null);
  const [niftiDataWrapper, setNiftiDataWrapper] = useState(null);

  // Track last slice for each view
  const [viewSlices, setViewSlices] = useState({
    axial: null,
    sagittal: null,
    coronal: null,
  });

  // Check cache on mount to determine button text
  useEffect(() => {
    const checkCache = async () => {
      try {
        const fileUrl = getNiftiFileUrl();
        const useCloud = shouldUseCloudFiles();
        setUseCloudFiles(useCloud);
        
        // If using local files, always show "Load" (no download needed)
        if (!useCloud) {
          setHasCachedDataState(true);
          return;
        }
        
        // If using cloud files, check if cache exists
        const hasCache = await hasCachedData(fileUrl);
        setHasCachedDataState(hasCache);
      } catch (error) {
        console.error('Error checking cache:', error);
        // On error, check if using local files
        const useCloud = shouldUseCloudFiles();
        setHasCachedDataState(!useCloud); // Show "Load" for local, "Download" for cloud on error
      }
    };
    checkCache();
  }, []);

  // Getter function for use in effects
  const getNiftiData = useCallback(() => niftiDataRef.current, []);

  // Update wrapper when data version changes (called from effect, not during render)
  const updateNiftiDataWrapper = useCallback(() => {
    const data = niftiDataRef.current;
    if (!data) {
      setNiftiDataWrapper(null);
      return;
    }

    // Create a new object with all properties except volume
    const { volume, ...rest } = data;
    const wrapper = { ...rest };

    // Add volume as a non-enumerable property to prevent React DevTools serialization
    Object.defineProperty(wrapper, "volume", {
      value: volume,
      enumerable: false,
      writable: false,
      configurable: false,
    });

    setNiftiDataWrapper(wrapper);
  }, []);

  // Load NIfTI file when download is triggered
  useEffect(() => {
    if (!downloadTriggered) return; // Don't load until button is clicked

    let cancelled = false;

        const loadFile = async () => {
      try {
        setLoading(true);
        const fileUrl = getNiftiFileUrl();
        
        // Check if using cloud files
        const useCloud = shouldUseCloudFiles();
        
        // Check if data exists in cache (only relevant for cloud files)
        if (useCloud) {
          const hasCache = await hasCachedData(fileUrl);
          setIsLoadingFromCache(hasCache);
        } else {
          // Local files - not loading from cache, just loading locally
          setIsLoadingFromCache(false);
        }
        
        const data = await loadNiftiFile(fileUrl);

        if (cancelled) return;

        // After loading, check if cache now exists (it should, since we just cached it)
        // This updates the button text for next time
        // Wait a bit for IndexedDB to finish writing
        await new Promise(resolve => setTimeout(resolve, 100));
        const cacheNowExists = await hasCachedData(fileUrl);
        if (cacheNowExists) {
          setHasCachedDataState(true);
        }

        // Store in ref instead of state to avoid React DevTools serialization
        niftiDataRef.current = data;

        // Update wrapper (not during render, so safe to access ref)
        const { volume, ...rest } = data;
        const wrapper = { ...rest };
        Object.defineProperty(wrapper, "volume", {
          value: volume,
          enumerable: false,
          writable: false,
          configurable: false,
        });
        setNiftiDataWrapper(wrapper);
        setNiftiDataVersion((prev) => prev + 1); // Trigger re-render

        const { dimensions } = data;
        let maxSlices = 20;

        if (currentView === "axial") {
          maxSlices = dimensions.z;
        } else if (currentView === "sagittal") {
          maxSlices = calculateTargetSliceCount(data, "sagittal");
        } else if (currentView === "coronal") {
          maxSlices = calculateTargetSliceCount(data, "coronal");
        }

        // Initialize slices for all views to mid-slice on first load
        const axialSlices = dimensions.z;
        const sagittalSlices = calculateTargetSliceCount(data, "sagittal");
        const coronalSlices = calculateTargetSliceCount(data, "coronal");

        const initialSlices = {
          axial: Math.ceil(axialSlices / 2),
          sagittal: Math.ceil(sagittalSlices / 2),
          coronal: Math.ceil(coronalSlices / 2),
        };

        // Batch state updates to avoid cascading renders
        setTotalSlices(maxSlices);
        setViewSlices(initialSlices);
        setCurrentSlice(initialSlices[currentView]);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load CT scan study:", err);
        setLoading(false);
      }
    };

    loadFile();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downloadTriggered]); // Load when downloadTriggered changes

  // Function to trigger download
  const handleDownloadClick = useCallback(() => {
    setDownloadTriggered(true);
  }, []);

  // Track current slice per view when it changes (but not when view changes)
  const prevViewRef = useRef(currentView);
  useEffect(() => {
    const niftiData = getNiftiData();
    if (niftiData && currentSlice && prevViewRef.current === currentView) {
      // Use functional update to avoid dependency on currentView
      setViewSlices((prev) => ({
        ...prev,
        [currentView]: currentSlice,
      }));
    }
    prevViewRef.current = currentView;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (currentView === "axial") {
        maxSlices = dimensions.z;
      } else if (currentView === "sagittal") {
        maxSlices = dimensions.x;
      } else if (currentView === "coronal") {
        maxSlices = dimensions.y;
      }

      // Only restore slice if view actually changed (not on initial load)
      if (prevViewForSliceRestore.current !== currentView) {
        const lastSlice = viewSlicesRef.current[currentView];
        if (lastSlice) {
          // Clamp to valid range
          const clampedSlice = Math.max(1, Math.min(maxSlices, lastSlice));
          // Batch state updates
          setTotalSlices(maxSlices);
          setCurrentSlice(clampedSlice);
        } else {
          // First time viewing this view - use mid-slice
          const midSlice = Math.ceil(maxSlices / 2);
          // Batch state updates
          setTotalSlices(maxSlices);
          setCurrentSlice(midSlice);
          setViewSlices((prev) => ({
            ...prev,
            [currentView]: midSlice,
          }));
        }
        prevViewForSliceRestore.current = currentView;
      } else {
        // View didn't change, just update total slices if needed
        setTotalSlices(maxSlices);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, niftiDataVersion]); // Removed viewSlices and getNiftiData from dependencies

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
            width: "50%",
            height: "100%",
            borderRight: "1px solid var(--border-subtle)",
            backgroundColor: "var(--bg-secondary)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0, // Allow flex shrinking
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
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
              onDownloadClick={handleDownloadClick}
              downloadTriggered={downloadTriggered}
              isLoadingFromCache={isLoadingFromCache}
              hasCachedData={hasCachedDataState}
              useCloudFiles={useCloudFiles}
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
            width: "50%",
            height: "100%",
            backgroundColor: "var(--bg-secondary)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
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
          onDownloadClick={handleDownloadClick}
          downloadTriggered={downloadTriggered}
          isLoadingFromCache={isLoadingFromCache}
          hasCachedData={hasCachedDataState}
          useCloudFiles={useCloudFiles}
        />
      )}
    </>
  );
}
