/**
 * Get the NIfTI file URL
 * Uses R2 URL from environment variable if available, otherwise falls back to local path
 * @returns {string} URL to the NIfTI file
 */
export function getNiftiFileUrl() {
  // Use R2 URL if configured, otherwise use local path
  const r2Url = process.env.NEXT_PUBLIC_NIFTI_FILE_URL;
  
  if (r2Url) {
    return r2Url;
  }
  
  // Fallback to local path for development
  return '/demo-data/medical_imaging/ct_scan.nii.gz';
}

/**
 * Get the CT scan config file URL
 * Uses R2 base URL if available, otherwise falls back to local path
 * @returns {string} URL to the CT scan config file
 */
export function getCtScanConfigUrl() {
  const r2Url = process.env.NEXT_PUBLIC_NIFTI_FILE_URL;
  
  if (r2Url) {
    // If using R2, assume config is in the same bucket/directory
    // Replace the filename with config filename
    const baseUrl = r2Url.replace(/\/[^/]+\.nii\.gz$/, '');
    const configUrl = `${baseUrl}/ct_scan_config.json`;
    if (typeof window !== 'undefined') {
      console.log('[getCtScanConfigUrl] Using R2 URL:', configUrl);
    }
    return configUrl;
  }
  
  // Fallback to local path
  if (typeof window !== 'undefined') {
    console.log('[getCtScanConfigUrl] Using local fallback');
  }
  return '/demo-data/medical_imaging/ct_scan_config.json';
}

