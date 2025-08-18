# SmartKrishi Backend API

A secure FastAPI backend for the SmartKrishi AI-powered agricultural assistant platform with real-time chat, file processing, and advanced AI reasoning capabilities.

## 🚀 Features

- **Real-time AI Chat**: Streaming responses with Google Gemini integration
- **Secure Authentication**: JWT + Firebase Phone Auth with multi-factor security
- **PostgreSQL Database**: Robust data persistence with SQLAlchemy ORM and Alembic migrations
- **File Processing**: Multi-format file upload and analysis (images, documents, PDFs)
- **Agent Integration**: Advanced AI reasoning with step-by-step explanations
- **SMS Fallback**: WhatsApp/SMS integration for offline accessibility
- **RESTful API**: OpenAPI documentation with automatic schema validation
- **Production Ready**: Docker support, error handling, rate limiting, and monitoring

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Frontend]
        MOB[Mobile App]
        SMS[SMS/WhatsApp]
    end
    
    subgraph "API Gateway"
        NGINX[Nginx/Load Balancer]
    end
    
    subgraph "Application Layer"
        API[FastAPI Server]
        AUTH[Auth Service]
        CHAT[Chat Service]
        FILE[File Service]
        REASON[Reasoning Service]
    end
    
    subgraph "AI Services"
        GEMINI[Google Gemini API]
        AGENT[Agent API]
        FIREBASE[Firebase Auth]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        REDIS[(Redis Cache)]
        STORAGE[File Storage]
    end
    
    WEB --> NGINX
    MOB --> NGINX
    SMS --> NGINX
    
    NGINX --> API
    
    API --> AUTH
    API --> CHAT
    API --> FILE
    API --> REASON
    
    AUTH --> FIREBASE
    CHAT --> GEMINI
    REASON --> AGENT
    
    API --> DB
    API --> REDIS
    FILE --> STORAGE
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── deps.py                 # Dependency injection
│   │
│   ├── ai/                     # AI service integrations
│   │   ├── gemini_service.py   # Google Gemini AI service
│   │   └── chat_service.py     # AI chat orchestration
│   │
│   ├── core/                   # Core configuration
│   │   ├── config.py           # Settings and environment
│   │   ├── security.py         # Authentication & encryption
│   │   └── database.py         # Database connection
│   │
│   ├── db/                     # Database layer
│   │   ├── base.py            # Base model classes
│   │   └── session.py         # Database session management
│   │
│   ├── models/                 # SQLAlchemy models
│   │   ├── user.py            # User model
│   │   ├── chat.py            # Chat & message models
│   │   ├── file.py            # File upload models
│   │   └── reasoning.py       # AI reasoning step models
│   │
│   ├── routers/                # API route handlers
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── chat.py            # Chat & messaging endpoints
│   │   ├── fallback.py        # SMS/WhatsApp fallback
│   │   └── admin.py           # Admin panel endpoints
│   │
│   ├── schemas/                # Pydantic schemas
│   │   ├── user.py            # User request/response schemas
│   │   ├── chat.py            # Chat message schemas
│   │   └── file.py            # File upload schemas
│   │
│   ├── services/               # Business logic services
│   │   ├── chat_service.py    # Chat management
│   │   ├── file_service.py    # File processing
│   │   ├── firebase_service.py # Firebase integration
│   │   ├── sms_service.py     # SMS/WhatsApp service
│   │   └── reasoning_service.py # AI reasoning logic
│   │
│   └── utils/                  # Utility functions
│       ├── security.py         # Security helpers
│       └── validators.py       # Input validation
│
├── alembic/                    # Database migrations
├── tests/                      # Test suite
├── requirements.txt            # Python dependencies
├── docker-compose.yml          # Docker configuration
├── alembic.ini                # Database migration config
└── README.md                  # This file
```

## 🛠️ Tech Stack

- **Framework**: FastAPI 0.115+ with Python 3.12+
- **Database**: PostgreSQL 15+ with SQLAlchemy 2.0+
- **Authentication**: JWT + Firebase Auth + Phone verification
- **AI Services**: Google Gemini Pro, Agent API integration
- **File Storage**: Local filesystem or cloud storage
- **Caching**: Redis (optional)
- **Deployment**: Gunicorn, Docker, Render/Railway

## 📋 Prerequisites

- **Python**: 3.12 or higher
- **PostgreSQL**: 15+ running locally or cloud instance
- **Firebase**: Project with phone authentication enabled
- **Google AI**: Gemini API key

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd SmartKrishi/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT signing key (generate with `openssl rand -hex 32`)
- `GEMINI_API_KEY`: Google AI Studio API key
- `FIREBASE_CREDENTIALS`: Path to Firebase service account JSON

### 3. Database Setup

```bash
# Run database migrations
alembic upgrade head

# Optional: Create sample data
python -c "from app.db.init_db import init_db; init_db()"
```

### 4. Run Development Server

```bash
# Start FastAPI development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v

# Run integration tests
pytest tests/test_integrated/ -v
```

## 📚 API Documentation

The API provides the following main endpoints:

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/firebase-login` - Firebase phone authentication
- `POST /api/v1/auth/refresh` - Token refresh

### Chat Management
- `GET /api/v1/chat/chats` - List user chats
- `POST /api/v1/chat/chats` - Create new chat
- `GET /api/v1/chat/chats/{chat_id}` - Get chat details
- `POST /api/v1/chat/send-stream` - Send message with streaming response
- `DELETE /api/v1/chat/chats/{chat_id}` - Delete chat

### File Operations
- `POST /api/v1/chat/upload` - Upload files for analysis
- `GET /api/v1/chat/files/{file_id}` - Download file
- `DELETE /api/v1/chat/files/{file_id}` - Delete file

