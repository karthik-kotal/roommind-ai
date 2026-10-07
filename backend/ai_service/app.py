import os
import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from models.model_loader import model_container
from services.vision_pipeline import vision_pipeline
from schemas.vision_schemas import VisionAnalysisRequest, VisionAnalysisResponse

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up FastAPI AI Microservice — Phase 3A (Real Pretrained CV Inference)")
    # Load pretrained CV models into memory once at startup
    model_container.load_all_models()
    yield
    logger.info("Shutting down FastAPI AI Microservice.")

app = FastAPI(
    title="RoomMind AI Service — Real Pretrained CV Inference",
    version="3.0.0",
    description="Provides real YOLOv8, SigLIP, and SAM pretrained model inference for indoor room scans.",
    lifespan=lifespan
)

# Enable CORS for Spring Boot & Vite Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """
    Health endpoint reporting overall service state and individual model availability.
    """
    health = model_container.get_health_status()
    return {
        "service": "RoomMind-AI-Service",
        "phase": "Phase 3A — Real Pretrained CV Inference",
        "status": health["status"],
        "models": health["models"],
        "loadErrors": health["loadErrors"]
    }

@app.post("/analyze", response_model=VisionAnalysisResponse)
def analyze_images(request: VisionAnalysisRequest):
    """
    Performs complete pretrained vision pipeline analysis:
    1. YOLOv8 Open Images V7 object & opening detection
    2. SigLIP zero-shot material & surface classification
    3. SAM pixel mask segmentation for detected objects
    4. Empirical lighting & luminance measurements
    """
    try:
        response = vision_pipeline.analyze(request)
        return response
    except Exception as e:
        logger.error(f"Error executing vision pipeline: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vision pipeline processing error: {str(e)}"
        )

if __name__ == "__main__":
    port = int(os.environ.get("AI_SERVICE_PORT", 8089))
    logger.info(f"Starting server on port {port}...")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
