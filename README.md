# Video Text Inpainting Service

A professional customer-facing web service for AI-powered video text removal using advanced inpainting technology. Built with FastAPI backend, React frontend, and integrated with Ghostcut API for high-quality text removal from videos.

## 🚀 Features

- **AI-Powered Text Removal**: Automatically detect and remove text, subtitles, and watermarks from videos
- **Professional Video Editor**: Advanced video editor with precise annotation areas and timeline synchronization
- **Complete Frontend-Backend Integration**: User draws annotation areas → Frontend captures data → Backend processes → GhostCut API integration
- **Region-Specific Processing**: Target specific areas in video instead of full-screen text removal
- **Professional Web Interface**: Clean, responsive Material-UI interface similar to modern SaaS platforms
- **Multi-User Architecture**: User authentication, subscription tiers, and credit-based billing
- **Real-Time Updates**: WebSocket integration for live job progress tracking
- **Chunked File Upload**: Support for large video files with resumable uploads
- **Admin Dashboard**: Comprehensive system monitoring and user management
- **Background Processing**: Celery-based task queue for scalable video processing
- **API Access**: RESTful API with authentication for developers

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  FastAPI Backend │    │ Celery Workers  │
│   (Material-UI) │───▶│   (Auth & API)   │───▶│ (Video Proc.)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                         │
                              ▼                         ▼
                      ┌─────────────────┐    ┌─────────────────┐
                      │   PostgreSQL    │    │   Ghostcut API  │
                      │   (Database)    │    │ (Text Removal)  │
                      └─────────────────┘    └─────────────────┘
                              │
                              ▼
                      ┌─────────────────┐
                      │      Redis      │
                      │  (Cache & MQ)   │
                      └─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM with PostgreSQL
- **Celery**: Distributed task queue
- **Redis**: Caching and message broker
- **WebSocket**: Real-time communication
- **JWT**: Authentication and authorization

### Frontend
- **React 18**: Modern UI framework
- **TypeScript**: Type-safe development
- **Material-UI**: Professional component library
- **React Query**: Data fetching and caching
- **Socket.IO**: Real-time updates

### Infrastructure
- **Docker**: Containerization
- **PostgreSQL**: Primary database
- **Redis**: Cache and message broker
- **Nginx**: Reverse proxy and static file serving

## 🚀 Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Test1-frazo
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000/docs
   - Admin Dashboard: http://localhost/admin
   - Flower (Celery monitoring): http://localhost:5555

## 🔧 Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Database setup
createdb video_text_inpainting
psql video_text_inpainting < ../database/schema.sql

# Start backend
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Worker Setup
```bash
cd backend
celery -A workers.celery_app worker --loglevel=info
```

## 📁 Project Structure

```
Test1-frazo/
├── backend/
│   ├── api/
│   │   ├── routes/         # API endpoints
│   │   ├── websocket.py    # WebSocket handlers
│   │   └── main.py         # FastAPI application
│   ├── auth/               # Authentication & authorization
│   ├── models/             # Database models
│   ├── workers/            # Celery tasks
│   └── config.py           # Configuration
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   └── services/       # API services
│   └── package.json
├── database/
│   └── schema.sql          # Database schema
├── docker-compose.yml      # Docker configuration
├── nginx.conf              # Nginx configuration
└── video_processing.py     # Original processing logic
```

## 🔐 Authentication & Authorization

- **JWT-based authentication** with access and refresh tokens
- **Role-based access control** (User, Admin)
- **Subscription tiers** (Free, Pro, Enterprise)
- **Credit-based billing system**
- **API key management** for developers

## 💳 Subscription Plans

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Credits/month | 100 | 1,000 | 5,000 |
| Max file size | 100MB | 500MB | 2GB |
| Video length | 5 min | 30 min | Unlimited |
| API access | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ |

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Token refresh
- `GET /api/v1/auth/me` - Get current user

### Jobs
- `POST /api/v1/jobs/submit` - Submit video for processing
- `GET /api/v1/jobs/my` - Get user's jobs
- `GET /api/v1/jobs/{job_id}` - Get job details
- `POST /api/v1/jobs/{job_id}/cancel` - Cancel job

