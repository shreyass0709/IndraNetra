"""
Ground-plane calibration: turns pixel detections into real-world metre coordinates.

Without this, density is `people_in_frame / assumed_area`, which silently assumes
people are spread evenly across the frame. For any camera mounted at an angle that
is false -- the back of the frame covers far more ground per pixel than the front --
so the same crowd reads as a different density depending on where it stands.

A 4-point homography fixes it: mark 4 points in the image whose real ground positions
you know (barrier corners, gate posts, a marked square), and every detection's foot
point projects to true (x, y) metres.

Two things then fall out for free:
  - coverage area is *measured* (the calibration quad's real area), not assumed
  - density becomes local (people within a radius of each person), which is what
    actually crushes people. A venue averaging 1.2 ppl/m^2 can hold 7 at one gate,
    and the average will report LOW while that gate kills someone.
"""

import json
import math

import cv2
import numpy as np


def _shoelace_area(pts):
    """Polygon area. Sign-agnostic, so point winding order doesn't matter."""
    x, y = pts[:, 0], pts[:, 1]
    return 0.5 * abs(float(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1))))


def _is_convex(pts):
    """
    True if the quad is convex, i.e. its points are in perimeter order.

    Catches the mis-ordered "bowtie" quad, which is the likeliest operator error
    and the most dangerous: cv2.getPerspectiveTransform accepts it happily and
    returns a homography that projects confident nonsense.
    """
    signs = []
    n = len(pts)
    for i in range(n):
        a, b, c = pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])
        if cross != 0:
            signs.append(cross > 0)
    return len(signs) > 0 and all(s == signs[0] for s in signs)


