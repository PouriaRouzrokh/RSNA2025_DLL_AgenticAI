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
 * Generate a cache key from file URL and modification time
 * @param {string} url - File URL
 * @returns {Promise<string>} Cache key
 */
async function getCacheKey(url) {
  try {
    // Try to get file modification time from headers
    const response = await fetch(url, { method: 'HEAD' });
    const lastModified = response.headers.get('last-modified');
    if (lastModified) {
      return `${url}:${lastModified}`;
    }
  } catch (error) {
    // If HEAD request fails, just use URL
    console.warn('Could not get file modification time:', error);
  }
  return url;
}

/**
 * Store NIfTI data in cache
 * @param {string} url - File URL
 * @param {Object} niftiData - Parsed NIfTI data
 * @returns {Promise<void>}
 */
export async function cacheNiftiData(url, niftiData) {
  try {
    const database = await initDB();
    const cacheKey = await getCacheKey(url);
    
    // Convert TypedArray to regular array for storage
    // IndexedDB can't store TypedArrays directly
    const volumeArray = Array.from(niftiData.volume);
    const volumeType = niftiData.volume.constructor.name;
    
    const dataToStore = {
      url: cacheKey,
      originalUrl: url,
      volume: volumeArray,
      volumeType: volumeType,
      dimensions: niftiData.dimensions,
      pixelDimensions: niftiData.pixelDimensions,
      header: niftiData.header,
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
        console.log(`Cached NIfTI data for ${url}`);
        resolve();
      };
      request.onerror = () => {
        console.error('Failed to cache NIfTI data:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.warn('Failed to cache NIfTI data (continuing without cache):', error);
    // Don't throw - caching is optional
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
        
        if (!cached) {
          resolve(null);
          return;
        }

        // Check if cache is still valid (optional: expire after 7 days)
        const cacheAge = Date.now() - cached.cachedAt;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        if (cacheAge > maxAge) {
          console.log('Cache expired, reloading file');
          resolve(null);
          return;
        }

        // Reconstruct TypedArray from stored array
        let volume;
        const volumeType = cached.volumeType;
        const volumeArray = cached.volume;
        
        switch (volumeType) {
          case 'Uint8Array':
            volume = new Uint8Array(volumeArray);
            break;
          case 'Int16Array':
            volume = new Int16Array(volumeArray);
            break;
          case 'Int32Array':
            volume = new Int32Array(volumeArray);
            break;
          case 'Float32Array':
            volume = new Float32Array(volumeArray);
            break;
          case 'Float64Array':
            volume = new Float64Array(volumeArray);
            break;
          case 'Int8Array':
            volume = new Int8Array(volumeArray);
            break;
          case 'Uint16Array':
            volume = new Uint16Array(volumeArray);
            break;
          case 'Uint32Array':
            volume = new Uint32Array(volumeArray);
            break;
          default:
            // Fallback to Int16Array (most common for CT)
            volume = new Int16Array(volumeArray);
        }

        const niftiData = {
          volume: volume,
          dimensions: cached.dimensions,
          pixelDimensions: cached.pixelDimensions,
          header: cached.header,
          datatypeCode: cached.datatypeCode,
          sclSlope: cached.sclSlope,
          sclInter: cached.sclInter,
          calMin: cached.calMin,
          calMax: cached.calMax
        };

        console.log(`Loaded NIfTI data from cache for ${url}`);
        resolve(niftiData);
      };
      
      request.onerror = () => {
        console.error('Failed to load cached NIfTI data:', request.error);
        resolve(null); // Return null instead of rejecting - cache is optional
      };
    });
  } catch (error) {
    console.warn('Failed to load cached NIfTI data (continuing without cache):', error);
    return null; // Cache is optional, don't throw
  }
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
        console.log('NIfTI cache cleared');
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
        console.log(`Deleted cached data for ${url}`);
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
