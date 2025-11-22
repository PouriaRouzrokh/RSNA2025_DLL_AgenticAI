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

### Enable Public Development URL (Required for public file access)

1. Go to your bucket → **Settings** tab → **General** section
2. Scroll down to **"Public Development URL"** section
3. Click **"Enable"** button
4. This will generate a public URL that allows browser access to your files
5. ⚠️ **Note**: This is for development/testing. For production, consider using a Custom Domain (see Step 3)

> **Important**: After enabling, you'll get a public URL like `https://pub-xxxxx.r2.dev`. You'll use this URL in Step 5.

### Alternative: Set Up Custom Domain (Recommended for Production)

If you prefer a custom domain instead:
1. Go to **Settings** → **Custom Domains** section
2. Click **"+ Add"** button
3. Enter a subdomain (e.g., `cdn.rsna2025-agenticai.com`)
4. Follow Cloudflare's instructions to add DNS records
5. See Step 3 below for more details

### Configure CORS (Required for browser access)

1. Go to your bucket → **Settings** tab
2. Scroll to **"CORS Policy"**
3. Click **"Edit CORS Policy"**
4. Add the following CORS configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://10.0.0.211:3000",
      "http://10.*.*.*:*",
      "http://192.168.*.*:*",
      "http://172.*.*.*:*",
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

> **Note**: 
> - Replace `rsna2025-agenticai.com` with your actual domain. The `*.vercel.app` pattern allows preview deployments to work.
> - If your local IP address is different from `10.0.0.211`, add your specific IP address (e.g., `http://YOUR_IP:3000`) to the `AllowedOrigins` array. R2 CORS wildcard patterns may not work reliably, so it's best to include your specific IP address explicitly.
> - Alternatively, access your app via `http://localhost:3000` instead of your IP address to avoid CORS issues.

## Step 3: Set Up Custom Domain (Optional but Recommended)

1. In your bucket settings, go to **"Custom Domains"**
2. Click **"Connect Domain"**
3. Enter a subdomain (e.g., `cdn.rsna2025-agenticai.com` or `media.rsna2025-agenticai.com`)
4. Follow Cloudflare's instructions to add the DNS record
5. Wait for DNS propagation (usually minutes)

> **Note**: You'll need to add a CNAME record in your domain's DNS settings pointing to the R2 endpoint.

## Step 4: Upload Files to R2

### ⚠️ Important: File Size Limit

**Files larger than 300 MB cannot be uploaded via the web UI** and must use Wrangler CLI or S3 API.

Since your NIfTI file (`ct_scan.nii.gz`) is 443 MB, you **must** use Wrangler CLI (see below).

### Upload Using Wrangler CLI (Required for files > 300 MB):

1. **Install Wrangler CLI** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```
   This will open your browser to authenticate with Cloudflare.

3. **Upload the NIfTI file**:
   ```bash
   cd /Users/pouria/Documents/Coding/RSNA2025_DLL_AgenticAI
   wrangler r2 object put rsna2025-medical-imaging/ct_scan.nii.gz \
     --file=frontend/public/demo-data/medical_imaging/ct_scan.nii.gz
   ```
   Replace `rsna2025-medical-imaging` with your actual bucket name.

4. **Upload the Config File** (small file, can use web UI or CLI):
   ```bash
   wrangler r2 object put rsna2025-medical-imaging/ct_scan_config.json \
     --file=frontend/public/demo-data/medical_imaging/ct_scan_config.json
   ```

### Alternative: Upload Config File via Web UI

If the config file is small (< 300 MB), you can upload it via the web UI:
1. Go to your bucket → **Objects** tab
2. Click **"Upload"**
3. Select `frontend/public/demo-data/medical_imaging/ct_scan_config.json`
4. Upload the file

### Uploading Files > 300 MB (Using S3-Compatible API)

**⚠️ Important**: Both the web UI and Wrangler CLI have a 300 MB limit. For larger files, use the S3-compatible API.

#### Step 1: Get R2 API Credentials

1. Go to Cloudflare Dashboard → **R2** → **Manage R2 API Tokens**
2. Click **"Create API Token"**
3. Give it a name (e.g., "R2 Upload Token")
4. Set permissions: **Object Read & Write**
5. Click **"Create API Token"**
6. **Important**: Copy the **Access Key ID** and **Secret Access Key** immediately (you won't see the secret again!)

#### Step 2: Get Your Account ID

1. In Cloudflare Dashboard, go to any page (like Overview)
2. Your **Account ID** is shown in the right sidebar
3. Copy it (it's a long alphanumeric string)

#### Step 3: Install Required Python Packages

```bash
pip3 install boto3 python-dotenv
```

#### Step 4: Create .env File with Credentials

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your credentials:
   ```bash
   # Open .env in your editor
   nano .env  # or use your preferred editor
   ```

3. Fill in the values:
   ```
   R2_ACCOUNT_ID=your_actual_account_id
   R2_ACCESS_KEY_ID=your_actual_access_key_id
   R2_SECRET_ACCESS_KEY=your_actual_secret_access_key
   ```

   **Important**: The `.env` file is already in `.gitignore` and won't be committed to git.

#### Step 5: Upload Using the Python Script

A helper script `utils/upload_to_r2.py` is included in the repository:

```bash
python3 utils/upload_to_r2.py \
  frontend/public/demo-data/medical_imaging/ct_scan.nii.gz \
  rsna2025-medical-imaging \
  ct_scan.nii.gz