class GroundPlane:
    """
    A camera's 4-point homography from image pixels to ground metres.

    Only the calibration quad is trusted: outside it the homography extrapolates,
    and near the horizon it extrapolates to infinity. Detections whose feet land
    outside the quad are reported separately rather than counted, so a badly placed
    quad shows up as a number an operator can see instead of a silent undercount.
    """

    # Radius for local density. 1.5 m (~7 m^2 disc) resolves a gate hotspot while
    # staying wide enough that one missed detection doesn't swing the reading.
    DEFAULT_DENSITY_RADIUS_M = 1.5

    # Which percentile of per-person local density to report as this camera's peak.
    # Max chases a single noisy cluster; mean dilutes the hotspot into the empty
    # space around it and is how you end up reporting LOW during a crush.
    PEAK_PERCENTILE = 85

    def __init__(self, image_points, world_points, density_radius_m=None):
        img = np.asarray(image_points, dtype=np.float32)
        wrl = np.asarray(world_points, dtype=np.float32)

        if img.shape != (4, 2) or wrl.shape != (4, 2):
            raise ValueError("calibration needs exactly 4 image points and 4 world points")
        if not np.isfinite(img).all() or not np.isfinite(wrl).all():
            raise ValueError("calibration points contain NaN or infinity")
        if not _is_convex(img) or not _is_convex(wrl):
            raise ValueError(
                "calibration points are collinear, duplicated, or out of perimeter order; "
                "list the 4 corners going around the quad, image and world in the same order"
            )

        self.coverage_sqm = _shoelace_area(wrl)
        if self.coverage_sqm < 1.0:
            raise ValueError(f"calibration quad covers only {self.coverage_sqm:.2f} m^2")

        radius = float(density_radius_m or self.DEFAULT_DENSITY_RADIUS_M)
        if radius <= 0:
            raise ValueError("densityRadiusM must be positive")

        self.radius_m = radius
        self.disc_sqm = math.pi * radius**2
        self.matrix = cv2.getPerspectiveTransform(img, wrl)
        self.world_quad = wrl.reshape(-1, 1, 2)

    @classmethod
    def from_json(cls, raw, frame_shape=None):
        """
        Build from a Camera.calibration payload. Returns None when uncalibrated.

        Raises ValueError when the payload is present but unusable -- a broken
        calibration must be visible, never silently downgraded to a guess.

        `imageWidth`/`imageHeight` record the resolution the points were marked at.
        Pass the live frame's shape and the points are rescaled to match, so
        downscaling for inference (or a camera that changes resolution) can't
        quietly slide the whole homography off the ground.
        """
        if not raw:
            return None
        obj = json.loads(raw) if isinstance(raw, str) else raw
        if not obj:
            return None
        try:
            image_points = np.asarray(obj["imagePoints"], dtype=np.float32)
            world_points = obj["worldPoints"]
        except (KeyError, TypeError) as e:
            raise ValueError("calibration needs imagePoints and worldPoints") from e

        ref_w, ref_h = obj.get("imageWidth"), obj.get("imageHeight")
        if frame_shape is not None and ref_w and ref_h:
            h, w = frame_shape[:2]
            image_points = image_points * np.array(
                [w / float(ref_w), h / float(ref_h)], dtype=np.float32
            )

        return cls(image_points, world_points, obj.get("densityRadiusM"))

    def project(self, image_pts):
        """Image pixels -> ground metres. Input (N,2), output (N,2)."""
        pts = np.asarray(image_pts, dtype=np.float32).reshape(-1, 1, 2)
        return cv2.perspectiveTransform(pts, self.matrix).reshape(-1, 2)

    def contains(self, world_pts):
        """Boolean mask: which ground points fall inside the calibrated quad."""
        return np.array(
            [
                cv2.pointPolygonTest(self.world_quad, (float(x), float(y)), False) >= 0
                for x, y in world_pts
            ],
            dtype=bool,
        )

    def local_densities(self, world_pts):
        """
        Per-person local density in ppl/m^2: neighbours within radius (self included)
        over the disc area. This is the number Fruin's bands are actually defined on.
        """
        n = len(world_pts)
        if n == 0:
            return np.zeros(0)
        # ponytail: O(n^2) pairwise scan, fine to ~2k people in one frame.
        # Swap in scipy.spatial.cKDTree if a single camera ever sees more.
        deltas = world_pts[:, None, :] - world_pts[None, :, :]
        dists = np.linalg.norm(deltas, axis=-1)
        return (dists <= self.radius_m).sum(axis=1) / self.disc_sqm

    def analyze(self, detections):
        """
        Project detections to the ground and measure real density.

        Uses each box's foot point (bottom-centre), where the person meets the
        ground -- the box centre floats at chest height and projects metres away.
        """
        empty = {
            "people_count": 0,
            "density_peak": 0.0,
            "density_mean": 0.0,
            "coverage_sqm": round(self.coverage_sqm, 1),
            "outside_quad": 0,
            "world_points": [],
        }
        if not detections:
            return empty

        feet = np.array(
            [[(d["box"][0] + d["box"][2]) / 2.0, d["box"][3]] for d in detections],
            dtype=np.float32,
        )
        world = self.project(feet)

        # Points behind the camera plane come back as inf/NaN; drop before testing.
        finite = np.isfinite(world).all(axis=1)
        inside = np.zeros(len(world), dtype=bool)
        if finite.any():
            inside[finite] = self.contains(world[finite])

        world_in = world[inside]
        count = len(world_in)
        if count == 0:
            return {**empty, "outside_quad": int((~inside).sum())}

        densities = self.local_densities(world_in)
        return {
            "people_count": count,
            "density_peak": round(float(np.percentile(densities, self.PEAK_PERCENTILE)), 2),
            "density_mean": round(count / self.coverage_sqm, 2),
            "coverage_sqm": round(self.coverage_sqm, 1),
            "outside_quad": int((~inside).sum()),
            "world_points": [[round(float(x), 2), round(float(y), 2)] for x, y in world_in],
        }


def _box_at(x, y, w=20, h=40):
    """A detection box whose foot point is exactly (x, y)."""
    return {"box": [x - w / 2, y - h, x + w / 2, y], "confidence": 0.9}


