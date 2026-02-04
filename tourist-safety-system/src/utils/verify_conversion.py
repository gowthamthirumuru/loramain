
import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from src.utils.backend_client import BackendClient
from config.settings import GPS_REFERENCE

class TestLocationConversion(unittest.TestCase):
    def setUp(self):
        self.client = BackendClient()
        # Mock the requests module in the client to prevent actual network calls
        self.client.base_url = "http://mock-backend"
        self.client.headers = {}

    def test_gps_conversion_at_origin(self):
        """Test converting (0,0) matches the reference point"""
        x, y = 0, 0
        lat, lng = self.client._convert_to_gps(x, y)
        
        print(f"\n[Test Origin] (0,0) -> ({lat}, {lng})")
        print(f"Reference: ({GPS_REFERENCE['lat']}, {GPS_REFERENCE['lng']})")
        
        self.assertAlmostEqual(lat, GPS_REFERENCE['lat'], places=5)
        self.assertAlmostEqual(lng, GPS_REFERENCE['lng'], places=5)

    def test_gps_conversion_offset(self):
        """Test converting a point 100m East and 100m North"""
        # Approximately 100 meters
        x, y = 100, 100
        lat, lng = self.client._convert_to_gps(x, y)
        
        print(f"[Test Offset] (100,100) -> ({lat}, {lng})")
        
        # Latitude should increase (North)
        self.assertGreater(lat, GPS_REFERENCE['lat'])
        # Longitude should increase (East)
        self.assertGreater(lng, GPS_REFERENCE['lng'])

    @patch('src.utils.backend_client.requests.post')
    def test_send_location_payload(self, mock_post):
        """Test that send_location sends the correct payload with lat/lng"""
        # Setup mock response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        # Call the method
        self.client.send_location(
            device_id="TEST_DEV",
            x=50,
            y=50,
            rssi_avg=-70,
            sos_flag=True
        )

        # check arguments
        args, kwargs = mock_post.call_args
        payload = kwargs['json']
        
        print(f"[Test Payload] Payload sent: {payload}")

        self.assertIn('lat', payload)
        self.assertIn('lng', payload)
        self.assertEqual(payload['x'], 50)
        self.assertEqual(payload['y'], 50)
        self.assertTrue(payload['sos_flag'])
        
        # Verify lat/lng are floats (not None)
        self.assertIsInstance(payload['lat'], float)
        self.assertIsInstance(payload['lng'], float)

if __name__ == '__main__':
    unittest.main()
