# Deployment Guide

## Overview

This guide covers deploying the RSNA 2025 Radiology AI application:

- **Frontend**: Next.js SPA → Vercel
- **Backend**: FastAPI + Google Agentic ADK → Vultr Server (or local development)

---

## Prerequisites

### Required Accounts

- [ ] Vercel account (for frontend)
- [ ] Vultr account (for backend server, optional)
- [ ] GitHub account (for repository)

### Required Tools

- [ ] Node.js 18+ and npm
- [ ] Python 3.10+
- [ ] Git
- [ ] SSH access (for Vultr server deployment)

### API Keys & Credentials

- [ ] Google AI API Key (for Gemini)

---

## Part 1: Frontend Deployment (Vercel)

### 1.1 Prepare Frontend for Deployment

**Update environment variables:**

Create `.env.production` in `frontend/`:
```
NEXT_PUBLIC_API_URL=https://your-backend-server.com
NEXT_PUBLIC_DEMO_MODE=true
```

**Update `next.config.js`:**
```javascript
module.exports = {
  reactStrictMode: true,
  output: "standalone", // Optimize for deployment
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};
```

### 1.2 Deploy to Vercel

**Option A: Deploy via Vercel Dashboard**

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select `frontend/` as the root directory
4. Configure build settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` = (your backend URL, add after backend deployment)
6. Click "Deploy"

**Option B: Deploy via Vercel CLI**

```bash
cd frontend/
npm install -g vercel
vercel login
vercel --prod
```

### 1.3 Configure Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

---

## Part 2: Backend Deployment Options

### Option A: Vultr Server Deployment

### 2.1 Set Up Vultr Server

**Create Vultr Instance:**

1. Log in to Vultr dashboard
2. Create new instance:
   - Choose Ubuntu 22.04 LTS
   - Select appropriate size (2GB RAM minimum recommended)
   - Choose location closest to your users
   - Add SSH key or set root password
3. Note the server IP address

### 2.2 Initial Server Setup

**Connect to server:**
```bash
ssh root@your-server-ip
```

**Update system:**
```bash
apt update && apt upgrade -y
```

**Install required software:**
```bash
# Install Python 3.10+
apt install python3 python3-pip python3-venv -y

# Install Nginx (for reverse proxy)
apt install nginx -y

# Install Git
apt install git -y
```

### 2.3 Deploy Backend Application

**Clone repository:**
```bash
cd /opt
git clone https://github.com/your-username/RSNA2025_DLL_AgenticAI.git
cd RSNA2025_DLL_AgenticAI/backend
```

**Set up Python environment:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Create environment file:**
```bash
nano .env
```

Add:
```
GOOGLE_API_KEY=your_api_key_here
DATA_DIR=/opt/RSNA2025_DLL_AgenticAI/data
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
API_PORT=8000
LOG_LEVEL=INFO
```

**Test application:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2.4 Set Up Systemd Service

**Create service file:**
```bash
nano /etc/systemd/system/rsna-backend.service
```

Add:
```ini
[Unit]
Description=RSNA Radiology AI Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/RSNA2025_DLL_AgenticAI/backend
Environment="PATH=/opt/RSNA2025_DLL_AgenticAI/backend/venv/bin"
ExecStart=/opt/RSNA2025_DLL_AgenticAI/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

**Enable and start service:**
```bash
systemctl daemon-reload
systemctl enable rsna-backend
systemctl start rsna-backend
systemctl status rsna-backend
```

### 2.5 Configure Nginx Reverse Proxy

**Create Nginx configuration:**
```bash
nano /etc/nginx/sites-available/rsna-backend
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com your-server-ip;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable site:**
```bash
ln -s /etc/nginx/sites-available/rsna-backend /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 2.6 Set Up SSL (Optional but Recommended)

**Install Certbot:**
```bash
apt install certbot python3-certbot-nginx -y
```

**Obtain SSL certificate:**
```bash
certbot --nginx -d your-domain.com
```

**Auto-renewal (already set up by certbot):**
```bash
certbot renew --dry-run
```

