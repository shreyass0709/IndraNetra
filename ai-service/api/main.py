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
from prediction.risk.risk import RiskPredictor # Wait, the folder structure is prediction/risk.py, let's check
# Oh, the path is prediction/risk.py (not prediction/risk/risk.py). Let's verify:
# c:/Users/shrey/OneDrive/Desktop/IndraNetra/ai-service/prediction/risk.py
# So it's from prediction.risk import RiskPredictor.
from prediction.risk import RiskPredictor
from prediction.pathfinder import PathFinder

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

class RouteRequest(BaseModel):
    grid: List[List[float]]
    start: Tuple[int, int]
    end: Tuple[int, int]

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
    capacity: int = Form(500)
):
    try:
        # Read uploaded image bytes
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image file.")
            
        # 1. Run YOLO Object Detection
        detections = detector.detect_people(frame)
        people_count = len(detections)
        
        # 2. Generate Heatmap
        heatmap_frame, raw_density_score = heatmap_gen.generate_heatmap(frame, detections)
        
        # 3. Predict Crowd Risk
        risk_result = risk_pred.predict_risk(people_count, raw_density_score, capacity)
        
        # Convert analyzed image back to base64 for response
        _, encoded_img = cv2.imencode('.jpg', heatmap_frame)
        base64_heatmap = base64.b64encode(encoded_img).decode('utf-8')
        
        return {
            "people_count": people_count,
            "density_score": round(raw_density_score, 2),
            "risk_level": risk_result["risk_level"],
            "confidence": round(risk_result["confidence"], 2),
            "probabilities": risk_result["probabilities"],
            "utilization": round(risk_result["utilization"], 2),
            "heatmap_image": f"data:image/jpeg;base64,{base64_heatmap}",
            "detections_count": len(detections)
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

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
