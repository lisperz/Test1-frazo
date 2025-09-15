# Technical Code Documentation - Frontend & Backend Breakdown

## 🎯 Overview

This document provides a comprehensive breakdown of all major files and their functions in both frontend and backend components of the Video Text Inpainting Platform. Use this as a reference to answer any technical questions about the codebase.

---

## 🌐 FRONTEND ARCHITECTURE (React 19 + TypeScript)

### **📁 Project Structure**
```
frontend/src/
├── components/           # Reusable UI components
├── pages/               # Main application pages
├── contexts/            # React contexts for global state
├── hooks/               # Custom React hooks
├── services/            # API communication layer
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

---

## 📄 FRONTEND FILES BREAKDOWN

### **🏠 Main Pages (`/pages/`)**

#### **1. `UploadPage.tsx` - Video Upload Interface**
**Purpose**: Main landing page for video uploads with drag-and-drop functionality
**Key Features**:
- Drag & drop video upload zone with file validation
- Multiple file selection and batch processing
- Real-time file size and format validation
- Credit balance display and usage estimation
- Professional gradient-based UI design

**Core Functions**:
```typescript
// File upload handling
const onDrop = useCallback((acceptedFiles: File[]) => {
  // Validates file types (MP4, AVI, MOV, MKV, WebM)
  // Sets display names and prepares for processing
});

// Process all selected files
const processAllFiles = async () => {
  // Creates FormData for each file
  // Calls backend API for video processing
  // Handles upload progress and error states
};
```

**Business Logic**:
- File size limit: 2GB per file
- Supported formats: MP4, AVI, MOV, MKV, WebM
- Credit estimation: ~10 credits per minute of video
- Batch processing capability for multiple videos

---

#### **2. `VideoEditorPage.tsx` - Professional Video Editor**
**Purpose**: Advanced video editing interface with annotation capabilities
**Key Features**:
- Professional video player with timeline controls
- Annotation drawing system for text removal areas
- Real-time preview and effect management
- Frame-accurate timeline navigation

**Core Functions**:
```typescript
// Video editor initialization
const initializeEditor = () => {
  // Sets up video player with custom controls
  // Initializes annotation system
  // Configures timeline synchronization
};

// Annotation management
const handleAnnotationAdd = (annotation) => {
  // Validates annotation coordinates (0-1 normalized)
  // Adds to effects array with timing information
  // Updates UI with new annotation
};
```

---

#### **3. `JobsPage.tsx` - Job History & Management**
**Purpose**: User dashboard for viewing and managing video processing jobs
**Key Features**:
- Real-time job status updates via WebSocket
- Download links for completed videos
- Job filtering and search functionality
- Progress tracking and error handling

**Core Functions**:
```typescript
// Fetch user jobs with authentication
const { data: jobs } = useQuery(['jobs'], () => 
  jobsApi.getUserJobs(page, pageSize, statusFilter)
);

// Real-time status updates
useEffect(() => {
  // WebSocket connection for live updates
  // Automatic progress refresh
}, []);
```

---

#### **4. `LoginPage.tsx` - User Authentication**
**Purpose**: Secure user login with JWT token management
**Key Features**:
- Email/password authentication
- JWT token storage and refresh
- Redirect to dashboard after login
- Error handling for invalid credentials

---

### **🧩 Core Components (`/components/`)**

#### **1. `VideoEditor/GhostCutVideoEditor.tsx` - Main Editor Component**
**Purpose**: The heart of the video editing system
**Key Features**:
- Professional video player integration (ReactPlayer)
- Annotation drawing system using React-RND
- Timeline synchronization with frame precision
- Effect management (Erasure, Protection, Text areas)

**Critical Functions**:
```typescript
// Timeline synchronization
const calculateProgressPercentage = (time: number, duration: number) => {
  return Math.min(100, Math.max(0, (time / duration) * 100));
};

// Annotation coordinate conversion
const convertToNormalizedCoords = (pixelCoords, containerSize) => {
  // Converts pixel coordinates to 0-1 normalized values
  // Ensures precision for API submission
};

