/**
 * Check if cloud files (R2) should be used
 * Controlled by NEXT_PUBLIC_USE_CLOUD_FILES environment variable
 * @returns {boolean} True if cloud files should be used
 */
function shouldUseCloudFiles() {
  const useCloud = process.env.NEXT_PUBLIC_USE_CLOUD_FILES;
  // Treat 'true', '1', 'yes' as true, everything else as false
  return useCloud === 'true' || useCloud === '1' || useCloud === 'yes';
}

/**
 * Get the NIfTI file URL
 * Uses R2 URL if NEXT_PUBLIC_USE_CLOUD_FILES is enabled, otherwise uses local path
 * @returns {string} URL to the NIfTI file
 */
export function getNiftiFileUrl() {
  // Check if cloud files are enabled
  if (shouldUseCloudFiles()) {
    const r2Url = process.env.NEXT_PUBLIC_NIFTI_FILE_URL;
    if (r2Url) {
      return r2Url;
    }
    // If cloud is enabled but URL not set, warn and fallback
    console.warn('NEXT_PUBLIC_USE_CLOUD_FILES is enabled but NEXT_PUBLIC_NIFTI_FILE_URL is not set. Falling back to local file.');
  }
  
  // Use local path
  return '/demo-data/medical_imaging/ct_scan.nii.gz';
}

/**
 * Get the CT scan config file URL
 * Uses R2 base URL if cloud files are enabled, otherwise uses local path
 * @returns {string} URL to the CT scan config file
 */
export function getCtScanConfigUrl() {
  // Check if cloud files are enabled
  if (shouldUseCloudFiles()) {
    const r2Url = process.env.NEXT_PUBLIC_NIFTI_FILE_URL;
    if (r2Url) {
      // If using R2, assume config is in the same bucket/directory
      // Replace the filename with config filename
      const baseUrl = r2Url.replace(/\/[^/]+\.nii\.gz$/, '');
      return `${baseUrl}/ct_scan_config.json`;
    }
    // If cloud is enabled but URL not set, warn and fallback
    console.warn('NEXT_PUBLIC_USE_CLOUD_FILES is enabled but NEXT_PUBLIC_NIFTI_FILE_URL is not set. Falling back to local file.');
  }
  
  // Use local path
  return '/demo-data/medical_imaging/ct_scan_config.json';
}
