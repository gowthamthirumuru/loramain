
import unittest
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from src.utils.math_helper import MathEngine

class TestMathEngine(unittest.TestCase):

    def test_default_reference(self):
        """Test conversion using default settings.py reference"""
        # Note: This assumes default is lat=11.0168, lng=76.9558 (from settings.py)
        # We won't test exact values here as settings might change, but we ensure it runs
        lat, lng = MathEngine.convert_to_gps(0, 0)
        self.assertIsInstance(lat, float)
        self.assertIsInstance(lng, float)

    def test_dynamic_reference(self):
        """Test conversion using a custom dynamic reference point"""
        custom_ref = {'lat': 20.0, 'lng': 80.0}
        
        # Test 0,0 (should be exactly the reference)
        lat, lng = MathEngine.convert_to_gps(0, 0, reference_point=custom_ref)
        self.assertAlmostEqual(lat, 20.0, places=5)
        self.assertAlmostEqual(lng, 80.0, places=5)
        
        # Test 1000m North (approx 0.009 degrees lat)
        # 1 deg lat ~ 111km -> 1km ~ 0.009 deg
        lat, lng = MathEngine.convert_to_gps(0, 1000, reference_point=custom_ref)
        self.assertGreater(lat, 20.0)
        self.assertAlmostEqual(lng, 80.0, places=4)
        
        # Test 1000m East
        lat, lng = MathEngine.convert_to_gps(1000, 0, reference_point=custom_ref)
        self.assertAlmostEqual(lat, 20.0, places=4)
        self.assertGreater(lng, 80.0)

if __name__ == '__main__':
    unittest.main()
