# Configure R2 CORS - Quick Guide

## Step-by-Step Instructions

1. **Go to Cloudflare Dashboard**
   - Navigate to: https://dash.cloudflare.com
   - Click on **R2** in the left sidebar

2. **Select Your Bucket**
   - Click on `rsna2025-medical-imaging`

3. **Open CORS Settings**
   - Click on **Settings** tab
   - Scroll down to **CORS Policy** section
   - Click **"Edit CORS Policy"** button

4. **Add CORS Configuration**
   - Click **"Add CORS Policy"** or paste the JSON below
   - Copy and paste this exact configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://rsna2025-agenticai.com",
      "https://*.vercel.app"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

5. **Save**
   - Click **"Save"** button
   - Wait a few seconds for changes to propagate

## What This Does

- **`AllowedOrigins`**: Allows requests from:
  - `http://localhost:3000` - Your local development server
  - `https://rsna2025-agenticai.com` - Your production domain
  - `https://*.vercel.app` - All Vercel preview deployments

- **`AllowedMethods`**: Allows GET and HEAD requests (reading files)

- **`AllowedHeaders`**: Allows all headers (needed for browser requests)

- **`ExposeHeaders`**: Exposes ETag header (useful for caching)

## Verify CORS is Working

After configuring, test with:

```bash
node utils/test_r2_url.js https://pub-54d950f4d3b84f95b8d19a5718b9deb0.r2.dev/ct_scan.nii.gz
```

You should see:
```
✓ CORS configured: http://localhost:3000
```

Instead of:
```
⚠ Warning: No CORS headers found
```

## Troubleshooting

If CORS still doesn't work:
1. Wait 1-2 minutes for changes to propagate
2. Clear browser cache
3. Verify the JSON syntax is correct (no trailing commas)
4. Ensure you clicked "Save" in the CORS policy editor