### Fallback Services
- `POST /api/v1/fallback/sms-webhook` - SMS message webhook
- `GET /api/v1/fallback/health` - Service health check

Full interactive documentation is available at `/docs` when running the server.

## 🚀 Deployment

### Production Environment Setup

1. **Database Migration**:
```bash
alembic upgrade head
```

2. **Environment Variables**:
```bash
export ENVIRONMENT=production
export DATABASE_URL=postgresql://user:pass@host:5432/db
export SECRET_KEY=your-production-secret-key
```

3. **Production Server**:
```bash
# Using Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Using Docker
docker build -t smartkrishi-backend .
docker run -p 8000:8000 --env-file .env smartkrishi-backend
```

### Docker Deployment

```bash
# Build image
docker build -t smartkrishi-backend .

# Run with docker-compose
docker-compose up -d

# Scale workers
docker-compose up -d --scale backend=3
```

### Cloud Deployment

The application is configured for deployment on:
- **Render**: Auto-deploy from GitHub
- **Railway**: One-click deployment  
- **Google Cloud Run**: Containerized deployment
- **AWS ECS**: Production-scale deployment

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Firebase Integration**: Phone number verification
- **Password Security**: bcrypt hashing with salt rounds
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Pydantic schema validation
- **SQL Injection Prevention**: SQLAlchemy ORM protection
- **CORS Configuration**: Cross-origin request handling

## 🔍 Monitoring & Logging

- **Health Checks**: `/health` endpoint for service monitoring
- **Request Logging**: Structured logging with correlation IDs
- **Error Tracking**: Automatic error capture and reporting
- **Performance Metrics**: Response time and throughput monitoring

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`pytest`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation at `/docs`
- Review the troubleshooting guide below

## 🔧 Troubleshooting

### Common Issues

**Database Connection Error**:
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify connection string
psql $DATABASE_URL
```

**Firebase Authentication Error**:
- Verify Firebase project configuration
- Check service account key permissions
- Ensure phone authentication is enabled

**Import Errors**:
```bash
# Reinstall dependencies
pip install --force-reinstall -r requirements.txt

# Check Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SmartKrishi/backend
   ```

2. **Set up virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up PostgreSQL**
   
   Using Homebrew (macOS):
   ```bash
   brew install postgresql@15
   brew services start postgresql@15
   ```
   
   Create database and user:
   ```bash
   createdb smartkrishi_db
   psql smartkrishi_db -c "CREATE USER smartkrishi_user WITH PASSWORD 'smartkrishi_password';"
   psql smartkrishi_db -c "GRANT ALL PRIVILEGES ON DATABASE smartkrishi_db TO smartkrishi_user;"
   psql smartkrishi_db -c "GRANT CREATE ON SCHEMA public TO smartkrishi_user;"
   psql smartkrishi_db -c "GRANT USAGE ON SCHEMA public TO smartkrishi_user;"
   ```

5. **Configure environment variables**
   
   Copy `.env` file and update as needed:
   ```bash
   cp .env.example .env  # Update DATABASE_URL and SECRET_KEY
   ```

## 🚦 Running the Application

1. **Start the development server**
   ```bash
   source venv/bin/activate
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Access the API**
   - API Base URL: `http://localhost:8000`
   - Interactive Docs: `http://localhost:8000/docs`
   - ReDoc Documentation: `http://localhost:8000/redoc`

## 📚 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/signup` | Register new user | ❌ |
| POST | `/api/v1/auth/login` | User login | ❌ |
| GET | `/api/v1/auth/me` | Get current user info | ✅ |

### Other Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API root information |
| GET | `/health` | Health check |

## 🧪 Testing

Run the comprehensive test suite:

```bash
python test_api.py
```

This will test:
- User registration
- User login  
- Protected route access
- Invalid token handling
- Duplicate email validation

## 📁 Project Structure

```
backend/
├── app/
│   ├── core/
│   │   └── security.py          # JWT & password hashing
│   ├── db/
│   │   └── database.py          # Database configuration
│   ├── models/
│   │   └── user.py              # SQLAlchemy models
│   ├── routers/
│   │   └── auth.py              # Authentication routes
│   ├── schemas/
│   │   └── user.py              # Pydantic schemas
│   ├── deps.py                  # Dependencies
│   └── main.py                  # FastAPI application
├── alembic/                     # Database migrations
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables
├── docker-compose.yml           # PostgreSQL container
└── test_api.py                  # API test suite
```

## 🔐 Authentication Flow

### Signup
```bash
POST /api/v1/auth/signup
{
  "name": "Farmer Name",
  "email": "farmer@example.com", 
  "password": "securepassword"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### Login
```bash
POST /api/v1/auth/login
{
  "email": "farmer@example.com",
  "password": "securepassword" 
}
```

### Accessing Protected Routes
```bash
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

## 🐳 Docker Support

Start PostgreSQL with Docker:
```bash
docker-compose up -d db
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SECRET_KEY` | JWT signing key | Required |
| `ALGORITHM` | JWT algorithm | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry time | 60 |
| `API_V1_STR` | API version prefix | /api/v1 |

## 🛡 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: Pydantic schema validation
- **SQL Injection Prevention**: SQLAlchemy ORM
- **CORS Configuration**: Controlled frontend access
- **Environment Variables**: Secure configuration management

## 📈 Future Enhancements

- Database migrations with Alembic
- Rate limiting
- Refresh token implementation
- Email verification
- Role-based access control
- API versioning
- Comprehensive logging
- Health check endpoints
- Monitoring integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌱 About SmartKrishi

SmartKrishi is an AI-powered farming assistant designed to help Indian farmers make informed decisions about crop management, weather planning, and market insights.
