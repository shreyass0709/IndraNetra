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

        # Heuristic function (Manhattan distance)
        def heuristic(cy, cx):
            return abs(cy - end_y) + abs(cx - end_x)

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
                
                cell_cost = grid[ny][nx]
                if np.isinf(cell_cost) or cell_cost >= 1000.0:  # Obstacle
                    continue
                
                # Traversal cost = base movement step * distance multiplier * (1 + cell density cost)
                step_cost = dist_multiplier * (1.0 + cell_cost)
                tentative_g = g_score[(cy, cx)] + step_cost
                
                if (ny, nx) not in g_score or tentative_g < g_score[(ny, nx)]:
                    g_score[(ny, nx)] = tentative_g
                    f_score = tentative_g + heuristic(ny, nx)
                    heapq.heappush(open_set, (f_score, ny, nx, path + [(ny, nx)]))
                    
        return [] # No path found
