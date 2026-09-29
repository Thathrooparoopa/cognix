from fastapi import FastAPI
from datetime import datetime

app = FastAPI(
    title="Cognix AI Service",
    description="AI intelligence service for the Cognix adaptive learning platform.",
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "success": True,
        "service": "Cognix AI Service",
        "version": "1.0.0",
        "message": "Cognix AI engine is running.",
    }


@app.get("/health")
def health():
    return {
        "success": True,
        "service": "Cognix AI Service",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
