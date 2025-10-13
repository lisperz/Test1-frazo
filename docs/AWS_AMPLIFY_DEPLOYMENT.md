# AWS Amplify Deployment Guide
## Deploy Video Text Inpainting Service to AWS Amplify

---

## 📋 Overview

This guide covers deploying your React frontend to AWS Amplify while keeping the FastAPI backend on your current infrastructure.

**Architecture:**
```
┌─────────────────────┐     ┌──────────────────────┐
│   AWS Amplify       │────▶│  Your Backend Server │
│   (React Frontend)  │     │  (FastAPI + Docker)  │
│   - Static hosting  │     │  - Port 8000         │
│   - CI/CD          │     │  - PostgreSQL        │
│   - SSL/HTTPS      │     │  - Redis/Celery      │
└─────────────────────┘     └──────────────────────┘
```

---

## 🎯 Prerequisites

1. **AWS Account** - Sign up at https://aws.amazon.com/
2. **GitHub Repository** - Your code should be on GitHub
3. **Domain (Optional)** - Custom domain if you want one

---

## 📂 Project Structure Check

Your current structure:
```
Test1-frazo/
├── frontend/              # React app → Will deploy to Amplify
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/               # FastAPI → Keep on your server
├── docker-compose.yml
└── ...
```

**Decision Point:** Deploy only frontend to Amplify, keep backend where it is.

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your React Frontend

#### 1.1 Update Environment Variables

Create `frontend/.env.production`:
```bash
# Production API URL (your backend server)
REACT_APP_API_URL=https://your-backend-domain.com/api/v1
REACT_APP_WS_URL=wss://your-backend-domain.com/ws

# Or use ngrok URL temporarily
REACT_APP_API_URL=https://f83cdfa9a886.ngrok-free.app/api/v1
REACT_APP_WS_URL=wss://f83cdfa9a886.ngrok-free.app/ws
```

#### 1.2 Update frontend/package.json

Ensure build script exists:
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

#### 1.3 Test Local Build

```bash
cd frontend
npm run build

# Test the build locally
npx serve -s build
```

Open http://localhost:3000 to verify.

---

### Step 2: Configure AWS Amplify

#### 2.1 Create amplify.yml in frontend folder

Create `frontend/amplify.yml`:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: build
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

#### 2.2 Add .amplifyignore (Optional)

Create `frontend/.amplifyignore`:
```
node_modules/
.env.local
.env.development
.DS_Store
*.log
```

---

### Step 3: Deploy to AWS Amplify

#### Method 1: Via AWS Console (Recommended for First Time)

**Step 3.1: Sign in to AWS Amplify**

1. Go to: https://console.aws.amazon.com/amplify/
2. Sign in with your AWS account
3. Click **"Get Started"** under **"Host your web app"**

**Step 3.2: Connect Repository**

1. Select **GitHub** (or your Git provider)
2. Click **"Continue"**
3. Authorize AWS Amplify to access your GitHub account
4. Select repository: `Test1-frazo`
5. Select branch: `main` (or your deployment branch)
6. Click **"Next"**

**Step 3.3: Configure Build Settings**

1. **App name**: `video-text-inpainting`
2. **Environment**: `production`
3. **Monorepo settings**: Enable and set root directory to `frontend`
4. Build settings will auto-detect from `amplify.yml`
5. Review the build configuration:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: build
       files:
         - '**/*'
   ```
6. Click **"Next"**

**Step 3.4: Add Environment Variables**

1. Expand **"Advanced settings"**
2. Add environment variables:
   ```
   Key: REACT_APP_API_URL
   Value: https://your-backend-url.com/api/v1

   Key: REACT_APP_WS_URL
   Value: wss://your-backend-url.com/ws
   ```
3. Click **"Save and deploy"**

**Step 3.5: Wait for Deployment**

Amplify will:
- ✅ Provision infrastructure
- ✅ Clone your repository
- ✅ Install dependencies
- ✅ Build your React app
- ✅ Deploy to CDN

This takes 5-10 minutes.

---

### Step 4: Configure Custom Domain (Optional)

**If you have a custom domain:**

1. In Amplify console, go to **"Domain management"**
2. Click **"Add domain"**
3. Enter your domain: `video-inpainting.com`
4. Follow DNS verification steps
5. Amplify will automatically provision SSL certificate

**If you don't have a domain:**

You'll get a free Amplify domain like:
```
https://main.d3abcdefghijk.amplifyapp.com
```

---

### Step 5: Update CORS in Backend

Your backend needs to allow requests from Amplify domain.

**Update backend/.env:**
```bash
CORS_ORIGINS=http://localhost:3000,https://main.d3abcdefghijk.amplifyapp.com,https://your-custom-domain.com
```

**Or update backend/api/main.py directly:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://main.d3abcdefghijk.amplifyapp.com",  # Your Amplify URL
        "https://your-custom-domain.com"  # If you have one
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

**Restart backend:**
```bash
./scripts/restart.sh backend
```

---

### Step 6: Test Your Deployment

1. **Open Amplify URL** in browser
2. **Test Login** with your test accounts
3. **Test Video Upload**
4. **Test Pro Video Editor**
5. **Check Console** for any errors

**Common Issues:**

❌ **API calls failing?**
- Check CORS settings in backend
- Verify API_URL in environment variables
- Check network tab in browser DevTools

❌ **WebSocket not connecting?**
- Ensure WSS (not WS) for HTTPS sites
- Check firewall/security group settings

---

## 🔧 Advanced Configuration

### Enable Automatic Deployments

Amplify automatically deploys when you push to your branch:

```bash
# Make a change
git add .
git commit -m "Update frontend"
git push origin main

