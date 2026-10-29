import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import engine, Base
from app.routers import auth, clients, projects, proposals, invoices, documents, comments, dashboard

# Create database tables
Base.metadata.create_all(bind=engine)

# Ensure upload directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="Open Client Portal API",
    description="Complete self-hosted client portal and CRM engine for agencies and freelancers",
    version="1.0.0"
)

# CORS setup
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")] if settings.CORS_ORIGINS != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads static folder
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
api_v1_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(clients.router, prefix=api_v1_prefix)
app.include_router(projects.router, prefix=api_v1_prefix)
app.include_router(proposals.router, prefix=api_v1_prefix)
app.include_router(invoices.router, prefix=api_v1_prefix)
app.include_router(documents.router, prefix=api_v1_prefix)
app.include_router(comments.router, prefix=api_v1_prefix)
app.include_router(dashboard.router, prefix=api_v1_prefix)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "open-client-portal-api",
        "environment": settings.APP_ENV,
        "database": "connected"
    }

@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }
