import os
import cv2
import numpy as np

# Try importing Ultralytics YOLO
try:
    from ultralytics import YOLO
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False
    print("Ultralytics YOLO not installed. Using mock detector.")

class CrowdDetector:
    def __init__(self, model_path="yolov8n.pt"):
        self.model = None
        self.has_model = False
        
        if HAS_YOLO:
            try:
                # Load YOLO model, download if not present
                self.model = YOLO(model_path)
                self.has_model = True
                print(f"YOLOv8 model loaded successfully from {model_path}.")
            except Exception as e:
                print(f"Error loading YOLOv8 model: {e}. Falling back to mock detector.")

    def detect_people(self, frame):
        """
        Detects people in a given OpenCV frame.
        Returns:
            list of dicts containing 'box' (x1, y1, x2, y2), 'confidence', and 'center' (x, y)
        """
        if self.has_model and self.model is not None:
            try:
                # Run inference for person class (class ID 0 in COCO)
                results = self.model(frame, classes=[0], verbose=False)
                detections = []
                
                if len(results) > 0:
                    boxes = results[0].boxes
                    for box in boxes:
                        coords = box.xyxy[0].tolist()  # x1, y1, x2, y2
                        conf = float(box.conf[0])
                        x1, y1, x2, y2 = map(int, coords)
                        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                        detections.append({
                            "box": [x1, y1, x2, y2],
                            "confidence": conf,
                            "center": (cx, cy)
                        })
                return detections
            except Exception as e:
                print(f"Inference error: {e}. Falling back to mock detection.")
                
        # Mock detector fallback
        return self._generate_mock_detections(frame)

    def _generate_mock_detections(self, frame):
        """
        Generates simulated person detections based on image dimensions.
        """
        h, w, _ = frame.shape
        # Create a deterministic mock based on frame shape or simple random seed
        np.random.seed(42)
        
        # Decide count based on frame aspect ratio/size
        num_people = int(np.random.randint(15, 60))
        
        detections = []
        for _ in range(num_people):
            # Center of the person
            cx = int(np.random.randint(50, w - 50))
            cy = int(np.random.randint(50, h - 50))
            
            # Width and height of box
            bw = int(np.random.randint(20, 50))
            bh = int(np.random.randint(50, 100))
            
            x1 = max(0, cx - bw // 2)
            y1 = max(0, cy - bh // 2)
            x2 = min(w, cx + bw // 2)
            y2 = min(h, cy + bh // 2)
            
            detections.append({
                "box": [x1, y1, x2, y2],
                "confidence": float(np.random.uniform(0.6, 0.95)),
                "center": (cx, cy)
            })
            
        return detections
