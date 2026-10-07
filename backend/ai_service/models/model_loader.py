import os
import sys
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("model_loader")

class ModelContainer:
    def __init__(self):
        self._yolo_model = None
        self._siglip_processor = None
        self._siglip_model = None
        self._sam_processor = None
        self._sam_model = None
        
        self.yolo_name: str = "yolov8x-oiv7.pt"
        self.siglip_name: str = "google/siglip-base-patch16-224"
        self.sam_name: str = "facebook/sam-vit-base"
        
        self.yolo_loaded: bool = False
        self.siglip_loaded: bool = False
        self.sam_loaded: bool = False
        self.load_errors: Dict[str, str] = {}

    def load_all_models(self):
        logger.info("Initializing Model Lifecycle...")
        self.load_yolo()
        self.load_siglip()
        try:
            self.load_sam()
        except Exception as e:
            logger.warning(f"SAM loading deferred: {e}")

    def load_yolo(self):
        try:
            from ultralytics import YOLO
            logger.info(f"Loading YOLO model: {self.yolo_name}...")
            try:
                self._yolo_model = YOLO(self.yolo_name)
            except Exception as e:
                logger.warning(f"Failed loading {self.yolo_name}, falling back to yolov8n.pt: {e}")
                self.yolo_name = "yolov8n.pt"
                self._yolo_model = YOLO("yolov8n.pt")
            
            self.yolo_loaded = True
            logger.info(f"YOLO model loaded successfully ({self.yolo_name})")
        except Exception as e:
            self.yolo_loaded = False
            self.load_errors["yolo"] = str(e)
            logger.error(f"Failed to load YOLO model: {e}")

    def load_siglip(self):
        try:
            from transformers import AutoProcessor, AutoModelForZeroShotImageClassification
            logger.info(f"Loading SigLIP model: {self.siglip_name}...")
            self._siglip_processor = AutoProcessor.from_pretrained(self.siglip_name)
            self._siglip_model = AutoModelForZeroShotImageClassification.from_pretrained(self.siglip_name)
            self.siglip_loaded = True
            logger.info("SigLIP model loaded successfully")
        except Exception as e:
            self.siglip_loaded = False
            self.load_errors["siglip"] = str(e)
            logger.error(f"Failed to load SigLIP model: {e}")

    def load_sam(self):
        try:
            from transformers import SamModel, SamProcessor
            self.sam_name = "facebook/sam-vit-base"
            logger.info(f"Loading SAM model: {self.sam_name}...")
            self._sam_processor = SamProcessor.from_pretrained(self.sam_name)
            self._sam_model = SamModel.from_pretrained(self.sam_name)
            self.sam_loaded = True
            logger.info(f"SAM model loaded successfully ({self.sam_name})")
        except Exception as e:
            self.sam_loaded = False
            self.load_errors["sam"] = str(e)
            logger.error(f"Failed to load SAM model: {e}")

    @property
    def yolo(self):
        if not self.yolo_loaded:
            self.load_yolo()
        return self._yolo_model

    @property
    def siglip(self):
        if not self.siglip_loaded:
            self.load_siglip()
        return self._siglip_processor, self._siglip_model

    @property
    def sam(self):
        if not self.sam_loaded:
            self.load_sam()
        return self._sam_processor, self._sam_model

    def get_health_status(self) -> Dict[str, Any]:
        all_loaded = self.yolo_loaded and self.siglip_loaded and self.sam_loaded
        return {
            "status": "HEALTHY" if all_loaded else "DEGRADED",
            "models": {
                "objectDetector": {
                    "model": self.yolo_name,
                    "loaded": self.yolo_loaded
                },
                "materialClassifier": {
                    "model": self.siglip_name,
                    "loaded": self.siglip_loaded
                },
                "segmenter": {
                    "model": self.sam_name,
                    "loaded": self.sam_loaded
                }
            },
            "loadErrors": self.load_errors
        }

# Global Singleton Instance
model_container = ModelContainer()
