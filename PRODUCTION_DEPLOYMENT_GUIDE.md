# Production Deployment Guide

## 🎯 Overview

This guide covers deploying your video text inpainting platform from local development to a production environment. The platform is currently production-ready with complete frontend-backend integration and GhostCut API processing.

---

## 🏗️ Production Architecture Options

### **Option 1: Cloud Provider Deployment (Recommended)**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │  Container Orch │    │  Database/Cache │
│   (Nginx/ALB)   │───▶│  (Docker/K8s)   │───▶│  (RDS/ElastiC)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                      ┌─────────────────┐
                      │  File Storage   │
                      │  (S3/GCS/Azure) │
                      └─────────────────┘
```

### **Option 2: VPS/Dedicated Server**
```
┌─────────────────────────────────────────┐
│          Single Server Deployment      │
│                                         │
│  ┌─────────┐  ┌──────────┐  ┌────────┐ │
│  │ Nginx   │  │ App      │  │ Redis  │ │
│  │ (Proxy) │  │ Contain. │  │ Cache  │ │
│  └─────────┘  └──────────┘  └────────┘ │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │         PostgreSQL Database         │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🚀 Step-by-Step Production Deployment

### **Phase 1: Infrastructure Setup**

#### **1.1 Cloud Provider Selection**
**Recommended Providers:**
- **AWS**: ECS/EKS, RDS, ElastiCache, S3, ALB
- **Google Cloud**: Cloud Run, Cloud SQL, Redis, Storage, Load Balancer
- **Azure**: Container Instances, Azure Database, Redis Cache, Blob Storage
- **DigitalOcean**: Droplets, Managed Database, Spaces (Budget-friendly)

#### **1.2 Domain & SSL Setup**
```bash
# 1. Purchase domain (e.g., yourvideotool.com)
# 2. Configure DNS to point to your server/load balancer
# 3. Set up SSL certificate (Let's Encrypt or CloudFlare)

# Example DNS configuration:
# A     @              YOUR_SERVER_IP
# CNAME www            yourvideotool.com
# CNAME api            yourvideotool.com
```

### **Phase 2: Environment Configuration**

#### **2.1 Production Environment Variables**
Create `production.env`:
```bash
# Application
ENVIRONMENT=production
DEBUG=false
APP_NAME=Video Text Inpainting Service
APP_VERSION=1.0.0

# Security
JWT_SECRET_KEY=your-super-secure-random-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Database (Use managed database service)
DATABASE_URL=postgresql://username:password@your-rds-endpoint/video_text_inpainting

# Redis (Use managed Redis service)
REDIS_URL=redis://your-elasticache-endpoint:6379/0

# External APIs
GHOSTCUT_API_KEY=your-production-ghostcut-key
GHOSTCUT_API_URL=https://api.ghostcut.com

# File Storage (Use cloud storage)
UPLOAD_PATH=/app/uploads
MAX_UPLOAD_SIZE=2147483648
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-west-2
AWS_BUCKET_NAME=your-video-storage-bucket

# Performance
WORKERS=4
MAX_CONNECTIONS=100

# Monitoring
LOG_LEVEL=INFO
ENABLE_METRICS=true

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-app@yourdomain.com
SMTP_PASSWORD=your-app-password

# CORS (restrict to your domain)
CORS_ORIGINS=https://yourvideotool.com,https://www.yourvideotool.com
```

#### **2.2 Production Docker Configuration**
Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

  backend:
    build: 
      context: .
      dockerfile: Dockerfile.backend
    environment:
      - ENVIRONMENT=production
    env_file:
      - production.env
    volumes:
      - /app/uploads:/app/uploads
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 1G
          cpus: '0.5'

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    restart: unless-stopped

  worker:
    build: 
      context: .
      dockerfile: Dockerfile.backend
    command: celery -A workers.celery_app worker --loglevel=info
    env_file:
      - production.env
    volumes:
      - /app/uploads:/app/uploads
    restart: unless-stopped
    deploy:
      replicas: 2
```

### **Phase 3: Security Hardening**

#### **3.1 Nginx Production Configuration**
Create `nginx.prod.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=upload:10m rate=1r/s;

    server {
        listen 80;
        server_name yourvideotool.com www.yourvideotool.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourvideotool.com www.yourvideotool.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;

        # Frontend
        location / {
            proxy_pass http://frontend:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # API with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Upload endpoint with strict limits
        location /api/v1/direct/direct-process {
            limit_req zone=upload burst=5 nodelay;
            client_max_body_size 2G;
            proxy_pass http://backend;
            proxy_read_timeout 300s;
            proxy_send_timeout 300s;
        }
    }
}
```

#### **3.2 Application Security**
```python
# backend/config.py - Production security settings
import secrets

# Generate secure secret key
JWT_SECRET_KEY = secrets.token_urlsafe(32)

# Database connection with SSL
DATABASE_URL = "postgresql://user:pass@host/db?sslmode=require"

# Restrict CORS origins
CORS_ORIGINS = ["https://yourvideotool.com", "https://www.yourvideotool.com"]

# Security middleware
TRUSTED_HOSTS = ["yourvideotool.com", "www.yourvideotool.com"]
```

### **Phase 4: Database & Storage Setup**

#### **4.1 Managed Database (Recommended)**
```bash
# AWS RDS PostgreSQL
aws rds create-db-instance \
    --db-instance-identifier video-text-inpainting-prod \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username admin \
    --master-user-password your-secure-password \
    --allocated-storage 20 \
    --vpc-security-group-ids sg-xxxxxxxx

# Run database migration
docker exec backend alembic upgrade head
```

#### **4.2 Cloud File Storage**
```python
# backend/config.py - Cloud storage configuration
import boto3

