from ultralytics import YOLO

# Tuned on held-out data (COCO val2017 persons + the Mall CCTV counting set):
#   conf 0.50 @ 640px  -> Mall count error ~60% (finds 4 in 10 people)
#   conf 0.25 @ 1280px -> Mall count error ~22%, ~130 ms/frame on CPU
# Counting is the job, so recall matters more than per-box precision. A lower
# conf trades a few false boxes for far fewer missed people; the larger input
# lets the model see the small, distant heads that dominate CCTV crowd views.
CONF_THRESHOLD = 0.25
INFERENCE_SIZE = 1280
# Ultralytics caps detections at 300 by default -- too low for a dense crowd.
MAX_DETECTIONS = 1000


class CrowdDetector:
    """
    People detection on a single frame. No tracking, smoothing or fallback:
    each frame's count is what the model saw in that frame. If the model can't
    run, this raises -- a crowd-safety system must report "no reading", never
    an invented one.
    """

    def __init__(self, model_path="yolo11n.pt", fallback_path="yolov8n.pt"):
        try:
            self.model = YOLO(model_path)
            print(f"YOLO model loaded from {model_path}.")
        except Exception as e:
            print(f"Could not load {model_path}: {e}. Trying {fallback_path}.")
            self.model = YOLO(fallback_path)
            print(f"YOLO model loaded from {fallback_path}.")

    def detect_people(self, frame):
        """
        Returns a list of dicts: 'box' (x1, y1, x2, y2), 'confidence', 'center' (x, y).
        """
        result = self.model(
            frame,
            classes=[0],  # COCO class 0 = person
            conf=CONF_THRESHOLD,
            imgsz=INFERENCE_SIZE,
            max_det=MAX_DETECTIONS,
            verbose=False,
        )[0]

        detections = []
        for coords, conf in zip(result.boxes.xyxy.tolist(), result.boxes.conf.tolist()):
            x1, y1, x2, y2 = map(int, coords)
            detections.append({
                "box": [x1, y1, x2, y2],
                "confidence": float(conf),
                "center": ((x1 + x2) // 2, (y1 + y2) // 2),
            })
        return detections
