#!/usr/bin/env node
/**
 * Test if R2 public URL is accessible
 * Usage: node utils/test_r2_url.js <R2_URL>
 */

const https = require('https');
const http = require('http');

const url = process.argv[2];

if (!url) {
  console.error('Usage: node utils/test_r2_url.js <R2_URL>');
  console.error('\nExample:');
  console.error('  node utils/test_r2_url.js https://pub-xxxxx.r2.dev/rsna2025-medical-imaging/ct_scan.nii.gz');
  process.exit(1);
}

console.log(`Testing R2 URL: ${url}\n`);

const client = url.startsWith('https') ? https : http;

const req = client.get(url, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  if (res.statusCode === 200) {
    console.log('\n✓ URL is accessible!');
    console.log(`Content-Type: ${res.headers['content-type']}`);
    console.log(`Content-Length: ${res.headers['content-length']} bytes`);
    
    // Check CORS headers
    if (res.headers['access-control-allow-origin']) {
      console.log(`\n✓ CORS configured: ${res.headers['access-control-allow-origin']}`);
    } else {
      console.log('\n⚠ Warning: No CORS headers found. Browser access may fail.');
    }
  } else if (res.statusCode === 403) {
    console.log('\n✗ Access Denied (403)');
    console.log('This usually means:');
    console.log('1. Public Development URL is not enabled');
    console.log('2. File is not publicly accessible');
    console.log('3. URL is incorrect');
  } else if (res.statusCode === 404) {
    console.log('\n✗ File Not Found (404)');
    console.log('Check:');
    console.log('1. File path in URL is correct');
    console.log('2. File was uploaded successfully');
    console.log('3. Bucket name in URL matches your bucket');
  } else {
    console.log(`\n✗ Unexpected status: ${res.statusCode}`);
  }
  
  res.resume(); // Consume response to free up memory
});

req.on('error', (error) => {
  console.error('\n✗ Error:', error.message);
  console.error('\nPossible issues:');
  console.error('1. URL is incorrect');
  console.error('2. Network connectivity issue');
  console.error('3. DNS resolution failed');
});

req.setTimeout(10000, () => {
  req.destroy();
  console.error('\n✗ Request timeout');
});

