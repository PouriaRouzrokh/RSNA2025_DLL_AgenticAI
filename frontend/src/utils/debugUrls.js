/**
 * Debug utility to log URLs being used
 * Add this to your components to see what URLs are being constructed
 */

export function debugUrls() {
  if (typeof window !== 'undefined') {
    console.log('=== URL Debug Info ===');
    console.log('NEXT_PUBLIC_NIFTI_FILE_URL:', process.env.NEXT_PUBLIC_NIFTI_FILE_URL);
    console.log('All NEXT_PUBLIC_ vars:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')));
  }
}