# Amplify will automatically:
# 1. Detect the push
# 2. Pull latest code
# 3. Build
# 4. Deploy
```

### Set Up Branch Deployments

**Production branch (main):**
- URL: `https://main.d3abc.amplifyapp.com`
- Auto-deploy on push to `main`

**Development branch (dev):**
1. In Amplify Console → **"Connect branch"**
2. Select `dev` branch
3. Configure build settings
4. Deploy to: `https://dev.d3abc.amplifyapp.com`

### Environment-Specific Variables

**For different environments:**

```bash
# Production (main branch)
REACT_APP_API_URL=https://api.production.com/api/v1

# Development (dev branch)
REACT_APP_API_URL=https://api.dev.com/api/v1

# Staging (staging branch)
REACT_APP_API_URL=https://api.staging.com/api/v1
```

Configure in Amplify Console for each branch.

---

## 💰 Cost Estimates

### AWS Amplify Pricing

**Free Tier (12 months):**
- 1000 build minutes/month
- 15 GB served/month
- 5 GB stored/month

**After free tier:**
- Build minutes: $0.01/minute
- Hosting: $0.15/GB served
- Storage: $0.023/GB/month

**Typical costs for your app:**
- Small traffic (< 1000 users/month): **$0-5/month**
- Medium traffic (1000-10000 users): **$5-20/month**
- Large traffic (> 10000 users): **$20-100/month**

---

## 🔒 Security Best Practices

### 1. Environment Variables

Never commit sensitive data:
```bash
# ❌ DON'T commit
frontend/.env.production

# ✅ DO use Amplify environment variables
```

### 2. API Security

Ensure backend has:
- ✅ HTTPS enabled
- ✅ CORS configured properly
- ✅ JWT authentication working
- ✅ Rate limiting enabled

### 3. SSL Certificate

Amplify automatically provides SSL for:
- ✅ Amplify domain (`*.amplifyapp.com`)
- ✅ Custom domains (via AWS Certificate Manager)

---

## 📊 Monitoring & Logs

### View Build Logs

1. Amplify Console → Your App
2. Click on latest build
3. View logs for each phase:
   - Provision
   - Build
   - Deploy
   - Verify

### Access Logs

1. Go to **"Monitoring"** tab
2. View metrics:
   - Requests
   - Data transfer
   - Build status
   - Error rates

### CloudWatch Integration

Amplify automatically sends logs to CloudWatch for detailed monitoring.

---

## 🚀 Alternative Deployment Options

If Amplify doesn't fit your needs:

### Option 1: Vercel
```bash
npm install -g vercel
cd frontend
vercel --prod
```

### Option 2: Netlify
```bash
npm install -g netlify-cli
cd frontend
netlify deploy --prod --dir=build
```

### Option 3: AWS S3 + CloudFront
```bash
# Build
npm run build

# Upload to S3
aws s3 sync build/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

---

## 📝 Deployment Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] API URL points to production backend
- [ ] CORS configured in backend
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)
- [ ] Test all features work
- [ ] Monitor for errors
- [ ] Set up automatic deployments
- [ ] Configure branch deployments
- [ ] Set up monitoring/alerts
- [ ] Document deployment process
- [ ] Backup/rollback plan ready

---

## 🐛 Troubleshooting

### Build Fails

**Check:**
1. Build logs in Amplify console
2. Ensure all dependencies in `package.json`
3. Node version compatibility
4. Environment variables set correctly

**Fix:**
```bash
# Test build locally first
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### API Calls Return CORS Error

**Fix backend CORS:**
```python
# backend/api/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-amplify-url.amplifyapp.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### WebSocket Connection Fails

**Ensure:**
1. Using `wss://` (not `ws://`) for HTTPS sites
2. Backend WebSocket endpoint accessible
3. Firewall allows WebSocket connections

---

## 📚 Additional Resources

- **AWS Amplify Docs**: https://docs.aws.amazon.com/amplify/
- **AWS Amplify Hosting**: https://aws.amazon.com/amplify/hosting/
- **React Deployment**: https://create-react-app.dev/docs/deployment/

---

## 🎯 Quick Commands Reference

```bash
# Test build locally
cd frontend
npm run build
npx serve -s build

# Push to trigger deployment
git add .
git commit -m "Deploy to production"
git push origin main

# Check Amplify status
aws amplify list-apps

# Trigger manual rebuild
aws amplify start-job --app-id YOUR_APP_ID --branch-name main --job-type RELEASE
```

---

## ✅ Success!

Once deployed, you'll have:

- ✅ Fast global CDN distribution
- ✅ Automatic SSL certificate
- ✅ CI/CD pipeline (auto-deploy on git push)
- ✅ Preview deployments for branches
- ✅ Professional domain (if configured)
- ✅ Scalable infrastructure

Your Video Text Inpainting Service is now live on AWS Amplify! 🎉

---

**Questions?**
- Check AWS Amplify documentation
- Contact AWS support
- Review build logs in console

**Next Steps:**
1. Monitor first week of traffic
2. Set up error tracking (Sentry)
3. Configure analytics
4. Optimize performance
5. Plan for scaling
