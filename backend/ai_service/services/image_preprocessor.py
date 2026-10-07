import os
import logging
from PIL import Image, ImageStat
from typing import Tuple, Dict, Any

logger = logging.getLogger("image_preprocessor")

class ImagePreprocessor:
    @staticmethod
    def load_image(image_source: str) -> Image.Image:
        """
        Loads an image from a local file path or data URI.
        Ensures RGB mode.
        """
        if not image_source:
            raise ValueError("Image source path or URI cannot be empty")
            
        if os.path.exists(image_source):
            img = Image.open(image_source).convert("RGB")
            return img
        else:
            # Check if relative to app root
            alt_path = os.path.abspath(image_source)
            if os.path.exists(alt_path):
                return Image.open(alt_path).convert("RGB")
            raise FileNotFoundError(f"Image not found at path: {image_source}")

    @staticmethod
    def compute_lighting_metrics(img: Image.Image) -> Dict[str, Any]:
        """
        Calculates empirical image luminance / brightness lux estimate.
        This is real image pixel stat analysis, distinct from neural network predictions.
        """
        grayscale = img.convert("L")
        stat = ImageStat.Stat(grayscale)
        mean_brightness = stat.mean[0] # 0 to 255
        
        # Approximate Lux level mapping from 8-bit sRGB mean luminance
        lux_estimate = round(mean_brightness * 2.5, 2)
        
        if lux_estimate > 450:
            char = "High natural illumination detected"
        elif lux_estimate > 200:
            char = "Moderate ambient interior lighting"
        else:
            char = "Low ambient interior light level"

        return {
            "averageBrightnessLux": lux_estimate,
            "lightCharacteristics": char
        }
