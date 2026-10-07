import logging
from typing import List, Dict, Any
from PIL import Image
from models.model_loader import model_container
from schemas.vision_schemas import DetectionResult, BoundingBox

logger = logging.getLogger("object_detector")

# Target indoor / opening classes supported across Open Images V7 & COCO taxonomies
SUPPORTED_INDOOR_CLASSES = {
    "door", "window", "sofa", "couch", "chair", "table", "desk", "bed",
    "cabinet", "television", "tv", "plant", "houseplant", "lamp", "mirror",
    "sink", "curtain", "furniture", "shelf", "bookcase", "armchair"
}

class ObjectDetector:
    def __init__(self, confidence_threshold: float = 0.25):
        self.confidence_threshold = confidence_threshold

    def detect_objects(self, image: Image.Image) -> List[DetectionResult]:
        """
        Runs YOLO object detection on PIL Image.
        Returns extracted real class names, bounding boxes, and model scores.
        """
        if not model_container.yolo_loaded:
            logger.warning("YOLO model not loaded. Skipping object detection.")
            return []

        try:
            model = model_container.yolo
            results = model(image, conf=self.confidence_threshold, verbose=False)
            
            detections: List[DetectionResult] = []
            img_width, img_height = image.size

            for result in results:
                boxes = result.boxes
                if boxes is None:
                    continue

                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    cls_name = model.names[cls_id] if hasattr(model, 'names') and cls_id in model.names else str(cls_id)
                    score = float(box.conf[0].item())

                    # Normalize class name matching
                    cls_name_lower = cls_name.lower()
                    
                    # Filter strictly to supported indoor/opening taxonomy
                    if cls_name_lower in SUPPORTED_INDOOR_CLASSES or any(c in cls_name_lower for c in ["door", "window", "chair", "table", "sofa"]):
                        # Extract xywh box coordinates
                        xyxy = box.xyxy[0].tolist() # [x1, y1, x2, y2]
                        x1, y1, x2, y2 = xyxy
                        
                        bbox = BoundingBox(
                            x=round(x1, 2),
                            y=round(y1, 2),
                            width=round(x2 - x1, 2),
                            height=round(y2 - y1, 2)
                        )
                        
                        detection = DetectionResult(
                            className=cls_name,
                            modelScore=round(score, 4),
                            boundingBox=bbox,
                            segmentationMaskAvailable=False
                        )
                        detections.append(detection)

            logger.info(f"YOLO detected {len(detections)} valid indoor objects/openings")
            return detections
        except Exception as e:
            logger.error(f"Error during YOLO object detection inference: {e}")
            return []
