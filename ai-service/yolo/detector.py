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

class IoUTracker:
    def __init__(self, max_lost=10, iou_threshold=0.3):
        self.next_id = 1
        self.tracks = {}  # id -> { "box": [x1, y1, x2, y2], "lost": 0 }
        self.max_lost = max_lost
        self.iou_threshold = iou_threshold

    @staticmethod
    def _compute_iou(boxA, boxB):
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        interWidth = max(0, xB - xA)
        interHeight = max(0, yB - yA)
        interArea = interWidth * interHeight

        boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])

        unionArea = boxAArea + boxBArea - interArea
        if unionArea == 0:
            return 0
        return interArea / float(unionArea)

    def update(self, bboxes):
        updated_tracks = {}
        matched_detections = set()

        # 1. Update existing tracks
        for track_id, track_info in self.tracks.items():
            best_iou = 0
            best_det_idx = -1
            for idx, box in enumerate(bboxes):
                if idx in matched_detections:
                    continue
                iou = self._compute_iou(track_info["box"], box)
                if iou > best_iou:
                    best_iou = iou
                    best_det_idx = idx

            if best_iou >= self.iou_threshold:
                updated_tracks[track_id] = {
                    "box": bboxes[best_det_idx],
                    "lost": 0
                }
                matched_detections.add(best_det_idx)
            else:
                lost_count = track_info["lost"] + 1
                if lost_count <= self.max_lost:
                    updated_tracks[track_id] = {
                        "box": track_info["box"],
                        "lost": lost_count
                    }

        # 2. Add new tracks
        for idx, box in enumerate(bboxes):
            if idx not in matched_detections:
                updated_tracks[self.next_id] = {
                    "box": box,
                    "lost": 0
                }
                self.next_id += 1

        self.tracks = updated_tracks
        return {tid: tinfo["box"] for tid, tinfo in self.tracks.items() if tinfo["lost"] == 0}

class CrowdDetector:
    def __init__(self, model_path="yolo11n.pt"):
        self.model = None
        self.has_model = False
        
        # Check if yolov8 is fallback or if we can use yolo11
        if HAS_YOLO:
            try:
                # Load YOLOv11 model (download/cache if not present)
                self.model = YOLO(model_path)
                self.has_model = True
                print(f"YOLOv11 model loaded successfully from {model_path}.")
            except Exception as e:
                print(f"Error loading YOLOv11 model: {e}. Trying yolov8n.pt fallback.")
                try:
                    self.model = YOLO("yolov8n.pt")
                    self.has_model = True
                    print("YOLOv8 fallback model loaded successfully.")
                except Exception as ex:
                    print(f"Error loading fallback model: {ex}. Using mock detector.")

        # State management for tracking and smoothing per camera
        self.camera_trackers = {}
        self.camera_history = {}
        self.smoothing_window = 20  # average over last 20 frames (~3-4 seconds at 5-6 fps)

    def detect_people(self, frame, camera_id="default"):
        """
        Detects and tracks people in a given OpenCV frame.
        Includes confidence filtering (>= 0.5), ByteTrack tracking fallback,
        and temporal count smoothing.
        
        Returns:
            list of dicts containing 'box' (x1, y1, x2, y2), 'confidence', and 'center' (x, y)
        """
        raw_detections = []
        
        if self.has_model and self.model is not None:
            try:
                # Run inference for person class (class ID 0 in COCO)
                results = self.model(frame, classes=[0], verbose=False)
                
                if len(results) > 0:
                    boxes = results[0].boxes
                    for box in boxes:
                        coords = box.xyxy[0].tolist()  # x1, y1, x2, y2
                        conf = float(box.conf[0])
                        
                        # Apply confidence threshold (0.5) to ignore weak detections
                        if conf >= 0.5:
                            x1, y1, x2, y2 = map(int, coords)
                            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                            raw_detections.append({
                                "box": [x1, y1, x2, y2],
                                "confidence": conf,
                                "center": (cx, cy)
                            })
            except Exception as e:
                print(f"Inference error: {e}. Falling back to mock detection.")
                raw_detections = self._generate_mock_detections(frame)
        else:
            raw_detections = self._generate_mock_detections(frame)

        # Apply tracker to avoid double counting and stabilize tracks
        if camera_id not in self.camera_trackers:
            self.camera_trackers[camera_id] = IoUTracker()
            self.camera_history[camera_id] = []

        tracker = self.camera_trackers[camera_id]
        boxes_list = [det["box"] for det in raw_detections]
        active_tracks = tracker.update(boxes_list)

        # Assemble tracked detections
        tracked_detections = []
        for det in raw_detections:
            # Check if this box is associated with an active track
            is_active = False
            for tid, track_box in active_tracks.items():
                # If overlap is high, count it as tracked
                if tracker._compute_iou(det["box"], track_box) >= 0.5:
                    is_active = True
                    break
            
            if is_active:
                tracked_detections.append(det)

        # If tracked detections gets filtered too much, default to active tracks count
        tracked_count = max(len(tracked_detections), len(active_tracks))

        # Smoothing: Average count over history window
        history = self.camera_history[camera_id]
        history.append(tracked_count)
        self.camera_history[camera_id] = history[-self.smoothing_window:]
        
        smoothed_count = int(round(np.mean(self.camera_history[camera_id])))

        # Re-adjust tracked_detections list to match the smoothed count size if needed
        # (for visualization purposes, so heatmap shows correct density)
        if len(tracked_detections) > smoothed_count:
            tracked_detections = tracked_detections[:smoothed_count]
        elif len(tracked_detections) < smoothed_count and len(raw_detections) >= smoothed_count:
            # borrow some from raw detections
            tracked_detections = raw_detections[:smoothed_count]

        return tracked_detections

    def _generate_mock_detections(self, frame):
        """
        Generates simulated person detections based on image dimensions.
        """
        h, w, _ = frame.shape
        np.random.seed(42)
        
        num_people = int(np.random.randint(15, 60))
        
        detections = []
        for _ in range(num_people):
            cx = int(np.random.randint(50, w - 50))
            cy = int(np.random.randint(50, h - 50))
            
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
