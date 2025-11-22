/**
 * NIfTI File Caching Utility
 * Uses IndexedDB to cache parsed NIfTI volume data for faster loading
 */

const DB_NAME = 'nifti-cache';
const DB_VERSION = 1;
const STORE_NAME = 'volumes';

let db = null;

/**
 * Initialize IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
function initDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'url' });
        objectStore.createIndex('url', 'url', { unique: true });
      }
    };
  });
}

/**
 * Generate a cache key from file URL
 * For local files, use URL as-is. For remote files, try to get modification time.
 * @param {string} url - File URL
 * @returns {Promise<string>} Cache key
 */
async function getCacheKey(url) {
  // For local files (starting with /), use URL as cache key
  // Normalize the URL to ensure consistency
  if (url.startsWith('/') || url.startsWith('file://')) {
    // Remove any query parameters or fragments for consistency
    return url.split('?')[0].split('#')[0];
  }
  
  // For remote files, use URL as cache key
  // We don't use last-modified header because:
  // 1. It may fail due to CORS
  // 2. It causes inconsistent cache keys
  // 3. The 7-day expiration handles cache freshness
  // Remove any query parameters or fragments for consistency
  return url.split('?')[0].split('#')[0];
}

/**
 * Check if data exists in cache for a URL
 * @param {string} url - File URL
 * @returns {Promise<boolean>} True if cached data exists
 */
export async function hasCachedData(url) {
  try {
    const database = await initDB();
    const cacheKey = await getCacheKey(url);
    
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve) => {
      // First try with the current cache key format
      const request = store.get(cacheKey);
      
      request.onsuccess = () => {
        const cached = request.result;
        
        // If found with current key format
        if (cached) {
          // Check if cache is still valid (expire after 7 days)
          const cacheAge = Date.now() - cached.cachedAt;
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
          const isValid = cacheAge <= maxAge;
          resolve(isValid);
          return;
        }
        
        // If not found, try to find by originalUrl (for backward compatibility)
        // This handles cases where cache was stored with a different key format
        const cursorRequest = store.openCursor();
        let foundMatch = false;
        
        cursorRequest.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const c = cursor.value;
            // Normalize URLs for comparison
            const normalizedOriginalUrl = c.originalUrl ? c.originalUrl.split('?')[0].split('#')[0] : '';
            const normalizedUrl = url.split('?')[0].split('#')[0];
            const normalizedCachedUrl = c.url ? c.url.split('?')[0].split('#')[0] : '';
            
            // Check if originalUrl matches or if url matches
            const matchesOriginal = normalizedOriginalUrl === normalizedUrl || normalizedOriginalUrl === cacheKey;
            const matchesUrl = normalizedCachedUrl === normalizedUrl || normalizedCachedUrl === cacheKey;
            
            if (matchesOriginal || matchesUrl) {
              // Check if cache is still valid
              const cacheAge = Date.now() - c.cachedAt;
              const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
              if (cacheAge <= maxAge) {
                foundMatch = true;
                resolve(true);
                return;
              }
            }
            cursor.continue();
          } else {
            // No matching cache found
            if (!foundMatch) {
              resolve(false);
            }
          }
        };
        
        cursorRequest.onerror = () => {
          console.warn('Error iterating cache:', cursorRequest.error);
          resolve(false);
        };
      };
      
      request.onerror = () => {
        console.warn('Error checking cache:', request.error);
        resolve(false);
      };
    });
  } catch (error) {
    console.warn('Failed to check cache:', error);
    return false;
  }
}

/**
 * Store NIfTI data in cache
 * @param {string} url - File URL
 * @param {Object} niftiData - Parsed NIfTI data
 * @returns {Promise<void>}
 */
