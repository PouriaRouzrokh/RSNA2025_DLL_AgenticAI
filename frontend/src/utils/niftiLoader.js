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
    
    // Validate and sanitize dimensions from preprocessed file
    let dims = preprocessed.dimensions || {};
    const x = Math.max(1, Math.floor(dims.x) || 1);
    const y = Math.max(1, Math.floor(dims.y) || 1);
    const z = Math.max(1, Math.floor(dims.z) || 1);
    const t = Math.max(1, Math.floor(dims.t) || 1);
    
    const volume = new Float32Array(preprocessed.volume);
    
    // Validate volume size
    const expectedSize = x * y * z * t;
    if (volume.length !== expectedSize) {
      console.warn(`Preprocessed volume size mismatch: expected ${expectedSize}, got ${volume.length}`);
    }
    
    return {
      volume: volume,
      dimensions: { x, y, z, t },
      pixelDimensions: preprocessed.pixelDimensions || { x: 1, y: 1, z: 1 },
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

    // Validate dimensions
    if (!dims || dims.length < 4) {
      throw new Error('Invalid NIfTI header: missing or invalid dimensions');
    }

    // Sanitize dimensions (ensure they are positive integers)
    const x = Math.max(1, Math.floor(dims[1]) || 1);
    const y = Math.max(1, Math.floor(dims[2]) || 1);
    const z = Math.max(1, Math.floor(dims[3]) || 1);
    const t = Math.max(1, Math.floor(dims[4]) || 1);

    // Validate expected volume size
    const expectedSize = x * y * z * t;
    if (!isFinite(expectedSize) || expectedSize <= 0 || expectedSize > Number.MAX_SAFE_INTEGER) {
      throw new Error(`Invalid NIfTI dimensions: ${x}x${y}x${z}x${t} results in invalid size`);
    }

    // Validate imageData before creating typed array
    if (!imageData) {
      throw new Error('Failed to read image data from NIfTI file');
    }

    // Convert image data to typed array based on datatype
    let volume;
    const datatypeCode = header.datatypeCode;
    
    try {
      // Handle different imageData types
      if (imageData instanceof ArrayBuffer) {
        // If it's an ArrayBuffer, create typed array view
        // Calculate bytes per element based on datatype
        let bytesPerElement = 1;
        if (datatypeCode === NIFTI1.TYPE_UINT16 || datatypeCode === NIFTI1.TYPE_INT16) {
          bytesPerElement = 2;
        } else if (datatypeCode === NIFTI1.TYPE_UINT32 || datatypeCode === NIFTI1.TYPE_INT32 || datatypeCode === NIFTI1.TYPE_FLOAT32) {
          bytesPerElement = 4;
        } else if (datatypeCode === NIFTI1.TYPE_FLOAT64) {
          bytesPerElement = 8;
        }

        const actualByteLength = imageData.byteLength;
        
        // Calculate maximum safe element count based on available bytes
        // Must be divisible by bytesPerElement
        const maxSafeByteLength = Math.floor(actualByteLength / bytesPerElement) * bytesPerElement;
        const safeElementCount = maxSafeByteLength / bytesPerElement;
        
        if (safeElementCount <= 0 || !isFinite(safeElementCount)) {
          throw new Error(`Cannot determine safe element count. ByteLength: ${actualByteLength}, bytesPerElement: ${bytesPerElement}`);
        }

        // Use the smaller of expected or safe count
        const finalElementCount = Math.min(expectedSize, safeElementCount);
        
        // Create typed array - when creating from ArrayBuffer, don't specify length if we want all available data
        // The typed array constructor will automatically calculate the correct length
        if (datatypeCode === NIFTI1.TYPE_UINT8) {
          volume = finalElementCount === safeElementCount ? new Uint8Array(imageData) : new Uint8Array(imageData, 0, finalElementCount);
        } else if (datatypeCode === NIFTI1.TYPE_INT16) {
          volume = finalElementCount === safeElementCount ? new Int16Array(imageData) : new Int16Array(imageData, 0, finalElementCount);
        } else if (datatypeCode === NIFTI1.TYPE_INT32) {
          volume = finalElementCount === safeElementCount ? new Int32Array(imageData) : new Int32Array(imageData, 0, finalElementCount);
        } else if (datatypeCode === NIFTI1.TYPE_FLOAT32) {
          volume = finalElementCount === safeElementCount ? new Float32Array(imageData) : new Float32Array(imageData, 0, finalElementCount);
        } else if (datatypeCode === NIFTI1.TYPE_FLOAT64) {
          volume = finalElementCount === safeElementCount ? new Float64Array(imageData) : new Float64Array(imageData, 0, finalElementCount);
        } else if (datatypeCode === NIFTI1.TYPE_INT8) {
          volume = finalElementCount === safeElementCount ? new Int8Array(imageData) : new Int8Array(imageData, 0, finalElementCount);
        } else if (datatypeCode === NIFTI1.TYPE_UINT16) {
          volume = finalElementCount === safeElementCount ? new Uint16Array(imageData) : new Uint16Array(imageData, 0, finalElementCount);
        } else if (datatypeCode === NIFTI1.TYPE_UINT32) {
          volume = finalElementCount === safeElementCount ? new Uint32Array(imageData) : new Uint32Array(imageData, 0, finalElementCount);
        } else {
          throw new Error(`Unsupported datatype: ${datatypeCode}`);
        }
        
        if (finalElementCount !== expectedSize) {
          console.warn(`Volume size adjusted: expected ${expectedSize} elements, using ${finalElementCount} elements based on available data (${actualByteLength} bytes)`);
        }
      } else {
        // If it's already a typed array or array-like, use it directly
        const dataLength = imageData.length;
        
        if (!isFinite(dataLength) || dataLength <= 0 || dataLength > Number.MAX_SAFE_INTEGER) {
          throw new Error(`Invalid imageData length: ${dataLength}`);
        }

        // Create typed array from array-like object
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
      }

      // Validate volume was created successfully
      if (!volume || !volume.length) {
        throw new Error(`Failed to create volume array. Volume length: ${volume?.length}`);
      }
    } catch (error) {
      if (error.message && (error.message.includes('Invalid array length') || error.name === 'RangeError')) {
        const errorDetails = {
          expectedSize,
          imageDataType: typeof imageData,
          imageDataConstructor: imageData?.constructor?.name,
          imageDataLength: imageData?.length,
          imageDataByteLength: imageData?.byteLength,
          datatypeCode
        };
        console.error('Volume creation error details:', errorDetails);
        throw new Error(`Failed to create volume array: Invalid array length. Details: ${JSON.stringify(errorDetails)}. Error: ${error.message}`);
      }
      throw error;
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

    // Validate volume size matches expected
    if (volume.length !== expectedSize) {
      console.warn(`Volume size mismatch: expected ${expectedSize}, got ${volume.length}. Using actual size.`);
    }

    return {
      volume: volume,
      dimensions: {
        x: x,
        y: y,
        z: z,
        t: t
      },
      pixelDimensions: {
        x: pixDims[1] || 1,
        y: pixDims[2] || 1,
        z: pixDims[3] || 1
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
 * Linear interpolation between two values
 * @param {number} a - First value
 * @param {number} b - Second value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Resample a 1D array using linear interpolation
 * @param {TypedArray} source - Source array
 * @param {number} targetLength - Target array length
 * @returns {TypedArray} Resampled array
 */
function resample1D(source, targetLength) {
  if (source.length === targetLength) {
    return source;
  }
  
  const sourceLength = source.length;
  const result = new source.constructor(targetLength);
  const ratio = (sourceLength - 1) / (targetLength - 1);
  
  for (let i = 0; i < targetLength; i++) {
    const sourceIndex = i * ratio;
    const lowerIndex = Math.floor(sourceIndex);
    const upperIndex = Math.min(lowerIndex + 1, sourceLength - 1);
    const t = sourceIndex - lowerIndex;
    
    result[i] = lerp(source[lowerIndex], source[upperIndex], t);
  }
  
  return result;
}

/**
 * Resample a 2D slice using linear interpolation along one dimension
 * @param {TypedArray} source - Source slice data (1D array representing 2D image)
 * @param {number} sourceWidth - Source width
 * @param {number} sourceHeight - Source height
 * @param {number} targetHeight - Target height
 * @param {boolean} interpolateAlongHeight - If true, interpolate along height; if false, along width
 * @returns {TypedArray} Resampled slice data
 */
function resample2D(source, sourceWidth, sourceHeight, targetHeight, interpolateAlongHeight = true) {
  if (sourceHeight === targetHeight) {
    return source;
  }
  
  const result = new source.constructor(sourceWidth * targetHeight);
  
  if (interpolateAlongHeight) {
    // Interpolate along height (vertical direction)
    const ratio = (sourceHeight - 1) / (targetHeight - 1);
    
    for (let x = 0; x < sourceWidth; x++) {
      for (let y = 0; y < targetHeight; y++) {
        const sourceY = y * ratio;
        const lowerY = Math.floor(sourceY);
        const upperY = Math.min(lowerY + 1, sourceHeight - 1);
        const t = sourceY - lowerY;
        
        const lowerIdx = lowerY * sourceWidth + x;
        const upperIdx = upperY * sourceWidth + x;
        const resultIdx = y * sourceWidth + x;
        
        result[resultIdx] = lerp(source[lowerIdx], source[upperIdx], t);
      }
    }
  } else {
    // Interpolate along width (horizontal direction)
    const targetWidth = targetHeight; // For square aspect ratio
    const ratio = (sourceWidth - 1) / (targetWidth - 1);
    
    for (let y = 0; y < sourceHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const sourceX = x * ratio;
        const lowerX = Math.floor(sourceX);
        const upperX = Math.min(lowerX + 1, sourceWidth - 1);
        const t = sourceX - lowerX;
        
        const lowerIdx = y * sourceWidth + lowerX;
        const upperIdx = y * sourceWidth + upperX;
        const resultIdx = y * targetWidth + x;
        
        result[resultIdx] = lerp(source[lowerIdx], source[upperIdx], t);
      }
    }
  }
  
  return result;
}

/**
 * Calculate target slice count to maintain 1:1 aspect ratio
 * @param {Object} niftiData - Parsed NIfTI data
 * @param {string} view - 'axial', 'sagittal', or 'coronal'
 * @returns {number} Target number of slices
 */
export function calculateTargetSliceCount(niftiData, view) {
  const { dimensions, pixelDimensions } = niftiData;
  const { x, y, z } = dimensions;
  const { x: pixX, y: pixY, z: pixZ } = pixelDimensions;
  
  if (view === 'axial') {
    // Axial view: width = x, height = y
    // Use the larger dimension as target to maintain square-ish aspect
    return Math.max(x, y);
  } else if (view === 'sagittal') {
    // Sagittal view: width = y, height = z
    // Target height should match width for 1:1 aspect ratio
    const width = y;
    const height = z;
    // Calculate target based on pixel dimensions to maintain physical aspect ratio
    const physicalWidth = width * pixY;
    const physicalHeight = height * pixZ;
    // If physical dimensions suggest we need more slices, resample
    if (physicalHeight < physicalWidth * 0.8) {
      // Resample to match width
      return Math.max(height, Math.round(width * (pixY / pixZ)));
    }
    return height;
  } else { // coronal
    // Coronal view: width = x, height = z
    const width = x;
    const height = z;
    const physicalWidth = width * pixX;
    const physicalHeight = height * pixZ;
    // If physical dimensions suggest we need more slices, resample
    if (physicalHeight < physicalWidth * 0.8) {
      // Resample to match width
      return Math.max(height, Math.round(width * (pixX / pixZ)));
    }
    return height;
  }
}

/**
 * Extract a slice from the volume based on view and slice index
 * @param {Object} niftiData - Parsed NIfTI data
 * @param {string} view - 'axial', 'sagittal', or 'coronal'
 * @param {number} sliceIndex - Index of the slice (0-based)
 * @param {boolean} enableResampling - Whether to enable resampling for aspect ratio correction (default: true)
 * @returns {Object} Slice data with width, height, and maxSlices
 */
export function extractSlice(niftiData, view, sliceIndex, enableResampling = true) {
  const { volume, dimensions } = niftiData;
  let { x, y, z } = dimensions;

  // Validate and sanitize dimensions
  x = Math.max(1, Math.floor(x)) || 1;
  y = Math.max(1, Math.floor(y)) || 1;
  z = Math.max(1, Math.floor(z)) || 1;

  // Clamp slice index
  let maxSlices;
  let sliceData;
  let sliceWidth, sliceHeight;
  let originalSliceHeight; // Store original height for resampling

  if (view === 'axial') {
    maxSlices = z;
    const clampedSlice = Math.max(0, Math.min(maxSlices - 1, sliceIndex));
    const sliceSize = x * y;
    const startIdx = clampedSlice * sliceSize;
    sliceData = volume.slice(startIdx, startIdx + sliceSize);
    sliceWidth = x;
    sliceHeight = y;
    originalSliceHeight = y;
  } else if (view === 'sagittal') {
    maxSlices = x;
    const clampedSlice = Math.max(0, Math.min(maxSlices - 1, sliceIndex));
    const sliceSize = y * z;
    if (!isFinite(sliceSize) || sliceSize <= 0 || sliceSize > Number.MAX_SAFE_INTEGER) {
      throw new Error(`Invalid slice size for sagittal view: ${sliceSize} (y=${y}, z=${z})`);
    }
    sliceData = new volume.constructor(sliceSize);
    for (let zIdx = 0; zIdx < z; zIdx++) {
      for (let yIdx = 0; yIdx < y; yIdx++) {
        const volIdx = zIdx * x * y + yIdx * x + clampedSlice;
        const sliceIdx = (z - 1 - zIdx) * y + yIdx;
        if (volIdx >= 0 && volIdx < volume.length && sliceIdx >= 0 && sliceIdx < sliceData.length) {
          sliceData[sliceIdx] = volume[volIdx];
        }
      }
    }
    sliceWidth = y;
    sliceHeight = z;
    originalSliceHeight = z;
  } else { // coronal
    maxSlices = y;
    const clampedSlice = Math.max(0, Math.min(maxSlices - 1, sliceIndex));
    const sliceSize = x * z;
    if (!isFinite(sliceSize) || sliceSize <= 0 || sliceSize > Number.MAX_SAFE_INTEGER) {
      throw new Error(`Invalid slice size for coronal view: ${sliceSize} (x=${x}, z=${z})`);
    }
    sliceData = new volume.constructor(sliceSize);
    for (let zIdx = 0; zIdx < z; zIdx++) {
      for (let xIdx = 0; xIdx < x; xIdx++) {
        const volIdx = zIdx * x * y + clampedSlice * x + xIdx;
        const sliceIdx = (z - 1 - zIdx) * x + xIdx;
        if (volIdx >= 0 && volIdx < volume.length && sliceIdx >= 0 && sliceIdx < sliceData.length) {
          sliceData[sliceIdx] = volume[volIdx];
        }
      }
    }
    sliceWidth = x;
    sliceHeight = z;
    originalSliceHeight = z;
  }

  // Apply resampling if enabled and needed for aspect ratio correction
  if (enableResampling && (view === 'sagittal' || view === 'coronal')) {
    const targetSliceCount = calculateTargetSliceCount(niftiData, view);
    
    // Only resample if target is significantly larger than current (at least 20% more)
    if (targetSliceCount > originalSliceHeight * 1.2) {
      const targetHeight = targetSliceCount;
      
      // Resample along the height dimension (z-direction)
      sliceData = resample2D(sliceData, sliceWidth, originalSliceHeight, targetHeight, true);
      sliceHeight = targetHeight;
      
      // Update maxSlices to reflect resampled count
      maxSlices = targetSliceCount;
    }
  }

  // Validate slice dimensions
  sliceWidth = Math.max(1, Math.floor(sliceWidth)) || 1;
  sliceHeight = Math.max(1, Math.floor(sliceHeight)) || 1;

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
