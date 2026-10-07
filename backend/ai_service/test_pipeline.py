import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
import sys
import time
import unittest
import numpy as np
from PIL import Image, ImageDraw

# Add ai_service to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.model_loader import model_container
from services.image_preprocessor import ImagePreprocessor
from services.object_detector import ObjectDetector
from services.material_classifier import MaterialClassifier
from services.segmenter import SAMSegmenter
from services.vision_pipeline import vision_pipeline
from schemas.vision_schemas import VisionAnalysisRequest

class TestPhase3APipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create a small deterministic fixture image (300x300 RGB) with clear room elements
        cls.fixture_path = os.path.join(os.path.dirname(__file__), "test_fixture.jpg")
        img = Image.new("RGB", (300, 300), color=(200, 180, 150)) # Wood-like backdrop
        draw = ImageDraw.Draw(img)
        # Draw a high-contrast simulated door & chair object contour
        draw.rectangle([60, 50, 140, 260], fill=(60, 40, 30), outline=(20, 10, 0)) # Door/Cabinet
        draw.rectangle([180, 150, 270, 260], fill=(80, 50, 20), outline=(30, 15, 5)) # Chair/Table
        img.save(cls.fixture_path)
        
        print("\n==================================================")
        print("PHASE 3A - REAL PRETRAINED CV INFERENCE TEST SUITE")
        print("==================================================")
        init_start = time.time()
        model_container.load_all_models()
        init_time = round((time.time() - init_start) * 1000, 2)
        print(f"Model initialization completed in {init_time}ms")

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(cls.fixture_path):
            try:
                os.remove(cls.fixture_path)
            except Exception:
                pass

    def test_A_model_initialization(self):
        health = model_container.get_health_status()
        print("\n[A. Model Initialization Check]")
        print(f"Service Status: {health['status']}")
        print(f"YOLO Loaded: {health['models']['objectDetector']['loaded']} ({health['models']['objectDetector']['model']})")
        print(f"SigLIP Loaded: {health['models']['materialClassifier']['loaded']} ({health['models']['materialClassifier']['model']})")
        print(f"SAM Loaded: {health['models']['segmenter']['loaded']} ({health['models']['segmenter']['model']})")
        
        # Strict Assertions: All 3 pretrained CV models must be loaded
        self.assertTrue(model_container.yolo_loaded, "YOLOv8 model must be loaded for real inference")
        self.assertTrue(model_container.siglip_loaded, "SigLIP model must be loaded for real inference")
        self.assertTrue(model_container.sam_loaded, "SAM model (facebook/sam-vit-base) must be loaded for real inference")
        self.assertEqual(health["status"], "HEALTHY")

    def test_B_image_preprocessing(self):
        pil_img = ImagePreprocessor.load_image(self.fixture_path)
        self.assertIsNotNone(pil_img)
        self.assertEqual(pil_img.size, (300, 300))
        
        lighting = ImagePreprocessor.compute_lighting_metrics(pil_img)
        self.assertIn("averageBrightnessLux", lighting)
        self.assertGreater(lighting["averageBrightnessLux"], 0)

    def test_C_yolo_inference(self):
        print("\n[C. YOLO Real Inference Check]")
        # Test lower threshold on synthetic fixture to verify real box output
        detector = ObjectDetector(confidence_threshold=0.05)
        pil_img = ImagePreprocessor.load_image(self.fixture_path)
        detections = detector.detect_objects(pil_img)
        
        print(f"Input Image Size: {pil_img.size}")
        print(f"YOLO Indoor Detections Count: {len(detections)}")
        for i, d in enumerate(detections):
            print(f" Detection {i+1}: Class='{d.className}', Score={d.modelScore:.4f}, BBox=[x={d.boundingBox.x}, y={d.boundingBox.y}, w={d.boundingBox.width}, h={d.boundingBox.height}]")
            self.assertIsNotNone(d.className)
            self.assertGreaterEqual(d.modelScore, 0.0)
            self.assertLessEqual(d.modelScore, 1.0)

    def test_D_siglip_inference(self):
        print("\n[D. SigLIP Real Inference Check]")
        classifier = MaterialClassifier(application_threshold=0.30)
        pil_img = ImagePreprocessor.load_image(self.fixture_path)
        res = classifier.classify_surface(pil_img, "WALL_1")
        
        print(f"SigLIP Top Category: '{res.category}' (Score: {res.modelScore:.4f})")
        print(f"Candidate Scores: {res.candidateScores}")
        
        self.assertIsNotNone(res.category)
        self.assertGreater(res.modelScore, 0.0)
        self.assertEqual(len(res.candidateScores), 5)

    def test_E_sam_real_inference(self):
        print("\n[E. SAM Real Inference Check]")
        self.assertTrue(model_container.sam_loaded, "SAM model must be loaded for real SAM inference test")
        
        segmenter = SAMSegmenter()
        pil_img = ImagePreprocessor.load_image(self.fixture_path)
        
        # Pass a real bounding box prompt directly into SAM
        # Bounding box prompt over the fixture object rectangle [60, 50, 140, 260]
        bbox_x1, bbox_y1, bbox_x2, bbox_y2 = 60.0, 50.0, 140.0, 260.0
        
        from schemas.vision_schemas import DetectionResult, BoundingBox
        test_detection = DetectionResult(
            className="door",
            modelScore=0.75,
            boundingBox=BoundingBox(x=bbox_x1, y=bbox_y1, width=bbox_x2-bbox_x1, height=bbox_y2-bbox_y1),
            segmentationMaskAvailable=False
        )
        
        sam_start = time.time()
        masks = segmenter.generate_masks_for_detections(pil_img, [test_detection])
        sam_elapsed = round((time.time() - sam_start) * 1000, 2)
        
        self.assertGreater(len(masks), 0, "SAM must generate a real segmentation mask")
        mask_result = masks[0]
        
        print(f"SAM Execution Time: {sam_elapsed}ms")
        print(f"Target Class: '{mask_result.targetClass}'")
        print(f"BBox Prompt Used: [{bbox_x1}, {bbox_y1}, {bbox_x2}, {bbox_y2}]")
        print(f"Mask Boundary Coords: {mask_result.maskBounds}")
        print(f"Mask Area Ratio: {mask_result.areaRatio}")
        print(f"Detection Mask Flag: {test_detection.segmentationMaskAvailable}")
        
        # Strict Assertions: Mask must be computed, areaRatio > 0, flag set to True
        self.assertTrue(test_detection.segmentationMaskAvailable)
        self.assertGreater(mask_result.areaRatio, 0.0)
        self.assertLessEqual(mask_result.areaRatio, 1.0)

    def test_F_pipeline_structured_output(self):
        print("\n[F. Complete Vision Pipeline Check]")
        req = VisionAnalysisRequest(imagePaths={"WALL_1": self.fixture_path})
        start_t = time.time()
        resp = vision_pipeline.analyze(req)
        inf_time = round((time.time() - start_t) * 1000, 2)
        
        print(f"Full Pipeline Analysis Source: '{resp.analysisSource}'")
        print(f"Pipeline Total Latency: {inf_time}ms")
        print(f"Model Metadata: {resp.modelMetadata}")
        
        self.assertEqual(resp.analysisSource, "PRETRAINED_CV", "Analysis source must be PRETRAINED_CV")
        self.assertIn("WALL_1", resp.surfaces)
        self.assertIsNotNone(resp.lighting)
        self.assertEqual(resp.modelMetadata.objectDetector, "yolov8x-oiv7.pt")
        self.assertEqual(resp.modelMetadata.materialClassifier, "google/siglip-base-patch16-224")
        self.assertEqual(resp.modelMetadata.segmenter, "facebook/sam-vit-base")

if __name__ == "__main__":
    unittest.main()
