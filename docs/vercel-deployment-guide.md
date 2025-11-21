# Vercel Deployment Guide

This guide will walk you through deploying your Next.js frontend to Vercel and connecting your custom domain from Porkbun.

## Prerequisites

✅ You have a Vercel account  
✅ You have a domain from Porkbun (reviewscholar.com)  
✅ Your code is in a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Push Your Code to Git

Make sure your latest changes, including the new `vercel.json` file, are committed and pushed:

```bash
git add vercel.json
git commit -m "Add Vercel configuration for frontend deployment"
git push origin main
```

## Step 2: Connect Your Repository to Vercel

1. **Log in to Vercel**: Go to [vercel.com](https://vercel.com) and sign in
2. **Import Project**: Click "Add New..." → "Project"
3. **Import Git Repository**: 
   - Select your Git provider (GitHub/GitLab/Bitbucket)
   - Find and select your `RSNA2025_DLL_AgenticAI` repository
   - Click "Import"

## Step 3: Configure Project Settings

Vercel should automatically detect the Next.js framework. Verify these settings:

### Framework Preset
- **Framework**: Next.js (should be auto-detected)

### Root Directory
- **Root Directory**: `frontend` (this tells Vercel to build from the frontend folder)

### Build and Output Settings
- **Build Command**: `npm run build` (runs from the frontend directory)
- **Output Directory**: `.next` (Next.js default)
- **Install Command**: `npm install` (runs from the frontend directory)

> **Note**: The `vercel.json` file we created handles these settings automatically, but you can verify them in the Vercel dashboard.

## Step 4: Environment Variables (Optional)

If you plan to connect a backend API later, you can add environment variables:

1. In the Vercel project settings, go to **Settings** → **Environment Variables**
2. Add:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your backend API URL (e.g., `https://your-backend.vercel.app` or your backend domain)
   - **Environments**: Select Production, Preview, and Development

> **Note**: Since your backend is not yet implemented, you can skip this step for now. The frontend will default to `http://localhost:8000` when running locally.

## Step 5: Deploy

1. Click **"Deploy"** button
2. Wait for the build to complete (usually 1-2 minutes)
3. Once deployed, Vercel will provide you with a URL like: `your-project.vercel.app`

## Step 6: Connect Your Custom Domain

### In Vercel Dashboard:

1. Go to your project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain: `reviewscholar.com` (and optionally `www.reviewscholar.com`)
4. Click **"Add"**

Vercel will show you the DNS records you need to configure.

### In Porkbun Dashboard:

Based on your Porkbun domain settings, you need to add DNS records:

1. **Go to DNS Records** section in Porkbun
2. **Add/Update the following records**:

   For the root domain (`reviewscholar.com`):
   - **Type**: `A` or `CNAME`
   - **Name**: `@` (or leave blank for root)
   - **Value**: Vercel will provide this (usually something like `76.76.21.21` for A record, or a CNAME like `cname.vercel-dns.com`)
   - **TTL**: `600` (or default)

   For the www subdomain (`www.reviewscholar.com`):
   - **Type**: `CNAME`
   - **Name**: `www`
   - **Value**: `cname.vercel-dns.com` (or what Vercel provides)
   - **TTL**: `600` (or default)

> **Important**: Vercel will show you the exact DNS values to use. Follow those instructions.

### DNS Propagation

After adding DNS records:
- DNS changes can take 24-48 hours to propagate, but usually happen within minutes to hours
- You can check propagation status using tools like [whatsmydns.net](https://www.whatsmydns.net)

## Step 7: SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt once DNS is configured correctly. This usually happens automatically within a few minutes after DNS propagation.

## Step 8: Verify Deployment

1. Visit your domain: `https://reviewscholar.com`
2. Check that the site loads correctly
3. Test the CT viewer and other features

## Troubleshooting

### Build Fails

- Check the build logs in Vercel dashboard
- Ensure `package.json` has all required dependencies
- Verify Node.js version compatibility (Next.js 16 requires Node 18+)

### Domain Not Working

- Verify DNS records are correct in Porkbun
- Check DNS propagation status
- Ensure you've added the domain in Vercel dashboard
- Wait for SSL certificate provisioning (can take up to 24 hours)

### Environment Variables Not Working

- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding environment variables
- Check variable names match exactly (case-sensitive)

## Continuous Deployment

Once connected, Vercel will automatically:
- Deploy new commits to the `main` branch to production
- Create preview deployments for pull requests
- Run builds on every push

## Next Steps

- Monitor deployments in the Vercel dashboard
- Set up custom domain redirects if needed (www → root or vice versa)
- Configure environment variables when your backend is ready
- Set up Vercel Analytics if desired

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Vercel Domain Configuration](https://vercel.com/docs/concepts/projects/domains)

