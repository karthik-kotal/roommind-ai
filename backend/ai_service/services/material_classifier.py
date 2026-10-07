import logging
import torch
from typing import Dict, List, Any, Tuple
from PIL import Image
from models.model_loader import model_container
from schemas.vision_schemas import MaterialResult

logger = logging.getLogger("material_classifier")

WALL_CANDIDATES = [
    "painted wall",
    "plaster-like wall",
    "wallpaper",
    "wood-like wall panel",
    "stone-like wall"
]

FLOOR_CANDIDATES = [
    "wood-like flooring",
    "vitrified tile flooring",
    "ceramic tile flooring",
    "stone-like flooring",
    "carpet flooring"
]

class MaterialClassifier:
    def __init__(self, application_threshold: float = 0.60):
        self.application_threshold = application_threshold

    def classify_surface(self, image: Image.Image, surface_type: str) -> MaterialResult:
        """
        Runs SigLIP zero-shot image classification for surface materials.
        Scores candidates using actual model logits and softmax.
        """
        candidates = FLOOR_CANDIDATES if surface_type.lower().startswith("floor") else WALL_CANDIDATES

        if not model_container.siglip_loaded:
            logger.warning("SigLIP model not loaded. Returning unconfident classification.")
            return MaterialResult(
                category="Not confidently detected",
                modelScore=0.0,
                candidateScores=[{c: 0.0} for c in candidates]
            )

        try:
            processor, model = model_container.siglip
            
            # Format text prompts for zero-shot classification
            prompt_texts = [f"a photo of {c}" for c in candidates]
            
            # Process inputs
            inputs = processor(text=prompt_texts, images=image, return_tensors="pt", padding=True)
            
            with torch.no_grad():
                outputs = model(**inputs)
                logits_per_image = outputs.logits_per_image # image-to-text similarity logits
                probs = torch.nn.functional.softmax(logits_per_image, dim=1).squeeze(0).tolist()

            candidate_scores = []
            for candidate, score in zip(candidates, probs):
                candidate_scores.append({candidate: round(score, 4)})

            # Find highest scoring category
            best_idx = int(torch.argmax(torch.tensor(probs)).item())
            best_score = float(probs[best_idx])
            best_category = candidates[best_idx]

            # Enforce application decision threshold
            if best_score < self.application_threshold:
                final_category = "Not confidently detected"
            else:
                final_category = best_category

            logger.info(f"SigLIP classified {surface_type}: best='{best_category}' (score={best_score:.4f}) -> final='{final_category}'")

            return MaterialResult(
                category=final_category,
                modelScore=round(best_score, 4),
                candidateScores=candidate_scores
            )
        except Exception as e:
            logger.error(f"Error during SigLIP inference for {surface_type}: {e}")
            return MaterialResult(
                category="Not confidently detected",
                modelScore=0.0,
                candidateScores=[{c: 0.0} for c in candidates]
            )
