import cv2
import numpy as np

class HeatmapGenerator:
    def __init__(self, kernel_size=81, sigma=25):
        self.kernel_size = kernel_size
        self.sigma = sigma

    def generate_heatmap(self, frame, detections):
        """
        Generates a blended heatmap overlay on the original frame based on detections.
        Returns:
            heatmap_blended (numpy array): Blended image
            density_score (float): Average local density indicator
        """
        h, w, _ = frame.shape
        accumulated_density = np.zeros((h, w), dtype=np.float32)

        # Draw a Gaussian blob at each person's center
        for det in detections:
            cx, cy = det["center"]
            
            # Bound check
            if cx < 0 or cx >= w or cy < 0 or cy >= h:
                continue

            # Create localized Gaussian window
            x_min = max(0, cx - self.kernel_size // 2)
            y_min = max(0, cy - self.kernel_size // 2)
            x_max = min(w, cx + self.kernel_size // 2)
            y_max = min(h, cy + self.kernel_size // 2)

            # Generate grid
            y, x = np.ogrid[y_min - cy : y_max - cy, x_min - cx : x_max - cx]
            gaussian = np.exp(-(x*x + y*y) / (2 * self.sigma * self.sigma))

            # Add to main density map
            accumulated_density[y_min:y_max, x_min:x_max] += gaussian

        # Normalize the density map to [0, 255]
        if np.max(accumulated_density) > 0:
            norm_density = (accumulated_density / np.max(accumulated_density) * 255).astype(np.uint8)
        else:
            norm_density = np.zeros((h, w), dtype=np.uint8)

        # Apply OpenCV colormap (COLORMAP_JET maps 0->blue, 255->red)
        heatmap_color = cv2.applyColorMap(norm_density, cv2.COLORMAP_JET)

        # Since COLORMAP_JET starts at blue for zero intensity, we want to make the zero-density parts transparent.
        # We can mask out the blue color or blend with transparency where norm_density is low.
        mask = norm_density > 10
        blended = frame.copy()
        
        # Apply blending only where density exists
        alpha = 0.6
        mask_3d = np.repeat(mask[:, :, np.newaxis], 3, axis=2)
        blended[mask_3d] = cv2.addWeighted(frame, 1 - alpha, heatmap_color, alpha, 0)[mask_3d]

        # Calculate an overall density score
        # (Total intensity normalized by image size)
        density_score = float(np.sum(accumulated_density) / (w * h) * 100)

        return blended, density_score