// Effect submission to backend
const handleSubmit = async () => {
  // Prepares FormData with video and effects
  // Converts frontend annotations to GhostCut API format
  // Submits to /api/v1/direct-process endpoint
};
```

**Annotation Types**:
- **Erasure Areas**: Blue (#5B8FF9) - Text removal regions
- **Protection Areas**: Green (#5AD8A6) - Areas to preserve
- **Erase Text**: Gray (#5D7092) - Specific text targeting

---

#### **2. `Layout/Sidebar.tsx` - Navigation System**
**Purpose**: Main navigation and user interface layout
**Features**: Menu items, user profile, credits display, logout functionality

#### **3. `Upload/FileUploadZone.tsx` - Upload Component**
**Purpose**: Reusable file upload component with validation
**Features**: Drag-drop, progress tracking, error handling

---

### **🔧 Services & API (`/services/`)**

#### **1. `api.ts` - Backend Communication Layer**
**Purpose**: Centralized API communication with authentication
**Key Functions**:
```typescript
// Authentication
export const authApi = {
  login: (credentials) => axios.post('/api/v1/auth/login', credentials),
  refreshToken: () => axios.post('/api/v1/auth/refresh'),
  getCurrentUser: () => axios.get('/api/v1/auth/me')
};

// Job management
export const jobsApi = {
  uploadAndProcess: (file, displayName) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('display_name', displayName);
    return axios.post('/api/v1/jobs/submit', formData);
  },
  
  getUserJobs: (page, pageSize, status) => 
    axios.get('/api/v1/jobs/', { params: { page, page_size: pageSize, status_filter: status } }),
  
  directProcess: (file, effects) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('effects', JSON.stringify(effects));
    return axios.post('/api/v1/direct/direct-process', formData);
  }
};
```

---

### **🎯 Contexts (`/contexts/`)**

#### **1. `AuthContext.tsx` - Authentication State Management**
**Purpose**: Global user authentication state
**Features**: JWT token management, user profile, login/logout

#### **2. `WebSocketContext.tsx` - Real-time Updates**
**Purpose**: WebSocket connection for live job status updates
**Features**: Connection management, message handling, reconnection logic

---

## 🖥️ BACKEND ARCHITECTURE (FastAPI + Python)

### **📁 Project Structure**
```
backend/
├── api/
│   ├── routes/          # API endpoint definitions
│   ├── main.py         # FastAPI application setup
│   └── websocket.py    # WebSocket handlers
├── auth/               # Authentication & authorization
├── models/             # Database models (SQLAlchemy)
├── services/           # External service integrations
├── workers/            # Background task processing
└── config.py           # Configuration management
```

---

## 📄 BACKEND FILES BREAKDOWN

### **🚀 Main Application (`/api/`)**

#### **1. `main.py` - FastAPI Application Entry Point**
**Purpose**: Application initialization and configuration
**Key Components**:
```python
# FastAPI app initialization
app = FastAPI(
    title="Video Text Inpainting API",
    description="AI-powered video text removal service",
    version="1.0.0"
)

# CORS configuration for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Route registration
app.include_router(auth_router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(jobs_router, prefix="/api/v1/jobs", tags=["jobs"])
app.include_router(direct_router, prefix="/api/v1/direct", tags=["direct-processing"])
```

**Health Check & Monitoring**:
- `/health` endpoint for system status
- Request/response logging middleware
- Error handling and exception management

---

### **🛡️ Authentication System (`/auth/`)**

#### **1. `dependencies.py` - JWT Authentication**
**Purpose**: Secure user authentication and authorization
**Key Functions**:
```python
# JWT token validation
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_database)):
    """
    Validates JWT token and returns authenticated user
    Used by all protected endpoints for security
    """
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        email: str = payload.get("sub")
        # Fetch user from database and validate
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Password hashing and verification
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
```

---

### **🎬 Video Processing (`/api/routes/`)**

#### **1. `direct_process.py` - Immediate Video Processing**
**Purpose**: Real-time video processing without queue delays
**Key Features**:
- Direct GhostCut API integration
- Parameter conversion from frontend to AI API format
- User authentication and isolation
- Real-time progress updates

**Critical Functions**:
```python
@router.post("/direct-process", response_model=DirectProcessResponse)
async def direct_process_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    display_name: Optional[str] = Form(None),
    effects: Optional[str] = Form(None),  # JSON string from frontend
    current_user: User = Depends(get_current_user),  # JWT authentication
    db: Session = Depends(get_database)
):
    """
    Process video immediately without Celery queue
    Converts frontend effects to GhostCut API format
    """
    
    # Parse frontend effects data
    effects_data = json.loads(effects) if effects else []
    
    # Convert to GhostCut API format
    video_inpaint_masks = []
    for effect in effects_data:
        # Handle coordinate conversion (pixel to normalized)
        region = effect.get('region', {})
        x1, y1 = region['x'], region['y']
        x2, y2 = region['x'] + region['width'], region['y'] + region['height']
        
        # Ensure coordinates are in valid range [0, 1]
        x1 = max(0.0, min(1.0, x1))
        y1 = max(0.0, min(1.0, y1))
        x2 = max(0.0, min(1.0, x2))
        y2 = max(0.0, min(1.0, y2))
        
        # Create GhostCut API format
        mask_entry = {
            "type": "remove" if effect['type'] in ['erasure', 'text'] else "keep",
            "start": round(effect.get('startTime', 0), 2),
            "end": round(effect.get('endTime', 99999), 2),
            "region": [
                [round(x1, 2), round(y1, 2)],  # Top-left
                [round(x2, 2), round(y1, 2)],  # Top-right
                [round(x2, 2), round(y2, 2)],  # Bottom-right
                [round(x1, 2), round(y2, 2)]   # Bottom-left
            ]
        }
        video_inpaint_masks.append(mask_entry)
    
    # Call GhostCut API with converted parameters
    ghostcut_task_id = await call_ghostcut_api_async(video_url, job_id, effects_data)
    
    return DirectProcessResponse(
        job_id=str(job_id),
        filename=file.filename,
        message="Video sent to GhostCut API immediately! Processing started.",
        status="processing",
        ghostcut_task_id=ghostcut_task_id
    )