def _demo():
    # A camera looking obliquely at a 10x10 m square: the near edge fills the
    # frame width, the far edge is squeezed into the middle.
    image_quad = [[100, 700], [1180, 700], [800, 300], [480, 300]]
    world_quad = [[0, 0], [10, 0], [10, 10], [0, 10]]
    gp = GroundPlane(image_quad, world_quad)

    assert abs(gp.coverage_sqm - 100.0) < 0.01, gp.coverage_sqm

    # Corners project back to the world corners they were calibrated against.
    corners = gp.project(image_quad)
    assert np.allclose(corners, world_quad, atol=0.01), corners

    # The point of the whole exercise: equal pixel gaps are NOT equal ground gaps.
    # 100 px apart near the camera is a much shorter walk than 100 px apart far away.
    near = gp.project([[590, 690], [690, 690]])
    far = gp.project([[590, 310], [690, 310]])
    near_m = np.linalg.norm(near[0] - near[1])
    far_m = np.linalg.norm(far[0] - far[1])
    assert far_m > near_m * 2, f"perspective not applied: near={near_m:.2f}m far={far_m:.2f}m"

    # Uniform 10x10 grid of 100 people over 100 m^2 -> mean density 1.0/m^2.
    grid = []
    for wx in np.linspace(0.5, 9.5, 10):
        for wy in np.linspace(0.5, 9.5, 10):
            px = cv2.perspectiveTransform(
                np.array([[[wx, wy]]], dtype=np.float32), np.linalg.inv(gp.matrix)
            ).reshape(2)
            grid.append(_box_at(float(px[0]), float(px[1])))
    spread = gp.analyze(grid)
    assert spread["people_count"] == 100, spread["people_count"]
    assert abs(spread["density_mean"] - 1.0) < 0.01, spread["density_mean"]

    # Same 100 people, all crushed into one corner. The venue-wide MEAN is unchanged
    # -- this is exactly the blind spot that makes averaged density useless -- but the
    # local peak jumps into Fruin's crush band.
    clustered = []
    rng = np.random.default_rng(7)
    for _ in range(100):
        wx, wy = rng.uniform(0.5, 3.0), rng.uniform(0.5, 3.0)
        px = cv2.perspectiveTransform(
            np.array([[[wx, wy]]], dtype=np.float32), np.linalg.inv(gp.matrix)
        ).reshape(2)
        clustered.append(_box_at(float(px[0]), float(px[1])))
    crush = gp.analyze(clustered)
    assert crush["density_mean"] == spread["density_mean"], "mean should be blind to clustering"
    assert crush["density_peak"] > 6.0, f"crush not detected: peak={crush['density_peak']}"
    assert crush["density_peak"] > spread["density_peak"] * 3

    # Feet outside the calibrated quad are reported, not counted.
    outside = gp.analyze([_box_at(640, 700), _box_at(5, 60)])
    assert outside["people_count"] == 1, outside
    assert outside["outside_quad"] == 1, outside

    # A mis-ordered (bowtie) quad must be rejected, not silently trusted.
    for bad in ([[0, 0], [10, 10], [10, 0], [0, 10]], [[0, 0], [1, 1], [2, 2], [3, 3]]):
        try:
            GroundPlane(image_quad, bad)
            raise AssertionError(f"accepted a degenerate world quad: {bad}")
        except ValueError:
            pass

    assert GroundPlane.from_json(None) is None
    assert GroundPlane.from_json('{"imagePoints": %s, "worldPoints": %s}' % (image_quad, world_quad))

    # Points marked on a 1280x720 frame must still land on the same ground when the
    # frame is downscaled for inference -- otherwise every density silently drifts.
    payload = {
        "imagePoints": image_quad,
        "worldPoints": world_quad,
        "imageWidth": 1280,
        "imageHeight": 720,
    }
    half = GroundPlane.from_json(payload, frame_shape=(360, 640))
    assert abs(half.coverage_sqm - 100.0) < 0.01, half.coverage_sqm
    # Same person, frame at half scale -> same ground position.
    full_pos = gp.project([[640, 700]])[0]
    half_pos = half.project([[320, 350]])[0]
    assert np.allclose(full_pos, half_pos, atol=0.05), (full_pos, half_pos)

    print("ground.py self-check passed")


if __name__ == "__main__":
    _demo()
