# R2 Troubleshooting Guide

## Testing R2 URL Accessibility

Before configuring your app, test if your R2 URL is accessible:

```bash
# Test the R2 URL directly
node utils/test_r2_url.js https://pub-xxxxx.r2.dev/rsna2025-medical-imaging/ct_scan.nii.gz
```

Replace with your actual R2 public URL. This will tell you:
- ✓ If the URL is accessible
- ✓ If CORS is configured correctly
- ✗ Any access issues (403, 404, etc.)

## Testing Locally with R2

Yes! Your local `npm run dev` **can** use R2 files. Here's how:

### Step 1: Create `.env.local` in Frontend Directory

```bash
cd frontend
cat > .env.local << EOF
NEXT_PUBLIC_NIFTI_FILE_URL=https://pub-xxxxx.r2.dev/rsna2025-medical-imaging/ct_scan.nii.gz
EOF
```

Replace `https://pub-xxxxx.r2.dev/...` with your actual R2 public URL.

### Step 2: Restart Dev Server

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Verify

1. Open `http://localhost:3000`
2. Open browser DevTools → **Network** tab
3. Load the CT viewer
4. Check the Network tab - you should see requests to your R2 URL (not `/demo-data/...`)

**Note**: If `NEXT_PUBLIC_NIFTI_FILE_URL` is not set locally, it will fall back to `/demo-data/medical_imaging/ct_scan.nii.gz` (local files).

## Debugging Vercel Deployment

If Vercel is showing "unable to load", check these:

### 1. Verify Environment Variable in Vercel

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Check that `NEXT_PUBLIC_NIFTI_FILE_URL` exists
3. Verify the value is correct (full URL including filename)
4. Ensure it's enabled for **Production**, **Preview**, and **Development**

### 2. Verify R2 URL is Accessible

Test your R2 URL from command line:

```bash
# Test if URL is accessible
curl -I https://pub-xxxxx.r2.dev/rsna2025-medical-imaging/ct_scan.nii.gz

# Should return 200 OK
# Check for CORS headers:
curl -H "Origin: https://rsna2025-agenticai.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://pub-xxxxx.r2.dev/rsna2025-medical-imaging/ct_scan.nii.gz
```

### 3. Check CORS Configuration

In Cloudflare R2 → Your Bucket → **Settings** → **CORS Policy**:

```json
[
  {
    "AllowedOrigins": [
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

### 4. Check Browser Console

1. Visit your deployed site: `https://rsna2025-agenticai.com`
2. Open DevTools → **Console** tab
3. Look for errors like:
   - `CORS policy blocked`
   - `Failed to fetch`
   - `404 Not Found`
   - `403 Forbidden`

### 5. Check Network Tab

1. Open DevTools → **Network** tab
2. Filter by "nii" or "gz"
3. Click on the failed request
4. Check:
   - **Status Code** (should be 200)
   - **Request URL** (should be your R2 URL)
   - **Response Headers** (check CORS headers)

### 6. Redeploy After Environment Variable Changes

**Important**: After adding/changing environment variables in Vercel:

1. Go to **Deployments**
2. Click the three dots (⋯) on latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

Environment variables are only available after redeployment!

### 7. Verify Build-Time Variable Access

Next.js `NEXT_PUBLIC_*` variables are embedded at **build time**, not runtime. This means:

- ✅ Variable must be set **before** deployment
- ✅ Must **redeploy** after adding/changing variables
- ✅ Variable is available in browser JavaScript

## Common Issues

### Issue: "Unable to load" or "Failed to fetch"

**Possible causes:**
1. Environment variable not set in Vercel
2. Environment variable has wrong value
3. Didn't redeploy after adding variable
4. CORS not configured
5. R2 URL is incorrect

**Solution:**
1. Verify `NEXT_PUBLIC_NIFTI_FILE_URL` in Vercel settings
2. Test R2 URL with `curl` or `node utils/test_r2_url.js`
3. Check CORS configuration
4. Redeploy Vercel app

### Issue: CORS Error in Browser

**Error**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solution:**
1. Go to R2 → Bucket → Settings → CORS Policy
2. Add your domain to `AllowedOrigins`
3. Ensure `AllowedMethods` includes `GET` and `HEAD`

### Issue: 403 Forbidden

**Error**: `403 Forbidden` when accessing R2 URL

**Solution:**
1. Verify Public Development URL is enabled
2. Check file permissions in R2
3. Verify URL is correct (includes bucket name and file path)

### Issue: 404 Not Found

**Error**: `404 Not Found` when accessing R2 URL

**Solution:**
1. Verify file was uploaded successfully
2. Check file path in URL matches R2 bucket structure
3. Verify bucket name in URL is correct

## Quick Debug Checklist

- [ ] R2 URL is accessible (test with `curl` or `node utils/test_r2_url.js`)
- [ ] `NEXT_PUBLIC_NIFTI_FILE_URL` is set in Vercel
- [ ] Environment variable value is correct (full URL)
- [ ] CORS is configured in R2 bucket
- [ ] Vercel app was redeployed after adding env var
- [ ] Browser console shows correct URL being requested
- [ ] Network tab shows 200 status (not 403/404)

## Testing Locally vs Production

| Environment | Uses R2? | How to Configure |
|------------|----------|------------------|
| Local (`npm run dev`) | Only if `.env.local` has `NEXT_PUBLIC_NIFTI_FILE_URL` | Create `frontend/.env.local` |
| Vercel Production | Yes, if env var is set | Set in Vercel Dashboard → Settings → Environment Variables |

**Default behavior**: If `NEXT_PUBLIC_NIFTI_FILE_URL` is not set, app falls back to local files (`/demo-data/medical_imaging/ct_scan.nii.gz`).