```

**GhostCut API Integration**:
```python
async def call_ghostcut_api_async(video_url: str, job_id: str, effects_data: List) -> str:
    """
    Direct GhostCut API integration with proper parameter conversion
    """
    
    # API endpoint configuration
    url = f"{settings.ghostcut_api_url}/v-w-c/gateway/ve/work/free"
    
    request_data = {
        "urls": [video_url],
        "uid": settings.ghostcut_uid,
        "workName": f"Processed_video_{job_id[:8]}",
        "resolution": "1080p",
        "videoInpaintLang": "all",
        "videoInpaintMasks": json.dumps(video_inpaint_masks),
        "needChineseOcclude": 2 if has_remove_masks else 1
    }
    
    # Authentication signature calculation
    body = json.dumps(request_data)
    md5_hash = hashlib.md5(body.encode('utf-8')).hexdigest()
    sign = hashlib.md5((md5_hash + settings.ghostcut_app_secret).encode('utf-8')).hexdigest()
    
    headers = {
        'Content-type': 'application/json',
        'AppKey': settings.ghostcut_api_key,
        'AppSign': sign,
    }
    
    # API call with error handling
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=request_data, headers=headers, timeout=30) as response:
            result = await response.json()
            return result.get("body", {}).get("idProject")
```

---

#### **2. `jobs.py` - Job Management System**
**Purpose**: Complete job lifecycle management with user isolation
**Key Features**:
- User-specific job listing (authentication-based filtering)
- Job status tracking and updates
- File upload and processing coordination
- Download link generation

**User Isolation Implementation**:
```python
@router.get("/", response_model=JobListResponse)
async def get_user_jobs(
    page: int = 1,
    page_size: int = 20,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),  # JWT authentication
    db: Session = Depends(get_database)
):
    """
    Get user's video processing jobs with proper isolation
    Each user only sees their own jobs
    """
    # Build query with user filtering
    query = db.query(VideoJob).filter(VideoJob.user_id == current_user.id)
    
    if status_filter:
        query = query.filter(VideoJob.status == status_filter)
    
    # Pagination and results
    total = query.count()
    jobs = query.order_by(VideoJob.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return JobListResponse(jobs=job_responses, total=total, page=page, page_size=page_size)
```

---

#### **3. `auth.py` - Authentication Endpoints**
**Purpose**: User login, registration, and token management
**Key Endpoints**:
- `POST /login` - User authentication with JWT token generation
- `POST /refresh` - Token refresh for session management
- `GET /me` - Current user profile information

---

### **🗄️ Database Models (`/models/`)**

#### **1. `user.py` - User Management**
**Purpose**: User account and authentication data
**Key Fields**:
```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)  # bcrypt hashed
    first_name = Column(String)
    last_name = Column(String)
    company = Column(String)
    credits_balance = Column(Integer, default=100)
    subscription_tier_id = Column(Integer, default=1)
    email_verified = Column(Boolean, default=False)
    status = Column(String, default='active')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

---