# AWS S3 configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = "your-video-storage-bucket"
AWS_REGION = "us-west-2"

# File upload to S3
s3_client = boto3.client('s3')
```

### **Phase 5: Monitoring & Logging**

#### **5.1 Application Monitoring**
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=your-grafana-password

  loki:
    image: grafana/loki
    ports:
      - "3100:3100"
```

#### **5.2 Log Management**
```python
# backend/logging_config.py
import logging
from pythonjsonlogger import jsonlogger

# Structured JSON logging for production
formatter = jsonlogger.JsonFormatter(
    "%(asctime)s %(name)s %(levelname)s %(message)s"
)

handler = logging.StreamHandler()
handler.setFormatter(formatter)

logger = logging.getLogger()
logger.addHandler(handler)
logger.setLevel(logging.INFO)
```

### **Phase 6: CI/CD Pipeline**

#### **6.1 GitHub Actions Deployment**
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /app/video-text-inpainting
          git pull origin main
          docker-compose -f docker-compose.prod.yml build
          docker-compose -f docker-compose.prod.yml up -d
          docker system prune -f
```

---

## 💰 Cost Optimization

### **Estimated Monthly Costs**

#### **AWS Deployment (Medium Scale)**
- **EC2 (t3.medium x2)**: $60/month
- **RDS PostgreSQL (db.t3.micro)**: $15/month
- **ElastiCache Redis (cache.t3.micro)**: $15/month
- **S3 Storage (500GB)**: $12/month
- **Load Balancer**: $18/month
- **Data Transfer**: $20/month
- **Total**: ~$140/month

#### **Budget Option (DigitalOcean)**
- **Droplet (4GB RAM)**: $24/month
- **Managed Database**: $15/month
- **Spaces Storage**: $5/month
- **Load Balancer**: $12/month
- **Total**: ~$56/month

### **Cost Optimization Tips**
1. **Auto-scaling**: Scale containers based on demand
2. **Reserved Instances**: Use reserved pricing for predictable workloads
3. **CDN**: Use CloudFlare for static content delivery
4. **Database Connection Pooling**: Reduce database costs
5. **Efficient Storage**: Compress videos, clean up old files

---

## 🔧 Performance Optimization

### **Application Level**
```python
# backend/config.py - Production performance settings
# Database connection pooling
SQLALCHEMY_ENGINE_OPTIONS = {
    "pool_size": 10,
    "max_overflow": 20,
    "pool_pre_ping": True,
    "pool_recycle": 300,
}

# Redis connection pooling
REDIS_CONNECTION_POOL = redis.ConnectionPool(
    host=REDIS_HOST,
    port=REDIS_PORT,
    max_connections=20
)

# Async processing
CELERY_BROKER_POOL_LIMIT = 10
CELERY_RESULT_BACKEND_POOL_LIMIT = 10
```

### **Frontend Optimization**
```bash
# Build optimized frontend
cd frontend
npm run build

# Enable gzip compression in nginx
gzip on;
gzip_types text/css application/json application/javascript;
```

---

## 📊 Monitoring Checklist

### **Health Checks**
- [ ] Application health endpoints responding
- [ ] Database connectivity working
- [ ] Redis cache operational
- [ ] GhostCut API integration functional
- [ ] File upload/processing working
- [ ] Email notifications sending

### **Performance Monitoring**
- [ ] Response times < 2 seconds
- [ ] Database query performance
- [ ] Memory usage < 80%
- [ ] CPU usage < 70%
- [ ] Disk space monitoring
- [ ] Error rate < 1%

### **Security Monitoring**
- [ ] SSL certificates valid
- [ ] Security headers present
- [ ] Rate limiting active
- [ ] No exposed sensitive data in logs
- [ ] Database access restricted

---

## 🚨 Disaster Recovery

### **Backup Strategy**
```bash
# Automated database backups
# Create backup script
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
aws s3 cp backup_*.sql s3://your-backup-bucket/

# Schedule with cron
0 2 * * * /path/to/backup_script.sh
```

### **Recovery Plan**
1. **Database Recovery**: Restore from latest backup
2. **Application Recovery**: Redeploy from Git repository
3. **File Recovery**: Restore from S3 backup
4. **DNS Failover**: Switch to backup server if needed

---

## 📋 Production Deployment Checklist

### **Pre-Deployment**
- [ ] Production environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Security headers implemented
- [ ] Rate limiting configured
- [ ] Monitoring systems set up
- [ ] Backup procedures tested
- [ ] Load testing completed

### **Post-Deployment**
- [ ] Application health check passes
- [ ] Video upload and processing works
- [ ] GhostCut API integration functional
- [ ] User registration/login working
- [ ] Payment processing (if implemented) tested
- [ ] Email notifications working
- [ ] Performance monitoring active
- [ ] Error tracking operational
- [ ] Backup system verified

---

## 🎯 Recommended Production Timeline

### **Week 1: Infrastructure Setup**
- Set up cloud accounts (AWS/GCP/Azure)
- Configure domain and DNS
- Set up SSL certificates
- Create production environment

### **Week 2: Application Deployment**
- Deploy application containers
- Set up managed database and Redis
- Configure file storage
- Test core functionality

### **Week 3: Security & Performance**
- Implement security hardening
- Set up monitoring and logging
- Perform load testing
- Optimize performance

### **Week 4: Go Live**
- Final testing and validation
- DNS cutover to production
- Monitor initial traffic
- Address any issues

---

**This production deployment plan ensures your video text inpainting platform scales reliably while maintaining security, performance, and cost-effectiveness.**