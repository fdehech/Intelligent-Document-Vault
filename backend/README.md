# Secure Document Vault - Backend API

## Overview

FastAPI-based backend service for the Secure Document Vault system, providing:
- Document management via Mayan EDMS integration
- AI-powered document analysis via Ollama
- SSO authentication via Keycloak
- RESTful API for frontend consumption

## Architecture

### Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── api.py              # API router aggregation
│   │       └── endpoints/
│   │           ├── health.py       # Health check endpoints
│   │           ├── documents.py    # Document management
│   │           └── chat.py         # AI chat interface
│   ├── core/
│   │   ├── config.py              # Configuration management
│   │   ├── database.py            # Database setup
│   │   └── logger.py              # Logging configuration
│   ├── models/                    # SQLAlchemy models
│   ├── schemas/                   # Pydantic schemas
│   └── services/
│       ├── keycloak.py           # Keycloak SSO integration
│       ├── mayan.py              # Mayan EDMS integration
│       └── ollama.py             # Ollama AI integration
├── alembic/                      # Database migrations
├── main.py                       # Application entry point
├── config.py                     # Legacy config (can be removed)
├── database.py                   # Legacy database (can be removed)
├── Dockerfile                    # Container definition
└── requirements.txt              # Python dependencies
```

## Services Integration

### Keycloak SSO (`services/keycloak.py`)

Handles authentication and authorization:
- Token verification
- Authorization code exchange
- Token refresh
- User logout
- Role extraction

### Mayan EDMS (`services/mayan.py`)

Document management system integration:
- Document upload
- OCR processing
- Metadata management
- Full-text search
- Document retrieval

### Ollama AI (`services/ollama.py`)

Local AI model integration:
- Document analysis
- Content summarization
- Question answering
- Information extraction

## API Endpoints

### Health Checks

- `GET /health` - Comprehensive health check with service status
- `GET /ready` - Readiness probe for orchestration
- `GET /live` - Liveness probe for orchestration

### API v1 (`/api/v1`)

- `/documents` - Document management endpoints
- `/chat` - AI chat interface endpoints

## Configuration

All configuration is managed via environment variables (see `.env.example`):

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:changeme@postgres:5432/backend

# Redis
REDIS_URL=redis://:changeme@redis:6379/3

# Security
SECRET_KEY=your-secret-key

# Keycloak
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=documentvault
KEYCLOAK_CLIENT_ID=backend-api
KEYCLOAK_CLIENT_SECRET=your-client-secret

# Mayan EDMS
MAYAN_API_URL=http://mayan-edms:8000/api
MAYAN_API_TOKEN=your-mayan-token

# Ollama
OLLAMA_API_URL=http://ollama:11434
OLLAMA_DEFAULT_MODEL=llama3.1
```

## Development

### Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Run with hot reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Running in Docker

```bash
# Build and start all services
docker-compose up --build

# View logs
docker-compose logs -f backend
```

### API Documentation

Once running, access interactive API docs:
- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

## Database Migrations

Using Alembic for database schema management:

```bash
# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Testing

### Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "app": "Secure Document Vault API",
  "version": "1.0.0",
  "environment": "development",
  "services": {
    "database": "healthy",
    "ollama": "healthy",
    "mayan": "healthy",
    "keycloak": "healthy"
  }
}
```

## Security

### CORS Configuration

CORS is configured to allow requests from:
- `http://localhost:3000` (Frontend)
- `http://localhost:8000` (Backend)
- `http://localhost` (General)

### Authentication Flow

1. User authenticates via Keycloak (frontend)
2. Frontend receives access token
3. Frontend sends token in Authorization header
4. Backend verifies token with Keycloak
5. Backend extracts user info and roles
6. Backend authorizes request based on roles

## Service Communication

### Internal Network

Services communicate via Docker DNS:
- `postgres:5432` - PostgreSQL database
- `redis:6379` - Redis cache
- `keycloak:8080` - Keycloak SSO
- `mayan-edms:8000` - Mayan EDMS
- `ollama:11434` - Ollama AI

### External Access

Backend is exposed on port 8000:
- `http://localhost:8000` - API access
- `http://localhost:8000/api/v1/docs` - API documentation

## Logging

Logging is configured via `LOG_LEVEL` environment variable:
- `DEBUG` - Detailed debugging information
- `INFO` - General informational messages (default)
- `WARNING` - Warning messages
- `ERROR` - Error messages
- `CRITICAL` - Critical errors

## Next Steps

1. ✅ Basic structure created
2. ✅ Health checks implemented
3. ✅ Keycloak service created
4. ✅ Configuration updated
5. 🔄 Implement authentication middleware
6. 🔄 Add document upload endpoints
7. 🔄 Implement AI analysis endpoints
8. 🔄 Add user management
9. 🔄 Implement role-based access control
10. 🔄 Add comprehensive error handling
11. 🔄 Write unit tests
12. 🔄 Add integration tests

## Cleanup Notes

The following files can be removed as they're duplicates:
- `config.py` (root level) - Use `app/core/config.py` instead
- `database.py` (root level) - Use `app/core/database.py` instead