#### **2. `job.py` - Video Processing Jobs**
**Purpose**: Track video processing job lifecycle
**Key Fields**:
```python
class VideoJob(Base):
    __tablename__ = "video_jobs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    original_filename = Column(String, nullable=False)
    display_name = Column(String)
    status = Column(Enum(JobStatus), default=JobStatus.QUEUED)
    progress_percentage = Column(Integer, default=0)
    progress_message = Column(String)
    processing_config = Column(JSON)  # Stores effects data and parameters
    estimated_credits = Column(Integer)
    actual_credits_used = Column(Integer)
    output_url = Column(String)  # Download link for processed video
    zhaoli_task_id = Column(String)  # GhostCut API task ID
    error_message = Column(String)
    queued_at = Column(DateTime)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

---

#### **3. `file.py` - File Management**
**Purpose**: Track uploaded and processed video files
**Features**: File metadata, storage paths, download URLs

---

### **🔧 Services (`/services/`)**

#### **1. `s3_service.py` - AWS S3 Integration**
**Purpose**: Cloud file storage and retrieval
**Key Functions**:
```python
class S3Service:
    def upload_video_and_get_url(self, file_path: str, s3_key: str) -> str:
        """
        Upload video to S3 and return public URL
        Used for GhostCut API video processing
        """
        
    def generate_presigned_download_url(self, s3_key: str) -> str:
        """
        Generate secure download URL for processed videos
        """
```

---

#### **2. `ghostcut_client.py` - AI API Integration**
**Purpose**: Direct communication with GhostCut AI services
**Features**: Video submission, status checking, result retrieval

---

### **⚙️ Configuration (`config.py`)**
**Purpose**: Environment-based configuration management
**Key Settings**:
```python
class Settings:
    # Database
    database_url: str = "postgresql://vti_user:password@localhost:5432/video_text_inpainting"
    
    # JWT Authentication
    jwt_secret_key: str = "your-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7
    
    # GhostCut API
    ghostcut_api_key: str = "your-api-key"
    ghostcut_api_url: str = "https://api.ghostcut.com"
    ghostcut_app_secret: str = "your-app-secret"
    ghostcut_uid: str = "your-uid"
    
    # File Storage
    upload_path: str = "/app/uploads"
    max_upload_size_mb: int = 2048  # 2GB
    
    # AWS S3
    aws_access_key_id: str = "your-aws-key"
    aws_secret_access_key: str = "your-aws-secret"
    aws_s3_bucket: str = "video-processing-bucket"
```

---

## 🔄 DATA FLOW SUMMARY

### **Frontend to Backend Communication**
1. **User uploads video** → `UploadPage.tsx` → `directProcess()` API call
2. **Effect annotations** → `GhostCutVideoEditor.tsx` → JSON effects data
3. **FormData submission** → `services/api.ts` → `/api/v1/direct-process`

### **Backend Processing Pipeline**
1. **Authentication** → `auth/dependencies.py` → JWT validation
2. **Parameter conversion** → `direct_process.py` → GhostCut API format
3. **File storage** → `s3_service.py` → AWS S3 upload
4. **AI processing** → `ghostcut_client.py` → External AI API
5. **Job tracking** → `models/job.py` → Database persistence

### **Real-time Updates**
1. **WebSocket connection** → `websocket.py` → Live status updates
2. **Job monitoring** → Background tasks → Progress tracking
3. **Frontend updates** → `WebSocketContext.tsx` → UI refresh

---

## 🎯 KEY TECHNICAL CONCEPTS TO REMEMBER

### **Authentication & Security**
- **JWT-based authentication** with access and refresh tokens
- **User isolation** - each user only sees their own data
- **bcrypt password hashing** for secure credential storage
- **API rate limiting** and CORS protection

### **Video Processing Workflow**
- **Immediate processing** - no queue delays, direct API integration
- **Parameter conversion** - frontend coordinates to AI API format
- **Real-time monitoring** - WebSocket updates for job progress
- **Cloud storage** - S3 integration for scalable file management

### **Frontend Architecture**
- **React 19** with TypeScript for type safety
- **Material-UI** for professional component library
- **React Query** for server state management
- **WebSocket** for real-time updates

### **Backend Architecture**
- **FastAPI** for high-performance async API
- **SQLAlchemy ORM** with PostgreSQL database
- **Docker containerization** for deployment
- **Microservices-ready** architecture with service separation

This documentation should give you the confidence to answer any technical questions about the codebase structure, functionality, and implementation details!