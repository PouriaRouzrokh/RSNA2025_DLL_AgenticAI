# Cloudflare R2 Setup Guide

This guide will walk you through setting up Cloudflare R2 object storage and configuring your Vercel-hosted app to fetch the NIfTI file from R2.

## Step 1: Create an R2 Bucket

1. **Log in to Cloudflare Dashboard**: Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Navigate to R2**: Click on **"R2"** in the left sidebar (under "Storage")
3. **Create Bucket**: 
   - Click **"Create bucket"**
   - Enter a bucket name (e.g., `rsna2025-medical-imaging`)
   - Choose a location (select the region closest to your users)
   - Click **"Create bucket"**

## Step 2: Configure Bucket Settings

### Enable Public Access (for public files)

1. Go to your bucket → **Settings** tab
2. Under **"Public Access"**, you have two options:

   **Option A: Public Bucket (Simpler)**
   - Enable **"Allow Access"** 
   - This makes all files in the bucket publicly accessible
   - ⚠️ Only use this if you don't have sensitive data

   **Option B: Custom Domain (Recommended)**
   - Set up a custom domain for your R2 bucket
   - This gives you better control and branding
   - See Step 3 below

### Configure CORS (Required for browser access)

1. Go to your bucket → **Settings** tab
2. Scroll to **"CORS Policy"**
3. Click **"Edit CORS Policy"**
4. Add the following CORS configuration:

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

5. Click **"Save"**

> **Note**: Replace `rsna2025-agenticai.com` with your actual domain. The `*.vercel.app` pattern allows preview deployments to work.

## Step 3: Set Up Custom Domain (Optional but Recommended)

1. In your bucket settings, go to **"Custom Domains"**
2. Click **"Connect Domain"**
3. Enter a subdomain (e.g., `cdn.rsna2025-agenticai.com` or `media.rsna2025-agenticai.com`)
4. Follow Cloudflare's instructions to add the DNS record
5. Wait for DNS propagation (usually minutes)

> **Note**: You'll need to add a CNAME record in your domain's DNS settings pointing to the R2 endpoint.

## Step 4: Upload Files to R2

### Upload the NIfTI File:

1. Go to your bucket
2. Click **"Upload"**
3. Navigate to: `frontend/public/demo-data/medical_imaging/ct_scan.nii.gz`
4. Upload the file
5. **Important**: Note the file path/name in R2 (it should be `ct_scan.nii.gz`)

### Upload the Config File:

1. In the same bucket, upload: `frontend/public/demo-data/medical_imaging/ct_scan_config.json`
2. **Important**: Upload it to the same directory/path structure as the NIfTI file
3. This ensures the config file URL can be derived from the NIfTI file URL

### Using Wrangler CLI (Alternative):

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Upload file
wrangler r2 object put rsna2025-medical-imaging/ct_scan.nii.gz --file=frontend/public/demo-data/medical_imaging/ct_scan.nii.gz
```

## Step 5: Get the Public URL

### If Using Public Bucket Access:

The URL format will be:
```
https://<account-id>.r2.cloudflarestorage.com/<bucket-name>/ct_scan.nii.gz
```

You can find this by:
1. Clicking on the file in your bucket
2. Copying the **"Public URL"** or **"R2.dev subdomain"** URL

### If Using Custom Domain:

The URL will be:
```
https://cdn.rsna2025-agenticai.com/ct_scan.nii.gz
```
(Replace with your actual custom domain)

## Step 6: Configure Environment Variables in Vercel

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add the following variable:
   - **Name**: `NEXT_PUBLIC_NIFTI_FILE_URL`
   - **Value**: Your R2 public URL (from Step 5)
   - **Environments**: Select Production, Preview, and Development
3. Click **"Save"**

### Example Values:

- **Public R2 URL**: `https://pub-xxxxx.r2.dev/rsna2025-medical-imaging/ct_scan.nii.gz`
- **Custom Domain**: `https://cdn.rsna2025-agenticai.com/ct_scan.nii.gz`

## Step 7: Update Your Code

The code has been updated to use the environment variable. The app will:
- Use `NEXT_PUBLIC_NIFTI_FILE_URL` if set (from R2)
- Fall back to `/demo-data/medical_imaging/ct_scan.nii.gz` for local development

## Step 8: Redeploy on Vercel

After adding the environment variable:
1. Go to your Vercel project
2. Click **"Deployments"**
3. Click the three dots (⋯) on the latest deployment
4. Click **"Redeploy"**
5. Or simply push a new commit to trigger automatic deployment

## Step 9: Verify

1. Visit your deployed site: `https://rsna2025-agenticai.com`
2. Open browser DevTools → Network tab
3. Load the CT viewer
4. Verify that the NIfTI file is being fetched from your R2 URL (not from `/demo-data/...`)

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:
- Verify your CORS policy includes your domain
- Check that `AllowedMethods` includes `GET` and `HEAD`
- Ensure `AllowedOrigins` matches your actual domain (including `https://`)

### 403 Forbidden Errors

- Check that public access is enabled (if using public bucket)
- Verify the file path/name matches exactly
- Check bucket permissions

### File Not Found (404)

- Verify the file was uploaded successfully
- Check the file path in the URL matches the bucket structure
- Ensure the bucket name and file name are correct

### Environment Variable Not Working

- Ensure variable name starts with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding environment variables
- Check variable value doesn't have extra spaces or quotes

## Security Considerations

1. **Public vs Private**: If your medical imaging data is sensitive, consider:
   - Using signed URLs instead of public access
   - Implementing authentication
   - Using Cloudflare Access for additional security

2. **Rate Limiting**: Consider setting up rate limiting in Cloudflare to prevent abuse

3. **Cost Monitoring**: Monitor your R2 usage in Cloudflare dashboard to track storage and egress costs

## Additional Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 CORS Configuration](https://developers.cloudflare.com/r2/buckets/cors/)
- [R2 Custom Domains](https://developers.cloudflare.com/r2/buckets/custom-domains/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

