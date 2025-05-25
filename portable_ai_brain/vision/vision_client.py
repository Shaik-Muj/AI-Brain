# vision/vision_client.py
from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import torch

class VisionClient:
    def __init__(self):
        self.processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        self.model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

    def analyze_image(self, image_path: str) -> str:
        image = Image.open(image_path).convert("RGB")
        inputs = self.processor(images=image, return_tensors="pt")

        with torch.no_grad():
            output = self.model.generate(**inputs)
        
        caption = self.processor.decode(output[0], skip_special_tokens=True)
        return caption