export async function cacheNiftiData(url, niftiData) {
  try {
    if (!niftiData || !niftiData.volume) {
      console.error('Cannot cache: niftiData or volume is missing');
      throw new Error('Invalid niftiData: volume is required');
    }
    
    const database = await initDB();
    const cacheKey = await getCacheKey(url);
    
    // Store ArrayBuffer directly instead of converting to array
    // IndexedDB can store ArrayBuffers natively, which is much more efficient
    const volumeLength = niftiData.volume.length;
    const volumeType = niftiData.volume.constructor.name;
    const volumeByteLength = niftiData.volume.byteLength;
    
    // Check if volume is too large (IndexedDB has practical limits)
    // Most browsers can handle several hundred MB, but warn if very large
    const maxSafeByteLength = 500 * 1024 * 1024; // 500MB
    if (volumeByteLength > maxSafeByteLength) {
      console.warn(`Volume is very large (${(volumeByteLength / 1024 / 1024).toFixed(2)} MB). Caching may be slow but should work.`);
    }
    
    // Get the underlying ArrayBuffer from the TypedArray
    // If the TypedArray doesn't start at byte offset 0, we need to slice it
    let volumeBuffer;
    if (niftiData.volume.byteOffset === 0 && niftiData.volume.byteLength === niftiData.volume.buffer.byteLength) {
      // TypedArray uses the entire buffer - use it directly
      volumeBuffer = niftiData.volume.buffer;
    } else {
      // TypedArray is a view into a larger buffer - slice the relevant portion
      volumeBuffer = niftiData.volume.buffer.slice(
        niftiData.volume.byteOffset,
        niftiData.volume.byteOffset + niftiData.volume.byteLength
      );
    }
    
    // Store minimal header data (plain objects only, no functions)
    // This avoids needing to fetch/decompress the file just to read the header
    let headerData = null;
    if (niftiData.header) {
      const header = niftiData.header;
      headerData = {
        dims: header.dims ? Array.from(header.dims) : null,
        pixDims: header.pixDims ? Array.from(header.pixDims) : null,
        datatypeCode: header.datatypeCode,
        scl_slope: header.scl_slope,
        scl_inter: header.scl_inter,
        cal_min: header.cal_min,
        cal_max: header.cal_max,
        // Store other essential header fields as plain data
        qform_code: header.qform_code,
        sform_code: header.sform_code,
        quatern_b: header.quatern_b,
        quatern_c: header.quatern_c,
        quatern_d: header.quatern_d,
        qoffset_x: header.qoffset_x,
        qoffset_y: header.qoffset_y,
        qoffset_z: header.qoffset_z,
        srow_x: header.srow_x ? Array.from(header.srow_x) : null,
        srow_y: header.srow_y ? Array.from(header.srow_y) : null,
        srow_z: header.srow_z ? Array.from(header.srow_z) : null,
      };
    }
    
    // Cache the large volume data and essential metadata including minimal header
    const dataToStore = {
      url: cacheKey,
      originalUrl: url,
      volumeBuffer: volumeBuffer, // Store ArrayBuffer directly (the large data)
      volumeType: volumeType,
      volumeLength: volumeLength, // Store length for reconstruction
      dimensions: niftiData.dimensions,
      pixelDimensions: niftiData.pixelDimensions,
      headerData: headerData, // Store minimal header data (plain object, no functions)
      datatypeCode: niftiData.datatypeCode,
      sclSlope: niftiData.sclSlope,
      sclInter: niftiData.sclInter,
      calMin: niftiData.calMin,
      calMax: niftiData.calMax,
      cachedAt: Date.now()
    };

    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.put(dataToStore);
      
      request.onsuccess = () => {
        // Wait for transaction to complete before resolving
        // This ensures data is actually committed to IndexedDB
        transaction.oncomplete = () => {
          resolve();
        };
        
        transaction.onerror = () => {
          const error = transaction.error || request.error;
          console.error('IndexedDB transaction failed:', error);
          reject(error);
        };
      };
      
      request.onerror = () => {
        const error = request.error;
        console.error('IndexedDB put failed:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Failed to cache NIfTI data:', error);
    // Re-throw so caller knows caching failed
    throw error;
  }
}

/**
 * Load NIfTI data from cache
 * @param {string} url - File URL
 * @returns {Promise<Object|null>} Cached NIfTI data or null if not found
 */
export async function loadCachedNiftiData(url) {
  try {
    const database = await initDB();
    const cacheKey = await getCacheKey(url);
    
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(cacheKey);
      
      request.onsuccess = () => {
        const cached = request.result;
        
        if (cached) {
          // Check if cache is still valid (optional: expire after 7 days)
          const cacheAge = Date.now() - cached.cachedAt;
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
          if (cacheAge > maxAge) {
            // Continue to fallback search
          } else {
            // Cache is valid, return it
            const niftiData = reconstructNiftiData(cached);
            resolve(niftiData);
            return;
          }
        }
        
        // If not found or expired, try to find by originalUrl (for backward compatibility)
        const cursorRequest = store.openCursor();
        let foundMatch = false;
        
        cursorRequest.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const c = cursor.value;
            // Normalize URLs for comparison
            const normalizedOriginalUrl = c.originalUrl ? c.originalUrl.split('?')[0].split('#')[0] : '';
            const normalizedUrl = url.split('?')[0].split('#')[0];
            const normalizedCachedUrl = c.url ? c.url.split('?')[0].split('#')[0] : '';
            
            // Check if originalUrl matches or if url matches
            const matchesOriginal = normalizedOriginalUrl === normalizedUrl || normalizedOriginalUrl === cacheKey;
            const matchesUrl = normalizedCachedUrl === normalizedUrl || normalizedCachedUrl === cacheKey;
            
            if (matchesOriginal || matchesUrl) {
              // Check if cache is still valid
              const cacheAge = Date.now() - c.cachedAt;
              const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
              if (cacheAge <= maxAge) {
                const niftiData = reconstructNiftiData(c);
                foundMatch = true;
                resolve(niftiData);
                return;
              }
            }
            cursor.continue();
          } else {
            // No matching cache found
            if (!foundMatch) {
              resolve(null);
            }
          }
        };
        
        cursorRequest.onerror = () => {
          console.warn('Error iterating cache:', cursorRequest.error);
          resolve(null);
        };
      };
      
      request.onerror = () => {
        console.warn('Error loading cached data:', request.error);
        resolve(null);
      };
    });
  } catch (error) {
    console.warn('Failed to load cached NIfTI data (continuing without cache):', error);
    return null; // Cache is optional, don't throw
  }
}

