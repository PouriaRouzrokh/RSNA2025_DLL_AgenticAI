import * as nifti from 'nifti-reader-js';
import { NIFTI1 } from 'nifti-reader-js';
import { getRescaleValues } from './ctScanConfig';

async function loadPreprocessedFile(url) {
  try {
    const preprocessedUrl = url.replace(/\.nii(\.gz)?$/, '_preprocessed.json');
    const response = await fetch(preprocessedUrl);
    
    if (!response.ok) {
      return null;
    }
    
    const preprocessed = await response.json();
    const csvRescale = await getRescaleValues(url);
    const sclSlope = csvRescale.rescaleSlope != null ? csvRescale.rescaleSlope : preprocessed.sclSlope || 1;
    const sclInter = csvRescale.rescaleIntercept != null ? csvRescale.rescaleIntercept : preprocessed.sclInter || 0;
    const volume = new Float32Array(preprocessed.volume);
    
    return {
      volume: volume,
      dimensions: preprocessed.dimensions,
      pixelDimensions: preprocessed.pixelDimensions,
      header: preprocessed.header || null,
      datatypeCode: preprocessed.datatypeCode || NIFTI1.TYPE_FLOAT32,
      sclSlope: sclSlope,
      sclInter: sclInter,
      calMin: preprocessed.calMin,
      calMax: preprocessed.calMax,
      isPreprocessed: true
    };
  } catch (error) {
    console.warn('Failed to load preprocessed file:', error);
    return null;
  }
}

/**
 * Load and parse NIfTI file
 * @param {string} url - URL to the NIfTI file
 * @returns {Promise<Object>} Parsed NIfTI data with volume and metadata
 */
export async function loadNiftiFile(url) {
  try {
    // Try preprocessed file first (much faster)
    const preprocessed = await loadPreprocessedFile(url);
    if (preprocessed) {
      console.log(`Loaded preprocessed file for ${url}`);
      return preprocessed;
    }

    // Fall back to loading NIfTI file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch NIfTI file: ${response.statusText}`);
    }

    // Get array buffer
    let arrayBuffer = await response.arrayBuffer();

    if (nifti.isCompressed(arrayBuffer)) {
      await new Promise(resolve => {
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(() => setTimeout(resolve, 10));
        } else {
          setTimeout(resolve, 10);
        }
      });
      arrayBuffer = nifti.decompress(arrayBuffer);
    }

    // Check if it's a NIfTI file
    if (!nifti.isNIFTI(arrayBuffer)) {
      throw new Error('File is not a valid NIfTI format');
    }

    // Read header
    const header = nifti.readHeader(arrayBuffer);
    
    // Read image data
    const imageData = nifti.readImage(header, arrayBuffer);

    // Get dimensions
    const dims = header.dims;
    const pixDims = header.pixDims;

    // Convert image data to typed array based on datatype
    let volume;
    const datatypeCode = header.datatypeCode;
    
    if (datatypeCode === NIFTI1.TYPE_UINT8) {
      volume = new Uint8Array(imageData);
    } else if (datatypeCode === NIFTI1.TYPE_INT16) {
      volume = new Int16Array(imageData);
    } else if (datatypeCode === NIFTI1.TYPE_INT32) {
      volume = new Int32Array(imageData);
    } else if (datatypeCode === NIFTI1.TYPE_FLOAT32) {
      volume = new Float32Array(imageData);
    } else if (datatypeCode === NIFTI1.TYPE_FLOAT64) {
      volume = new Float64Array(imageData);
    } else if (datatypeCode === NIFTI1.TYPE_INT8) {
      volume = new Int8Array(imageData);
    } else if (datatypeCode === NIFTI1.TYPE_UINT16) {
      volume = new Uint16Array(imageData);
    } else if (datatypeCode === NIFTI1.TYPE_UINT32) {
      volume = new Uint32Array(imageData);
    } else {
      throw new Error(`Unsupported datatype: ${datatypeCode}`);
    }

    const csvRescale = await getRescaleValues(url);
    
    let sclSlope, sclInter;
    
    if (csvRescale.rescaleSlope != null) {
      sclSlope = csvRescale.rescaleSlope;
      sclInter = csvRescale.rescaleIntercept != null ? csvRescale.rescaleIntercept : 0;
    } else {
      const rawSclSlope = header.scl_slope;
      if (rawSclSlope == null || rawSclSlope === undefined || isNaN(rawSclSlope) || rawSclSlope === 0) {
        sclSlope = 1;
      } else {
        sclSlope = rawSclSlope;
      }
      
      const rawSclInter = header.scl_inter;
      sclInter = (rawSclInter != null && rawSclInter !== undefined && !isNaN(rawSclInter)) ? rawSclInter : 0;
    }

    return {
      volume: volume,
      dimensions: {
        x: dims[1],
        y: dims[2],
        z: dims[3],
        t: dims[4] || 1
      },
      pixelDimensions: {
        x: pixDims[1],
        y: pixDims[2],
        z: pixDims[3]
      },
      header: header,
      datatypeCode: datatypeCode,
      sclSlope: sclSlope,
      sclInter: sclInter,
      calMin: header.cal_min,
      calMax: header.cal_max
    };
  } catch (error) {
    console.error('Error loading NIfTI file:', error);
    throw error;
  }
}

