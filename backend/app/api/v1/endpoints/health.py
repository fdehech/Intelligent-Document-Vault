from fastapi import APIRouter, Depends
from app.core.config import settings
from app.core.logger import logger
import httpx
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint for Docker and monitoring systems.
    Returns the status of the application and its dependencies.
    """
    logger.debug("Health check endpoint called")
    
    health_status = {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "services": {}
    }
    
    # Check database
    try:
        from app.core.database import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        health_status["services"]["database"] = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status["services"]["database"] = "unhealthy"
        health_status["status"] = "degraded"
    
    # Check Ollama (optional)
    if settings.OLLAMA_API_URL:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{settings.OLLAMA_API_URL}/api/tags")
                if response.status_code == 200:
                    health_status["services"]["ollama"] = "healthy"
                else:
                    health_status["services"]["ollama"] = "unhealthy"
                    health_status["status"] = "degraded"
        except Exception as e:
            logger.warning(f"Ollama health check failed: {e}")
            health_status["services"]["ollama"] = "unavailable"
    else:
        health_status["services"]["ollama"] = "not_configured"
    
    # Check Mayan EDMS (optional)
    if settings.MAYAN_API_URL and settings.MAYAN_API_TOKEN:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    f"{settings.MAYAN_API_URL}/",
                    headers={"Authorization": f"Token {settings.MAYAN_API_TOKEN}"}
                )
                if response.status_code in [200, 401]:  # 401 means service is up but auth failed
                    health_status["services"]["mayan"] = "healthy"
                else:
                    health_status["services"]["mayan"] = "unhealthy"
                    health_status["status"] = "degraded"
        except Exception as e:
            logger.warning(f"Mayan EDMS health check failed: {e}")
            health_status["services"]["mayan"] = "unavailable"
    else:
        health_status["services"]["mayan"] = "not_configured"
    
    # Check Keycloak
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.KEYCLOAK_URL}/health/ready")
            if response.status_code == 200:
                health_status["services"]["keycloak"] = "healthy"
            else:
                health_status["services"]["keycloak"] = "unhealthy"
                health_status["status"] = "degraded"
    except Exception as e:
        logger.warning(f"Keycloak health check failed: {e}")
        health_status["services"]["keycloak"] = "unavailable"
    
    return health_status


@router.get("/ready")
async def readiness_check():
    """
    Readiness check for Kubernetes/orchestration systems.
    Returns 200 if the service is ready to accept traffic.
    """
    return {"status": "ready"}


@router.get("/live")
async def liveness_check():
    """
    Liveness check for Kubernetes/orchestration systems.
    Returns 200 if the service is alive.
    """
    return {"status": "alive"}