### Video Processing (NEW)
- `POST /api/v1/direct/direct-process` - Direct video processing with annotation areas
  - Accepts: FormData with video file and effects JSON
  - Effects format: `[{type, startTime, endTime, region}]`
  - Returns: Immediate GhostCut API processing with job tracking

### Chunked Upload
- `POST /api/v1/chunked-upload/initialize` - Initialize upload
- `POST /api/v1/chunked-upload/chunk/{upload_id}` - Upload chunk
- `POST /api/v1/chunked-upload/finalize/{upload_id}` - Finalize upload

### Admin
- `GET /api/v1/admin/stats` - System statistics
- `GET /api/v1/admin/users` - User management
- `GET /api/v1/admin/jobs` - Job monitoring

## 🔄 Complete Frontend-Backend Integration Workflow

### **User Annotation to API Processing**
1. **User Interaction**: User draws precise annotation areas on video using the professional video editor
2. **Frontend Capture**: React-RND components capture exact coordinates and timing data
3. **Data Structuring**: Frontend formats annotation data with normalized coordinates (0-1 range)
4. **Form Submission**: FormData sent to backend with video file and effects JSON
5. **Backend Processing**: Python backend parses effects and converts to GhostCut API format
6. **Parameter Conversion**: Coordinates converted to coordinate pairs, timing preserved
7. **API Integration**: Processed parameters sent to GhostCut API for video text removal
8. **Result Tracking**: Job status monitored and results delivered to user

### **Technical Data Flow**
```javascript
// Frontend: User annotation data
{
  type: 'erasure' | 'protection' | 'text',
  startTime: 1.15,  // Seconds with precision
  endTime: 6.61,    // Seconds with precision  
  region: { x: 0.2, y: 0.3, width: 0.4, height: 0.2 } // Normalized 0-1
}

// Backend: Converted to GhostCut format
{
  "type": "remove",
  "start": 1.15,
  "end": 6.61, 
  "region": [[0.2, 0.3], [0.6, 0.3], [0.6, 0.5], [0.2, 0.5]] // Coordinate pairs
}
```

### **Original Workflow (Still Supported)**
1. **Upload**: User uploads video via chunked upload or direct upload
2. **Validation**: File type, size, and user credits validation
3. **Queue**: Job added to Celery queue for background processing
4. **Processing**: Integration with existing `video_processing.py` and Ghostcut API
5. **Progress**: Real-time updates via WebSocket
6. **Completion**: Processed video available for download
7. **Cleanup**: Original files cleaned up based on retention policy

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/video_text_inpainting

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256

# External APIs
GHOSTCUT_API_KEY=your-api-key
GHOSTCUT_API_URL=https://api.ghostcut.com

# File Storage
UPLOAD_PATH=/app/uploads
MAX_UPLOAD_SIZE=2147483648  # 2GB

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-password
```

## 📊 Monitoring

- **Health checks** for all services
- **Prometheus metrics** for monitoring
- **Flower dashboard** for Celery monitoring
- **Admin dashboard** for system overview
- **Structured logging** with rotation

## 🔒 Security Features

- **HTTPS enforcement** in production
- **CORS protection** with configurable origins
- **Rate limiting** on API endpoints
- **File type validation** and size limits
- **SQL injection protection** via SQLAlchemy ORM
- **XSS protection** with CSP headers

## 🚀 Deployment

### Production Deployment
1. Configure environment variables in `.env`
2. Set up SSL certificates for HTTPS
3. Configure domain DNS to point to your server
4. Deploy with Docker Compose:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

### Scaling
- **Horizontal scaling**: Add more Celery workers
- **Database scaling**: Configure read replicas
- **Load balancing**: Add multiple backend instances
- **CDN integration**: For static file delivery

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# Integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Contact the development team

---

**Note**: This service integrates with your existing `video_processing.py` workflow while providing a modern, scalable, multi-user interface for customers to access your video text inpainting capabilities.