### Option B: Local Development Setup

### 2.7 Local Development Configuration

**For local development (workshop sharing via GitHub):**

1. Clone repository locally
2. Set up backend:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Create `.env` file:
```
GOOGLE_API_KEY=your_api_key_here
DATA_DIR=../data
CORS_ORIGINS=http://localhost:3000
API_PORT=8000
LOG_LEVEL=INFO
```

4. Run backend:
```bash
uvicorn app.main:app --reload --port 8000
```

5. Backend will be available at: `http://localhost:8000`

**For frontend local development:**
```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: `http://localhost:3000`

---

## Part 3: Connect Frontend to Backend

### 3.1 Update Frontend Environment Variable

1. Go to Vercel dashboard → Your Project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_URL` with your backend URL:
   - For Vultr: `https://your-domain.com` or `http://your-server-ip`
   - For local: `http://localhost:8000`
3. Redeploy frontend (Vercel will auto-redeploy)

### 3.2 Update Backend CORS Settings

Ensure backend allows your Vercel frontend URL:

In backend `.env` file:
```
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
```

Restart backend service:
```bash
systemctl restart rsna-backend
```

---

## Part 4: Data Management

### 4.1 Data Directory Structure

**For Vultr Server:**
- Data files should be in: `/opt/RSNA2025_DLL_AgenticAI/data/`
- Ensure proper permissions:
```bash
chmod -R 755 /opt/RSNA2025_DLL_AgenticAI/data
```

**For Local Development:**
- Data files should be in: `/data/` (root of repository)
- This allows easy sharing via GitHub

### 4.2 NIfTI File Handling

For the CT scan NIfTI file:
1. Place in `data/medical_imaging/ct_scan.nii.gz`
2. Ensure file is accessible by backend
3. For large files, consider:
   - Using a CDN (optional)
   - Serving through backend endpoint
   - Direct file serving via Nginx (if needed)

---

## Part 5: Monitoring & Logging

### 5.1 Backend Logs

**View logs on Vultr server:**
```bash
# View service logs
journalctl -u rsna-backend -f

# View application logs (if logging to file)
tail -f /opt/RSNA2025_DLL_AgenticAI/backend/logs/app.log
```

**View logs locally:**
```bash
# Logs will appear in terminal when running with --reload
```

### 5.2 Vercel Monitoring

1. Vercel Dashboard → Analytics
2. View deployment logs
3. Monitor performance metrics

### 5.3 Health Check

**Test backend health:**
```bash
curl http://your-server-ip/health
# or locally:
curl http://localhost:8000/health
```

**Expected response:**
```json
{"status": "healthy", "version": "1.0.0"}
```

---

## Part 6: Testing Deployment

### 6.1 Health Check

```bash
# Test backend health
curl http://your-server-ip/health

# Expected response:
# {"status": "healthy", "version": "1.0.0"}
```

### 6.2 End-to-End Test

1. Visit your Vercel frontend URL
2. Open browser console (F12)
3. Try clicking "Add Clinical History" macro
4. Verify:
   - Request goes to backend
   - Response received within 5 seconds
   - Report updates correctly
   - No CORS errors

### 6.3 Performance Testing

```bash
# Install Apache Bench (if not installed)
# Test backend endpoint
ab -n 100 -c 10 http://your-server-ip/health
```

---

## Part 7: Local Development for Workshop

### 7.1 GitHub Repository Setup

**For workshop participants to run locally:**

1. Ensure repository is public or accessible
2. Create comprehensive README.md with:
   - Prerequisites
   - Installation steps
   - Configuration instructions
   - How to get Google API key
   - How to run locally

**README.md should include:**
```markdown
# RSNA 2025 Radiology AI

## Quick Start

1. Clone repository
2. Set up backend:
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your Google API key
   uvicorn app.main:app --reload

3. Set up frontend:
   cd frontend
   npm install
   npm run dev

4. Visit http://localhost:3000
```

### 7.2 Configuration for Local Users

**Create `.env.example` files:**

