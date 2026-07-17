import numpy as np
try:
    from sklearn.ensemble import RandomForestClassifier
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False
    print("Scikit-Learn not installed. Using rule-based risk prediction.")

class RiskPredictor:
    def __init__(self):
        self.model = None
        self.classes = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        
        if HAS_SKLEARN:
            self._train_mock_classifier()

    def _train_mock_classifier(self):
        """
        Trains a simple Random Forest classifier on synthetic crowd safety data
        so we can run ML-based risk prediction.

        Density is expressed in real people/m^2, following Fruin's pedestrian
        Level-of-Service scale: <2 comfortable, 2-4 restricted movement, 4-6
        significantly restricted, >=6 crush-risk territory. These bands mirror
        backend/src/common/risk.util.ts so both fallback paths agree.
        """
        # Features: [people_count, density_level, capacity_utilization_ratio]
        X = []
        y = []

        # Generate synthetic historical cases
        np.random.seed(101)
        for _ in range(500):
            capacity = float(np.random.randint(100, 1000))
            count = float(np.random.randint(5, int(capacity * 1.5)))
            utilization = count / capacity
            # Density correlated with utilization but with realistic noise, capped
            # to the 0-8 ppl/m^2 range that real crowd measurements fall into.
            density = min(8.0, utilization * float(np.random.uniform(3.0, 6.0)))

            # Label based on heuristic rules
            if density >= 6.0 or utilization > 1.2:
                label = 3 # CRITICAL
            elif density >= 4.0 or utilization > 0.95:
                label = 2 # HIGH
            elif density >= 2.0 or utilization > 0.6:
                label = 1 # MEDIUM
            else:
                label = 0 # LOW

            X.append([count, density, utilization])
            y.append(label)

        self.model = RandomForestClassifier(n_estimators=10, random_state=42)
        self.model.fit(np.array(X), np.array(y))
        print("Scikit-Learn RandomForest risk classifier trained successfully.")

    def predict_risk(self, people_count, density_level, capacity):
        """
        Predicts the risk level and returns probabilities.
        `density_level` is expected in real people/m^2.
        """
        utilization = float(people_count / max(1, capacity))

        # Rule-based calculation as robust fallback / baseline (Fruin LoS bands)
        if density_level >= 6.0 or utilization >= 1.2:
            base_risk = "CRITICAL"
        elif density_level >= 4.0 or utilization >= 0.95:
            base_risk = "HIGH"
        elif density_level >= 2.0 or utilization >= 0.6:
            base_risk = "MEDIUM"
        else:
            base_risk = "LOW"

        # ML-based prediction
        ml_predicted = base_risk
        confidence = 0.90
        probabilities = {}

        if HAS_SKLEARN and self.model is not None:
            try:
                features = np.array([[people_count, density_level, utilization]])
                pred_idx = int(self.model.predict(features)[0])
                probs = self.model.predict_proba(features)[0]
                
                ml_predicted = self.classes[pred_idx]
                confidence = float(probs[pred_idx])
                
                for idx, c in enumerate(self.classes):
                    probabilities[c] = float(probs[idx])
            except Exception as e:
                print(f"Error predicting with ML model: {e}")
                
        if not probabilities:
            # Simple fallback probabilities
            idx = self.classes.index(base_risk)
            for i, c in enumerate(self.classes):
                if i == idx:
                    probabilities[c] = 0.85
                elif abs(i - idx) == 1:
                    probabilities[c] = 0.15
                else:
                    probabilities[c] = 0.0

        # The ML model may raise the alarm but never lower it. It is trained on
        # synthetic data where density tracks utilization; a ground-calibrated
        # camera breaks that correlation (a small calibrated quad reads high
        # density at low utilization), which is exactly where the model is
        # extrapolating and least trustworthy. Fruin's bands are physics, so they
        # are the floor: take whichever of the two is worse.
        final_risk = max(base_risk, ml_predicted, key=self.classes.index)

        return {
            "risk_level": final_risk,
            "confidence": confidence,
            "probabilities": probabilities,
            "utilization": utilization
        }
