# AI Utility Service

A FastAPI-based microservice integrated into the Insurance Wellness Hub Nx monorepo.

## Overview

This service is built with FastAPI and managed through Nx workspace tooling. It uses pip for dependency management and runs in an isolated Python virtual environment.

## Prerequisites

- Python 3.11+ installed on your system
- Node.js and npm (for Nx commands)
- `@nxlv/python` plugin installed in the root workspace

## Project Structure

```
ai-utility-service/
├── .venv/                    # Python virtual environment (git-ignored)
├── src/
│   └── main.py              # FastAPI application entry point
├── package.json             # Nx target configurations
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## Setup Instructions

### 1. Initial Setup (Manual)

This service was created manually (not using Nx generators). Here's how it was set up:

#### Step 1: Install @nxlv/python Plugin (Root Level)

From the monorepo root:
```bash
npm install -D @nxlv/python
```

#### Step 2: Create Service Directory Structure

```bash
mkdir -p apps/services/ai-utility-service/src
```

#### Step 3: Create Virtual Environment

```bash
cd apps/services/ai-utility-service
python3 -m venv .venv
```

#### Step 4: Activate Virtual Environment

```bash
source .venv/bin/activate
```

#### Step 5: Create requirements.txt

Created `requirements.txt` with:
```txt
fastapi==0.115.0
uvicorn[standard]==0.32.0
pydantic==2.9.0
pydantic-settings==2.6.0
```

#### Step 6: Install Dependencies

```bash
pip install -r requirements.txt
```

#### Step 7: Create package.json with Nx Targets

Created `package.json` with Nx target configurations for `install`, `serve`, `test`, and `lint`.

#### Step 8: Create FastAPI Application

Created `src/main.py` with basic FastAPI app structure.

### 2. Developer Setup (Clone/New Machine)

If you're setting up this service on a new machine or after cloning:

```bash
# Navigate to service directory
cd apps/services/ai-utility-service

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install dependencies via Nx (from root)
cd ../../../
nx run ai-utility-service:install
```

## Running the Service

### Using Nx Commands (Recommended)

From the monorepo root:

```bash
# Start the development server
nx run ai-utility-service:serve

# Or using the shorter syntax
nx serve ai-utility-service
```

The service will be available at: `http://localhost:8001`

### Manual Run (Alternative)

```bash
cd apps/services/ai-utility-service
source .venv/bin/activate
uvicorn src.main:app --reload --host 0.0.0.0 --port 8001
```

## Available Nx Targets

### `install`
Installs Python dependencies from `requirements.txt` into the virtual environment.

```bash
nx run ai-utility-service:install
```

### `serve`
Starts the FastAPI development server with hot-reload enabled.

```bash
nx run ai-utility-service:serve
```

### `test`
Runs pytest test suite.

```bash
nx run ai-utility-service:test
```

### `lint`
Runs flake8 linter on source code.

```bash
nx run ai-utility-service:lint
```

## API Endpoints

### Health Check
```
GET /health
```
Returns service health status.

**Response:**
```json
{
  "status": "I Am AI Utility Service Healthy!"
}
```

### Root
```
GET /
```
Welcome endpoint.

**Response:**
```json
{
  "message": "Welcome to My FastAPI Service"
}
```

### API Documentation

FastAPI provides automatic interactive API documentation:

- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

## Development Workflow

### Adding New Dependencies

1. Activate virtual environment:
   ```bash
   cd apps/services/ai-utility-service
   source .venv/bin/activate
   ```

2. Add package to `requirements.txt`:
   ```txt
   new-package==1.0.0
   ```

3. Install dependencies:
   ```bash
   nx run ai-utility-service:install
   ```

### Project Structure Best Practices

Organize code as your service grows:

```
src/
├── main.py              # FastAPI app initialization
├── api/
│   ├── __init__.py
│   ├── routes/         # API route handlers
│   └── dependencies.py # Dependency injection
├── core/
│   ├── __init__.py
│   ├── config.py       # Configuration management
│   └── logging.py      # Logging setup
├── models/
│   ├── __init__.py
│   └── schemas.py      # Pydantic models
└── services/
    ├── __init__.py
    └── business_logic.py
```

## Environment Variables

Create a `.env` file in the service root (git-ignored):

```bash
SERVICE_VERSION=0.1.0
PORT=8001
ENV=dev
LOG_LEVEL=INFO
```

Use `pydantic-settings` to load configuration:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    service_version: str = "0.1.0"
    port: int = 8001
    env: str = "dev"
    
    class Config:
        env_file = ".env"
```

## Integration with Nx Monorepo

### Task Dependencies

This service can be added to compound tasks. Example in root `.vscode/tasks.json`:

```json
{
  "label": "Serve: ai-utility-service",
  "type": "shell",
  "command": "nx serve ai-utility-service",
  "group": "none"
}
```

### Integration with Other Services

This FastAPI service can communicate with NestJS services:

- Uses HTTP/REST for service-to-service communication
- Can be registered with `service-registry` if needed
- Runs on separate port (8001) from other services

## Troubleshooting

### Issue: `pip: command not found`

**Solution:** Use `python3 -m pip` or ensure virtual environment is activated.

### Issue: Virtual environment not activating

**Solution:**
```bash
# Recreate virtual environment
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
```

### Issue: Module not found errors

**Solution:** Ensure dependencies are installed:
```bash
nx run ai-utility-service:install
```

### Issue: Port already in use

**Solution:** Change port in `package.json` serve target or kill the process using port 8001:
```bash
lsof -ti:8001 | xargs kill -9
```

## Testing

### Writing Tests

Create tests in the `tests/` directory:

```python
# tests/test_main.py
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "I Am AI Utility Service Healthy!"
```

### Running Tests

```bash
# Via Nx
nx run ai-utility-service:test

# Or manually
cd apps/services/ai-utility-service
source .venv/bin/activate
pytest
```

## Technology Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **Uvicorn**: ASGI server for running FastAPI
- **Pydantic**: Data validation using Python type annotations
- **Pytest**: Testing framework (for future tests)
- **Nx**: Monorepo tooling and task orchestration
- **@nxlv/python**: Nx plugin for Python project support

## Configuration Details

### Dependency Manager: pip + requirements.txt

This service uses the traditional pip + requirements.txt approach rather than Poetry:

**Pros:**
- Simple and familiar
- Standard Python tooling
- Easy to understand
- No additional tool installation

**Cons:**
- Manual virtual environment management
- Less sophisticated dependency resolution
- No automatic lock file

### Why @nxlv/python Plugin?

The plugin provides:
- Nx task orchestration for Python projects
- Consistent command interface with TypeScript/NestJS services
- Integration with Nx dependency graph
- Standardized project structure

## Contributing

1. Follow existing code structure
2. Add tests for new features
3. Update this README for significant changes
4. Use conventional commits for version control

## License

MIT
