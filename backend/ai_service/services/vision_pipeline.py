import time
import logging
from typing import Dict, Any, List
from PIL import Image
from models.model_loader import model_container
from services.image_preprocessor import ImagePreprocessor
from services.object_detector import ObjectDetector
from services.material_classifier import MaterialClassifier
from services.segmenter import SAMSegmenter
from schemas.vision_schemas import (
    VisionAnalysisResponse,
    VisionAnalysisRequest,
    SurfaceAnalysis,
    LightingMetrics,
    ModelMetadata,
    DetectionResult,
    SegmentationMask,
    MaterialResult
)

logger = logging.getLogger("vision_pipeline")

class VisionPipeline:
    def __init__(self):
        self.object_detector = ObjectDetector(confidence_threshold=0.25)
        self.material_classifier = MaterialClassifier(application_threshold=0.60)
        self.segmenter = SAMSegmenter()

    def analyze(self, request: VisionAnalysisRequest) -> VisionAnalysisResponse:
        start_time = time.time()
        image_paths = request.imagePaths or {}
        
        logger.info(f"Starting Vision Pipeline analysis for {len(image_paths)} surface images...")
        
        # Check if pretrained model container is functional
        is_pretrained = model_container.yolo_loaded and model_container.siglip_loaded
        analysis_source = "PRETRAINED_CV" if is_pretrained else "HEURISTIC_FALLBACK"
        
        surfaces_result: Dict[str, SurfaceAnalysis] = {}
        all_objects: List[DetectionResult] = []
        overall_lighting = LightingMetrics(
            averageBrightnessLux=250.0,
            lightCharacteristics="Moderate ambient interior lighting"
        )

        for surface_key, img_path in image_paths.items():
            try:
                # 1. Load image
                pil_img = ImagePreprocessor.load_image(img_path)
                
                # 2. Lighting metrics (empirical ImageStat luminance)
                lighting = ImagePreprocessor.compute_lighting_metrics(pil_img)
                overall_lighting = LightingMetrics(
                    averageBrightnessLux=lighting["averageBrightnessLux"],
                    lightCharacteristics=lighting["lightCharacteristics"]
                )

                if is_pretrained:
                    # 3. YOLO Object/Opening Detection
                    detections = self.object_detector.detect_objects(pil_img)
                    all_objects.extend(detections)

                    # 4. SigLIP Material Classification
                    material_res = self.material_classifier.classify_surface(pil_img, surface_key)

                    # 5. SAM Mask Segmentation on detected YOLO bounding boxes
                    masks = self.segmenter.generate_masks_for_detections(pil_img, detections)

                    surface_analysis = SurfaceAnalysis(
                        surfaceType=surface_key,
                        category=material_res.category,
                        modelScore=material_res.modelScore,
                        candidateScores=material_res.candidateScores,
                        detections=detections,
                        segments=masks
                    )
                else:
                    # Clear, explicit HEURISTIC FALLBACK (labelled as HEURISTIC_FALLBACK)
                    logger.warning(f"Using HEURISTIC_FALLBACK for {surface_key} due to unloaded CV models.")
                    surface_analysis = SurfaceAnalysis(
                        surfaceType=surface_key,
                        category="Not confidently detected",
                        modelScore=0.0,
                        candidateScores=[],
                        detections=[],
                        segments=[]
                    )

                surfaces_result[surface_key] = surface_analysis

            except Exception as e:
                logger.error(f"Failed to analyze image for {surface_key} ('{img_path}'): {e}")
                surfaces_result[surface_key] = SurfaceAnalysis(
                    surfaceType=surface_key,
                    category="Not confidently detected",
                    modelScore=0.0,
                    candidateScores=[],
                    detections=[],
                    segments=[]
                )

        elapsed = round((time.time() - start_time) * 1000, 2)
        logger.info(f"Vision Pipeline completed in {elapsed}ms. Source={analysis_source}")

        metadata = ModelMetadata(
            objectDetector=model_container.yolo_name,
            materialClassifier=model_container.siglip_name,
            segmenter=model_container.sam_name
        )

        return VisionAnalysisResponse(
            analysisSource=analysis_source,
            surfaces=surfaces_result,
            objects=all_objects,
            lighting=overall_lighting,
            modelMetadata=metadata
        )

# Global pipeline instance
vision_pipeline = VisionPipeline()
