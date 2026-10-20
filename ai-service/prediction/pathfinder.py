import heapq
import numpy as np

class PathFinder:
    def __init__(self, rows=20, cols=20):
        self.rows = rows
        self.cols = cols

    def find_route(self, grid_costs, start, end):
        """
        Runs A* pathfinding on a 2D cost grid.
        grid_costs: 2D numpy array or list of lists, where value is traversal cost (e.g. 1.0 = clear, 10.0 = crowded, inf = wall)
        start: tuple (y, x)
        end: tuple (y, x)
        Returns:
            list of tuples (y, x) representing path, or empty list if no path found
        """
        grid = np.array(grid_costs)
        h, w = grid.shape
        
        # Priority queue stores tuples of (f_score, y, x, path)
        # f_score = g_score + h_score
        start_y, start_x = start
        end_y, end_x = end
        
        # Check bounds
        if not (0 <= start_y < h and 0 <= start_x < w and 0 <= end_y < h and 0 <= end_x < w):
            return []

        # Octile distance: the cheapest possible walk on an 8-connected grid where
        # every step costs at least its length. Manhattan over-estimates diagonal
        # moves, which makes A* return longer-than-necessary evacuation routes.
        def heuristic(cy, cx):
            dy, dx = abs(cy - end_y), abs(cx - end_x)
            return max(dy, dx) + (1.414 - 1.0) * min(dy, dx)

        def blocked(y, x):
            c = grid[y][x]
            return np.isinf(c) or c >= 1000.0

        # g_score[y][x] stores shortest cost found so far to reach (y, x)
        g_score = { (start_y, start_x): 0.0 }
        
        # Priority Queue elements: (f_score, y, x, path_list)
        open_set = []
        heapq.heappush(open_set, (heuristic(start_y, start_x), start_y, start_x, [start]))
        
        # Keep track of closed set
        closed_set = set()

        while open_set:
            f, cy, cx, path = heapq.heappop(open_set)
            
            if (cy, cx) == (end_y, end_x):
                return path

            if (cy, cx) in closed_set:
                continue
            closed_set.add((cy, cx))

            # Neighbors (up, down, left, right, diagonals)
            directions = [
                (-1, 0, 1.0), (1, 0, 1.0), (0, -1, 1.0), (0, 1, 1.0), # Cardinal
                (-1, -1, 1.414), (-1, 1, 1.414), (1, -1, 1.414), (1, 1, 1.414) # Diagonal
            ]
            
            for dy, dx, dist_multiplier in directions:
                ny, nx = cy + dy, cx + dx
                
                # Check boundaries
                if not (0 <= ny < h and 0 <= nx < w):
                    continue
                
                if blocked(ny, nx):  # Obstacle
                    continue
                # No squeezing diagonally between two walls (or past a wall corner).
                if dy and dx and (blocked(cy, nx) or blocked(ny, cx)):
                    continue

                # Traversal cost = base movement step * distance multiplier * (1 + cell density cost).
                # Negative costs are clamped: they would break the heuristic's lower bound.
                step_cost = dist_multiplier * (1.0 + max(0.0, float(grid[ny][nx])))
                tentative_g = g_score[(cy, cx)] + step_cost
                
                if (ny, nx) not in g_score or tentative_g < g_score[(ny, nx)]:
                    g_score[(ny, nx)] = tentative_g
                    f_score = tentative_g + heuristic(ny, nx)
                    heapq.heappush(open_set, (f_score, ny, nx, path + [(ny, nx)]))
                    
        return [] # No path found


if __name__ == "__main__":
    # Self-check: A* must match an exhaustive Dijkstra on random grids, and never
    # cut a wall corner. Run from ai-service/: python -m prediction.pathfinder
    D = [(-1, 0, 1.0), (1, 0, 1.0), (0, -1, 1.0), (0, 1, 1.0),
         (-1, -1, 1.414), (-1, 1, 1.414), (1, -1, 1.414), (1, 1, 1.414)]

    def wall(g, y, x):
        return g[y][x] >= 1000

    def cost(g, path):
        return sum((1.414 if a[0] != b[0] and a[1] != b[1] else 1.0) * (1 + g[b[0]][b[1]])
                   for a, b in zip(path, path[1:]))

    def dijkstra(g, s, e):
        h, w = g.shape
        dist, pq = {s: 0.0}, [(0.0, s)]
        while pq:
            d, (y, x) = heapq.heappop(pq)
            if (y, x) == e:
                return d
            if d > dist[(y, x)]:
                continue
            for dy, dx, m in D:
                ny, nx = y + dy, x + dx
                if not (0 <= ny < h and 0 <= nx < w) or wall(g, ny, nx):
                    continue
                if dy and dx and (wall(g, y, nx) or wall(g, ny, x)):
                    continue
                nd = d + m * (1 + g[ny][nx])
                if nd < dist.get((ny, nx), 1e18):
                    dist[(ny, nx)] = nd
                    heapq.heappush(pq, (nd, (ny, nx)))
        return None

    pf, rng = PathFinder(), np.random.default_rng(0)
    for _ in range(300):
        g = rng.choice([0, 0, 0, 2, 5, 1000], size=(20, 20)).astype(float)
        g[0][0] = g[19][19] = 0
        path, best = pf.find_route(g.tolist(), (0, 0), (19, 19)), dijkstra(g, (0, 0), (19, 19))
        assert (best is None) == (not path), "found/missed a path the exhaustive search disagrees on"
        if path:
            assert abs(cost(g, path) - best) < 1e-6, f"suboptimal route: {cost(g, path):.3f} vs {best:.3f}"
            assert not any(wall(g, y, x) for y, x in path), "route crosses a wall"
    squeeze = np.zeros((2, 2)); squeeze[0][1] = squeeze[1][0] = 1000
    assert pf.find_route(squeeze.tolist(), (0, 0), (1, 1)) == [], "cut diagonally between two walls"
    print("pathfinder self-check ok")