```

Replace `rsna2025-medical-imaging` with your actual bucket name.

The script will automatically:
- Read credentials from `.env` file
- Use multipart upload for large files (>100 MB)
- Show upload progress

### Verify Upload

After uploading, verify both files appear in your bucket:
1. Go to your bucket → **Objects** tab
2. You should see both `ct_scan.nii.gz` and `ct_scan_config.json`
3. Click on each file to verify they uploaded correctly

## Step 5: Get the Public URL

### If Using Public Development URL:

After enabling Public Development URL in Step 2, you'll get a URL like:
```
https://pub-xxxxx.r2.dev
```

To get the full file URL:
1. Go to your bucket → **Objects** tab
2. Click on the file `ct_scan.nii.gz`
3. In the file details, you'll see the **"Public Development URL"** 
4. Copy the full URL (e.g., `https://pub-xxxxx.r2.dev/ct_scan.nii.gz`)

**Note**: The URL format is `https://pub-xxxxx.r2.dev/<filename>`, without the bucket name in the path.

### If Using Custom Domain:

The URL will be:
```
https://cdn.rsna2025-agenticai.com/ct_scan.nii.gz
```
(Replace with your actual custom domain)

## Step 6: Configure Environment Variables

### For Local Development

Create a `.env.local` file in the `frontend` directory:

```bash
cd frontend
cat > .env.local << EOF
# File Source Configuration
# Set to 'true' to use cloud files (R2), 'false' to use local files
NEXT_PUBLIC_USE_CLOUD_FILES=true

# R2 Cloud File URL (only used if NEXT_PUBLIC_USE_CLOUD_FILES is true)
NEXT_PUBLIC_NIFTI_FILE_URL=https://pub-xxxxx.r2.dev/ct_scan.nii.gz
EOF
```

Replace `https://pub-xxxxx.r2.dev/ct_scan.nii.gz` with your actual R2 URL.

**To switch between local and cloud files:**
- Set `NEXT_PUBLIC_USE_CLOUD_FILES=false` to use local files (`/demo-data/medical_imaging/ct_scan.nii.gz`)
- Set `NEXT_PUBLIC_USE_CLOUD_FILES=true` to use R2 cloud files
- Restart your dev server after changing: `npm run dev`

### For Vercel Deployment

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add the following variables:
   - **Name**: `NEXT_PUBLIC_USE_CLOUD_FILES`
   - **Value**: `true` (to use R2) or `false` (to use local files)
   - **Environments**: Select Production, Preview, and Development
   
   - **Name**: `NEXT_PUBLIC_NIFTI_FILE_URL`
   - **Value**: Your R2 public URL (from Step 5)
   - **Environments**: Select Production, Preview, and Development
3. Click **"Save"**

### Example Values:

- **Public Development URL**: `https://pub-xxxxx.r2.dev/ct_scan.nii.gz`
  - Replace `xxxxx` with your actual public development URL ID
  - Note: URL does not include bucket name in the path
- **Custom Domain**: `https://cdn.rsna2025-agenticai.com/ct_scan.nii.gz`

## Step 7: How It Works

The app uses a configuration flag to determine file source:
- If `NEXT_PUBLIC_USE_CLOUD_FILES=true`: Uses R2 cloud files (`NEXT_PUBLIC_NIFTI_FILE_URL`)
- If `NEXT_PUBLIC_USE_CLOUD_FILES=false` or not set: Uses local files (`/demo-data/medical_imaging/ct_scan.nii.gz`)

This allows you to easily switch between local development and cloud deployment without changing code.

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

### Upload Errors (File Size Exceeds 300 MB)

If you see an error like "File size exceeds 300 MB and can only be uploaded using the S3/Workers API":

- **Solution**: Use Wrangler CLI to upload large files (see Step 4)
- Verify Wrangler is installed: `wrangler --version`
- Ensure you're logged in: `wrangler login`
- Check the file path is correct and the file exists
- For very large files (> 1 GB), consider using multipart upload or S3 API directly

### CORS Errors

If you see CORS errors in the browser console:
- Verify your CORS policy includes your domain
- Check that `AllowedMethods` includes `GET` and `HEAD`
- Ensure `AllowedOrigins` matches your actual domain (including `https://`)

### 403 Forbidden Errors

- Check that **Public Development URL** is enabled in bucket settings
- Verify the file path/name matches exactly in the URL
- Ensure you're using the correct public development URL format
- If using custom domain, verify DNS records are configured correctly

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

