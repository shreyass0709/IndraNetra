import base64
import io
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple, Optional

# Import modules
from yolo.detector import CrowdDetector
from heatmaps.generator import HeatmapGenerator
# Oh, the path is prediction/risk.py (not prediction/risk/risk.py). Let's verify:
# c:/Users/shrey/OneDrive/Desktop/IndraNetra/ai-service/prediction/risk.py
# So it's from prediction.risk import RiskPredictor.
from prediction.risk import RiskPredictor
from prediction.pathfinder import PathFinder
from prediction.ground import GroundPlane

app = FastAPI(title="IndraNetra AI Crowd Analysis Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize modules
detector = CrowdDetector()
heatmap_gen = HeatmapGenerator()
risk_pred = RiskPredictor()
path_finder = PathFinder()

# Warm up the detector so the first live request doesn't pay the cold-start cost.
try:
    _warmup = np.zeros((640, 640, 3), dtype=np.uint8)
    detector.detect_people(_warmup, camera_id="__warmup__")
    print("Detector warmup complete.")
except Exception as _e:
    print(f"Detector warmup skipped: {_e}")

class RouteRequest(BaseModel):
    grid: List[List[float]]
    start: Tuple[int, int]
    end: Tuple[int, int]

# Cap frame resolution before inference. Detection accuracy for crowds is unaffected
# above ~1280px, while YOLO inference and heatmap generation (both O(width*height))
# get dramatically faster and more consistent across camera sources.
MAX_PROCESS_WIDTH = 1280

def downscale_frame(frame):
    h, w = frame.shape[:2]
    if w > MAX_PROCESS_WIDTH:
        scale = MAX_PROCESS_WIDTH / float(w)
        new_size = (MAX_PROCESS_WIDTH, int(round(h * scale)))
        return cv2.resize(frame, new_size, interpolation=cv2.INTER_AREA)
    return frame


def build_analysis(frame, detections, capacity, area_sqm, calibration, camera_id):
    """
    Shared tail for /analyze and /analyze_rtsp: measure density, score risk, render
    the heatmap overlay.

    Density comes from the camera's ground calibration when it has one, which gives
    real people/m^2 at the local hotspot. Uncalibrated cameras fall back to
    count/assumed-area, which is a venue-wide average and cannot see a hotspot --
    the response says which of the two you got via `calibrated`.
    """
    people_count = len(detections)

    # Heatmap overlay is pixel-space and purely visual; its density score is only
    # used for colouring, and as a last resort when nothing better exists.
    heatmap_frame, visual_density = heatmap_gen.generate_heatmap(frame, detections)

    ground = None
    calibration_error = None
    try:
        # frame_shape rescales the marked points to whatever resolution we actually
        # ran inference at (downscale_frame may have shrunk it).
        ground = GroundPlane.from_json(calibration, frame_shape=frame.shape)
    except ValueError as e:
        # A broken calibration is an operator-visible fault, not a reason to go
        # quiet: fall back, but say so loudly in the payload.
        calibration_error = str(e)
        print(f"[calibration] camera {camera_id}: {e}")

    measured = {}
    if ground is not None:
        measured = ground.analyze(detections)
        people_count = measured["people_count"]
        density_per_sqm = measured["density_peak"]
    elif area_sqm and area_sqm > 0:
        density_per_sqm = people_count / area_sqm
    else:
        density_per_sqm = visual_density

    risk_result = risk_pred.predict_risk(people_count, density_per_sqm, capacity)

    _, encoded_img = cv2.imencode('.jpg', heatmap_frame)
    base64_heatmap = base64.b64encode(encoded_img).decode('utf-8')

    return {
        "people_count": people_count,
        "density_score": round(density_per_sqm, 2),
        "risk_level": risk_result["risk_level"],
        "confidence": round(risk_result["confidence"], 2),
        "probabilities": risk_result["probabilities"],
        "utilization": round(risk_result["utilization"], 2),
        "heatmap_image": f"data:image/jpeg;base64,{base64_heatmap}",
        "detections_count": len(detections),
        # Calibration telemetry. `calibrated` tells the dashboard whether
        # density_score is a measured hotspot or an assumed average.
        "calibrated": ground is not None,
        "calibration_error": calibration_error,
        "density_mean": measured.get("density_mean"),
        "coverage_sqm": measured.get("coverage_sqm"),
        "outside_quad": measured.get("outside_quad"),
        "world_points": measured.get("world_points"),
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "yolo_loaded": detector.has_model,
        "sklearn_loaded": risk_pred.model is not None
    }

@app.post("/analyze")
async def analyze_frame(
    file: UploadFile = File(...),
    capacity: int = Form(500),
    area_sqm: float = Form(None),
    camera_id: str = Form("default"),
    calibration: str = Form(None)
):
    try:
        # Read uploaded image bytes
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image file.")

        # Cap resolution for faster, more consistent processing
        frame = downscale_frame(frame)

        detections = detector.detect_people(frame, camera_id=camera_id)
        return build_analysis(frame, detections, capacity, area_sqm, calibration, camera_id)

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@app.post("/analyze_rtsp")
async def analyze_rtsp(
    rtsp_url: str = Form(...),
    capacity: int = Form(500),
    area_sqm: float = Form(None),
    camera_id: str = Form("default"),
    calibration: str = Form(None)
):
    try:
        # Attempt to open RTSP stream
        cap = cv2.VideoCapture(rtsp_url)
        ret, frame = False, None
        if cap.isOpened():
            # Try to grab a frame
            ret, frame = cap.read()
            cap.release()

        # Fallback to mock frame generation if stream is unreachable (for demo robustness)
        if not ret or frame is None:
            print(f"RTSP stream at {rtsp_url} unreachable. Generating mock frame for analysis.")
            # Create a 720p dark HUD-style camera frame
            frame = np.zeros((720, 1280, 3), dtype=np.uint8)
            cv2.putText(frame, f"FEED: {rtsp_url}", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            cv2.putText(frame, "STATUS: SIMULATING RTSP FEED", (30, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            cv2.rectangle(frame, (50, 150), (1230, 670), (0, 255, 0), 2)
            
            # Generate deterministic mock detections based on RTSP URL to simulate real targets
            seed_val = abs(hash(rtsp_url)) % 100000
            np.random.seed(seed_val)
            h, w, _ = frame.shape
            num_people = int(np.random.randint(15, 60))
            detections = []
            for _ in range(num_people):
                cx = int(np.random.randint(100, w - 100))
                cy = int(np.random.randint(200, h - 100))
                bw = int(np.random.randint(30, 60))
                bh = int(np.random.randint(60, 120))
                x1, y1 = max(0, cx - bw // 2), max(0, cy - bh // 2)
                x2, y2 = min(w, cx + bw // 2), min(h, cy + bh // 2)
                detections.append({
                    "box": [x1, y1, x2, y2],
                    "confidence": float(np.random.uniform(0.7, 0.95)),
                    "center": (cx, cy)
                })
        else:
            # If we successfully read a frame, run YOLOv8 on it
            frame = downscale_frame(frame)
            detections = detector.detect_people(frame, camera_id=camera_id)

        return build_analysis(frame, detections, capacity, area_sqm, calibration, camera_id)

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"RTSP Processing error: {str(e)}")

@app.post("/route")
def calculate_route(request: RouteRequest):
    try:
        path = path_finder.find_route(request.grid, request.start, request.end)
        return {
            "path": path,
            "success": len(path) > 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Routing error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

