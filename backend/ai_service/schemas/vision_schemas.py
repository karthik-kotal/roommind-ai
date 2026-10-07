from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class DetectionResult(BaseModel):
    className: str
    modelScore: float
    boundingBox: BoundingBox
    segmentationMaskAvailable: bool = False

class SegmentationMask(BaseModel):
    targetClass: str
    maskBounds: List[List[float]]
    areaRatio: float

class MaterialResult(BaseModel):
    category: str
    modelScore: float
    candidateScores: List[Dict[str, float]]

class SurfaceAnalysis(BaseModel):
    surfaceType: str
    category: str
    modelScore: float
    candidateScores: List[Dict[str, float]]
    detections: List[DetectionResult] = []
    segments: List[SegmentationMask] = []

class LightingMetrics(BaseModel):
    averageBrightnessLux: float
    lightCharacteristics: str

class ModelMetadata(BaseModel):
    objectDetector: str = "yolov8x-oiv7"
    materialClassifier: str = "google/siglip-base-patch16-224"
    segmenter: str = "facebook/sam-vit-huge"

class VisionAnalysisResponse(BaseModel):
    analysisSource: str = "PRETRAINED_CV"
    surfaces: Dict[str, SurfaceAnalysis]
    objects: List[DetectionResult] = []
    lighting: LightingMetrics
    modelMetadata: ModelMetadata = Field(default_factory=ModelMetadata)

class VisionAnalysisRequest(BaseModel):
    imagePaths: Dict[str, str]
