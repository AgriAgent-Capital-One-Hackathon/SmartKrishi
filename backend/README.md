# SmartKrishi Backend API

A secure FastAPI backend for the SmartKrishi AI-powered farming assistant platform.

## 🚀 Features

- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **PostgreSQL Database**: Robust data storage with SQLAlchemy ORM
- **RESTful API**: Clean API design with automatic documentation
- **Input Validation**: Pydantic schemas for request/response validation
- **CORS Support**: Configured for frontend integration
- **Production Ready**: Environment-based configuration and error handling

## 📋 Prerequisites

- Python 3.12+
- PostgreSQL 15+
- pip or pipenv

## 🛠 Installation

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