`backend/.env.example`:
```
GOOGLE_API_KEY=your_key_here
DATA_DIR=../data
CORS_ORIGINS=http://localhost:3000
API_PORT=8000
LOG_LEVEL=INFO
```

`frontend/.env.local.example`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_DEMO_MODE=true
```

### 7.3 Data Files for Local Users

- All dummy data should be in `/data/` directory
- Include sample NIfTI file (or instructions to download one)
- Ensure all data files are included in repository
- Document data structure in README

---

## Troubleshooting

### Common Issues

**1. CORS Errors**
- Verify `CORS_ORIGINS` includes your frontend URL
- Check for trailing slashes (match exactly)
- Restart backend after changes

**2. Backend Timeout**
- Check server resources (CPU, RAM)
- Optimize agent pipeline performance
- Consider increasing server size

**3. Out of Memory**
- Increase Vultr server RAM
- Optimize data loading
- Use streaming for large files

**4. Data Files Not Found**
- Verify DATA_DIR path in environment variables
- Check file permissions
- Ensure data directory exists

**5. Google API Errors**
- Verify API key is correct
- Check API quota/limits
- Ensure API key has proper permissions

**6. Service Not Starting**
- Check logs: `journalctl -u rsna-backend -n 50`
- Verify Python environment is activated
- Check file paths in service file

---

## Cost Optimization

### Estimated Monthly Costs

- **Vercel**: Free tier (hobby projects)
- **Vultr**: ~$6-12/month (depending on server size)
- **Google AI API**: Variable (depends on usage)

**Total Estimated**: $6-20/month for demo/workshop usage

### Cost Reduction Tips

1. Use smallest Vultr instance that works
2. Optimize agent pipeline for faster responses
3. Cache responses where possible
4. Use Vercel free tier for frontend
5. Monitor Google API usage

---

## Security Considerations

### Production Recommendations

1. **Enable Firewall**: Configure UFW on Vultr server
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

2. **API Key Security**: Never commit API keys to repository
3. **Rate Limiting**: Implement rate limiting on backend
4. **Input Validation**: Strict validation of all user inputs
5. **Secrets Management**: Use environment variables, never hardcode

---

## Rollback Procedure

### Rollback Frontend (Vercel)

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "⋯" → "Promote to Production"

### Rollback Backend (Vultr)

```bash
# SSH into server
ssh root@your-server-ip

# Stop service
systemctl stop rsna-backend

# Revert to previous code version
cd /opt/RSNA2025_DLL_AgenticAI
git checkout previous-commit-hash

# Restart service
systemctl start rsna-backend
```

---

## Post-Deployment Checklist

- [ ] Frontend accessible at Vercel URL
- [ ] Backend accessible at server URL (or localhost for local dev)
- [ ] Health check endpoint returns 200
- [ ] Frontend can communicate with backend (no CORS errors)
- [ ] All macro buttons work
- [ ] CT viewer loads NIfTI file
- [ ] Agent pipeline completes in <5 seconds
- [ ] Error handling works properly
- [ ] Logs are accessible
- [ ] Environment variables set correctly
- [ ] Data files accessible by backend
- [ ] SSL certificate installed (if using domain)
- [ ] Service auto-starts on server reboot

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Vultr Docs**: https://docs.vultr.com
- **Google AI Docs**: https://ai.google.dev/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Next.js Docs**: https://nextjs.org/docs
- **Nginx Docs**: https://nginx.org/en/docs/

---

## Local Development for Workshop Participants

### Quick Start Guide

1. **Clone Repository:**
```bash
git clone https://github.com/your-username/RSNA2025_DLL_AgenticAI.git
cd RSNA2025_DLL_AgenticAI
```

2. **Set Up Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your Google API key
uvicorn app.main:app --reload --port 8000
```

3. **Set Up Frontend (in new terminal):**
```bash
cd frontend
npm install
npm run dev
```

4. **Access Application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

5. **Configure Models (Optional):**
- Edit `backend/app/config/agent_config.json` to change which models agents use

---

**The application is now ready for deployment or local development! 🚀**
