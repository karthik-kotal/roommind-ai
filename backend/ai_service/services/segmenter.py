import logging
import torch
import numpy as np
from typing import List, Dict, Any, Optional
from PIL import Image
from models.model_loader import model_container
from schemas.vision_schemas import SegmentationMask, DetectionResult

logger = logging.getLogger("segmenter")

class SAMSegmenter:
    def generate_masks_for_detections(
        self, image: Image.Image, detections: List[DetectionResult]
    ) -> List[SegmentationMask]:
        """
        Runs SAM segmentation using detected YOLO bounding boxes as prompts.
        Generates actual pixel masks and updates detection flags.
        """
        if not detections or not model_container.sam_loaded:
            logger.info("SAM model not loaded or no detections provided. Skipping SAM segmentation.")
            return []

        segmentation_masks: List[SegmentationMask] = []

        try:
            import gc
            gc.collect()
            if torch.get_num_threads() > 4:
                torch.set_num_threads(4)

            processor, model = model_container.sam
            img_width, img_height = image.size

            # Extract 2D boxes for SAM processor input prompt format: [[[x1, y1, x2, y2]]]
            for detection in detections:
                bbox = detection.boundingBox
                x1 = bbox.x
                y1 = bbox.y
                x2 = bbox.x + bbox.width
                y2 = bbox.y + bbox.height

                box_prompt = [[[x1, y1, x2, y2]]]

                inputs = processor(image, input_boxes=box_prompt, return_tensors="pt")
                pixel_values = inputs["pixel_values"].to(torch.float32)
                input_boxes_tensor = inputs["input_boxes"].to(torch.float32)

                with torch.no_grad():
                    outputs = model(pixel_values=pixel_values, input_boxes=input_boxes_tensor)

                # Post-process mask
                masks = processor.image_processor.post_process_masks(
                    outputs.pred_masks,
                    inputs["original_sizes"],
                    inputs["reshaped_input_sizes"]
                )

                if masks and len(masks) > 0:
                    # masks[0] shape: [1, 3, H, W] -> take top mask
                    mask_tensor = masks[0][0][0].cpu().numpy() # Boolean 2D array [H, W]
                    
                    # Compute actual area ratio
                    mask_pixel_count = np.sum(mask_tensor)
                    total_pixels = img_width * img_height
                    area_ratio = round(float(mask_pixel_count / max(total_pixels, 1)), 4)

                    if area_ratio > 0:
                        # Extract mask boundary coordinates (box around mask)
                        y_indices, x_indices = np.where(mask_tensor)
                        if len(x_indices) > 0 and len(y_indices) > 0:
                            mb_x1, mb_x2 = float(np.min(x_indices)), float(np.max(x_indices))
                            mb_y1, mb_y2 = float(np.min(y_indices)), float(np.max(y_indices))
                            mask_bounds = [[mb_x1, mb_y1], [mb_x2, mb_y2]]
                        else:
                            mask_bounds = [[x1, y1], [x2, y2]]

                        mask_obj = SegmentationMask(
                            targetClass=detection.className,
                            maskBounds=mask_bounds,
                            areaRatio=area_ratio
                        )
                        segmentation_masks.append(mask_obj)
                        
                        # Set actual mask available flag ONLY because mask was actually generated
                        detection.segmentationMaskAvailable = True
                        logger.info(f"Generated SAM mask for {detection.className} (area_ratio={area_ratio})")

            return segmentation_masks
        except Exception as e:
            import traceback
            logger.error(f"Error during SAM segmentation inference: {e}\n{traceback.format_exc()}")
            return []