/**
 * Extract a slice from the volume based on view and slice index
 * @param {Object} niftiData - Parsed NIfTI data
 * @param {string} view - 'axial', 'sagittal', or 'coronal'
 * @param {number} sliceIndex - Index of the slice (0-based)
 * @returns {Object} Slice data with width, height, and maxSlices
 */
export function extractSlice(niftiData, view, sliceIndex) {
  const { volume, dimensions } = niftiData;
  const { x, y, z } = dimensions;

  // Clamp slice index
  let maxSlices;
  let sliceData;
  let sliceWidth, sliceHeight;

  if (view === 'axial') {
    maxSlices = z;
    const clampedSlice = Math.max(0, Math.min(maxSlices - 1, sliceIndex));
    const sliceSize = x * y;
    const startIdx = clampedSlice * sliceSize;
    sliceData = volume.slice(startIdx, startIdx + sliceSize);
    sliceWidth = x;
    sliceHeight = y;
  } else if (view === 'sagittal') {
    maxSlices = x;
    const clampedSlice = Math.max(0, Math.min(maxSlices - 1, sliceIndex));
    sliceData = new volume.constructor(y * z);
    for (let zIdx = 0; zIdx < z; zIdx++) {
      for (let yIdx = 0; yIdx < y; yIdx++) {
        const volIdx = zIdx * x * y + yIdx * x + clampedSlice;
        const sliceIdx = (z - 1 - zIdx) * y + yIdx;
        sliceData[sliceIdx] = volume[volIdx];
      }
    }
    sliceWidth = y;
    sliceHeight = z;
  } else { // coronal
    maxSlices = y;
    const clampedSlice = Math.max(0, Math.min(maxSlices - 1, sliceIndex));
    sliceData = new volume.constructor(x * z);
    for (let zIdx = 0; zIdx < z; zIdx++) {
      for (let xIdx = 0; xIdx < x; xIdx++) {
        const volIdx = zIdx * x * y + clampedSlice * x + xIdx;
        const sliceIdx = (z - 1 - zIdx) * x + xIdx;
        sliceData[sliceIdx] = volume[volIdx];
      }
    }
    sliceWidth = x;
    sliceHeight = z;
  }

  return {
    data: sliceData,
    width: sliceWidth,
    height: sliceHeight,
    maxSlices
  };
}

/**
 * Apply window/level to pixel values (CT windowing)
 * @param {number} pixelValue - Pixel value in Hounsfield Units (HU)
 * @param {number} window - Window width
 * @param {number} level - Window level (center)
 * @returns {number} Normalized value (0-255)
 */
export function applyWindowLevel(pixelValue, window, level) {
  if (!isFinite(window) || window <= 0 || !isFinite(level)) {
    return 128;
  }
  
  if (!isFinite(pixelValue)) {
    return 0;
  }
  
  const windowMin = level - window / 2;
  const windowMax = level + window / 2;
  
  if (windowMax === windowMin) {
    return pixelValue >= level ? 255 : 0;
  }
  
  if (pixelValue <= windowMin) return 0;
  if (pixelValue >= windowMax) return 255;
  
  const normalized = ((pixelValue - windowMin) / (windowMax - windowMin)) * 255;
  return Math.max(0, Math.min(255, Math.round(normalized)));
}

/**
 * Normalize slice data to 0-255 range for display
 * @param {TypedArray} sliceData - Slice pixel data
 * @param {number} sclSlope - Scale slope from header
 * @param {number} sclInter - Scale intercept from header
 * @param {number} window - Window width
 * @param {number} level - Window level
 * @returns {Uint8Array} Normalized slice data
 */
export function normalizeSlice(sliceData, sclSlope, sclInter, window, level) {
  const normalized = new Uint8Array(sliceData.length);
  
  if (!sliceData || sliceData.length === 0) {
    return normalized;
  }
  
  const validSclSlope = (sclSlope != null && !isNaN(sclSlope) && isFinite(sclSlope) && sclSlope !== 0) ? sclSlope : 1;
  const validSclInter = (sclInter != null && !isNaN(sclInter) && isFinite(sclInter)) ? sclInter : 0;
  const validWindow = (window != null && !isNaN(window) && isFinite(window) && window > 0) ? window : 400;
  const validLevel = (level != null && !isNaN(level) && isFinite(level)) ? level : 50;
  
  for (let i = 0; i < sliceData.length; i++) {
    let pixelValue = Number(sliceData[i]) * validSclSlope + validSclInter;
    
    if (isNaN(pixelValue) || !isFinite(pixelValue)) {
      pixelValue = -1000;
    }
    
    normalized[i] = applyWindowLevel(pixelValue, validWindow, validLevel);
  }
  
  return normalized;
}

/**
 * Window/Level presets
 */
export const WINDOW_LEVEL_PRESETS = {
  brain: { window: 80, level: 40 },
  soft_tissue: { window: 400, level: 50 },
  bone: { window: 2000, level: 300 },
  lung: { window: 1500, level: -600 }
};