/**
 * Reconstruct NIfTI data from cached object
 * @param {Object} cached - Cached data object
 * @returns {Object} Reconstructed NIfTI data
 */
function reconstructNiftiData(cached) {
  if (!cached) {
    return null;
  }

  // Reconstruct TypedArray from stored ArrayBuffer
  let volume;
  const volumeType = cached.volumeType;
  
  // Check for new format (ArrayBuffer) - old format (array) is no longer supported
  if (!cached.volumeBuffer) {
    // Old cache format detected - return null to trigger re-download
    console.warn('Found old cache format (array). Cache entry will be ignored. Re-downloading will create new cache.');
    return null;
  }
  
  const volumeBuffer = cached.volumeBuffer;
  
  // Create TypedArray from ArrayBuffer
  switch (volumeType) {
    case 'Uint8Array':
      volume = new Uint8Array(volumeBuffer);
      break;
    case 'Int16Array':
      volume = new Int16Array(volumeBuffer);
      break;
    case 'Int32Array':
      volume = new Int32Array(volumeBuffer);
      break;
    case 'Float32Array':
      volume = new Float32Array(volumeBuffer);
      break;
    case 'Float64Array':
      volume = new Float64Array(volumeBuffer);
      break;
    case 'Int8Array':
      volume = new Int8Array(volumeBuffer);
      break;
    case 'Uint16Array':
      volume = new Uint16Array(volumeBuffer);
      break;
    case 'Uint32Array':
      volume = new Uint32Array(volumeBuffer);
      break;
    default:
      // Fallback to Int16Array (most common for CT)
      volume = new Int16Array(volumeBuffer);
  }
  
  // Validate length if stored
  if (cached.volumeLength && volume.length !== cached.volumeLength) {
    console.warn(`⚠️ Volume length mismatch: expected ${cached.volumeLength}, got ${volume.length}`);
  }

  // Validate and sanitize dimensions from cache
  let dims = cached.dimensions || {};
  const x = Math.max(1, Math.floor(dims.x) || 1);
  const y = Math.max(1, Math.floor(dims.y) || 1);
  const z = Math.max(1, Math.floor(dims.z) || 1);
  const t = Math.max(1, Math.floor(dims.t) || 1);

  // Return cached data including headerData (minimal header info)
  return {
    volume: volume,
    dimensions: { x, y, z, t },
    pixelDimensions: cached.pixelDimensions || { x: 1, y: 1, z: 1 },
    headerData: cached.headerData, // Minimal header data (plain object)
    datatypeCode: cached.datatypeCode,
    sclSlope: cached.sclSlope,
    sclInter: cached.sclInter,
    calMin: cached.calMin,
    calMax: cached.calMax
  };
}

/**
 * Clear all cached NIfTI data
 * @returns {Promise<void>}
 */
export async function clearCache() {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to clear cache:', error);
    throw error;
  }
}

/**
 * List all cached entries (for debugging)
 * @returns {Promise<Array>} Array of cached entries
 */
export async function listAllCachedEntries() {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const entries = request.result.map(entry => ({
          url: entry.url,
          originalUrl: entry.originalUrl,
          cachedAt: new Date(entry.cachedAt).toISOString(),
          cacheAge: Date.now() - entry.cachedAt,
          dimensions: entry.dimensions
        }));
        resolve(entries);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to list cached entries:', error);
    return [];
  }
}

/**
 * Delete cached data for a specific URL
 * @param {string} url - File URL
 * @returns {Promise<void>}
 */
export async function deleteCachedData(url) {
  try {
    const database = await initDB();
    const cacheKey = await getCacheKey(url);
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(cacheKey);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to delete cached data:', error);
    throw error;
  }
}
