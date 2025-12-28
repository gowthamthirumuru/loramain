import math
import numpy as np
import sys
import os

# Add the project root to path so we can import config
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from config.settings import ENV_FACTOR_N, RSSI_AT_1M

class MathEngine:
    @staticmethod
    def rssi_to_distance(rssi):
        """
        Converts RSSI (dBm) to Distance (meters) using Log-Distance Path Loss Model.
        Formula: Distance = 10 ^ ((Measured_Power - RSSI) / (10 * N))
        """
        # Constrain RSSI to prevent math errors (signals stronger than -10dBm are unlikely)
        if rssi > -10: rssi = -10
        
        # Calculate
        exponent = (RSSI_AT_1M - rssi) / (10 * ENV_FACTOR_N)
        distance = 10 ** exponent
        return round(distance, 2)

    @staticmethod
    def trilaterate(anchors_data):
        """
        Calculates (x, y) based on 3 anchors and their distances.
        
        Args:
            anchors_data (list): A list of 3 dictionaries/tuples.
            Format: [{'x': 0, 'y': 0, 'r': 10.5}, {'x': 100, 'y': 0, 'r': 50.2}, ...]
            
        Returns:
            tuple: (x, y) coordinates of the tourist.
        """
        # We need exactly 3 circles for simple 2D trilateration
        if len(anchors_data) < 3:
            return None

        # Extract data for easier reading
        x1, y1 = anchors_data[0]['x'], anchors_data[0]['y']
        r1     = anchors_data[0]['r']
        
        x2, y2 = anchors_data[1]['x'], anchors_data[1]['y']
        r2     = anchors_data[1]['r']
        
        x3, y3 = anchors_data[2]['x'], anchors_data[2]['y']
        r3     = anchors_data[2]['r']

        # --- The Math (Linear Algebra approach) ---
        # We solve the intersection of circle equations using matrices: Ax = B
        
        A = -2 * x1 + 2 * x2
        B = -2 * y1 + 2 * y2
        C = r1**2 - r2**2 - x1**2 + x2**2 - y1**2 + y2**2
        
        D = -2 * x2 + 2 * x3
        E = -2 * y2 + 2 * y3
        F = r2**2 - r3**2 - x2**2 + x3**2 - y2**2 + y3**2

        try:
            # Cramer's Rule / Determinant solution
            x = (C * E - F * B) / (E * A - B * D)
            y = (C * D - A * F) / (B * D - A * E)
            return round(x, 2), round(y, 2)
        except ZeroDivisionError:
            # This happens if anchors are in a straight line (collinear)
            print("ERROR: Anchors are collinear! Cannot trilaterate.")
            return None


# Alias for backward compatibility
def calculate_distance(rssi):
    """Alias for MathEngine.rssi_to_distance()"""
    return MathEngine.rssi_to_distance(rssi)


# --- TEST BLOCK (Runs only on your Laptop) ---
if __name__ == "__main__":
    print("--- Running Math Simulation on Windows ---")
    
    # 1. Test RSSI to Distance
    test_rssi = -60
    dist = MathEngine.rssi_to_distance(test_rssi)
    print(f"Test 1: Signal Strength {test_rssi}dBm = {dist} meters (Expected ~3.16m with N=3)")

    # 2. Test Location Calculation
    # Let's pretend the tourist is at (50, 28)
    # We simulate perfect distances from our standard anchors
    simulated_data = [
        {'x': 0,   'y': 0,    'r': 57.3}, # Distance from (0,0) to (50,28)
        {'x': 100, 'y': 0,    'r': 57.3}, # Distance from (100,0) to (50,28)
        {'x': 50,  'y': 86.6, 'r': 58.6}  # Distance from (50,86.6) to (50,28)
    ]
    
    location = MathEngine.trilaterate(simulated_data)
    print(f"Test 2: Calculated Location: {location}")
    print("If Test 2 is close to (50.0, 28.0), the math engine works!")