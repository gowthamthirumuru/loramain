import sys
import os
import unittest
from unittest.mock import MagicMock, patch
from hypothesis import given, strategies as st, settings

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

# Mock sx126x driver before importing master node
sys.modules['src.drivers.sx126x'] = MagicMock()

from src.nodes.master import MasterNode
from src.utils.math_helper import MathEngine

class TestMasterNodeProperty(unittest.TestCase):
    
    def setUp(self):
        # Patch BackendClient
        self.backend_patcher = patch('src.nodes.master.BackendClient')
        self.MockBackend = self.backend_patcher.start()
        
        # Patch settings
        self.settings_patcher = patch('src.nodes.master.IS_RASPBERRY_PI', False)
        self.settings_patcher.start()
        
        # Patch anchors
        self.anchors_patcher = patch('src.nodes.master.get_anchors', return_value={
            "MASTER": {"x": 0, "y": 0}, 
            "ANCHOR_2": {"x": 100, "y": 0},
            "ANCHOR_3": {"x": 0, "y": 100}
        })
        self.anchors_patcher.start()
        
        self.node = MasterNode()
        self.node.backend = self.MockBackend.return_value
        
        # Mock backend batch response to always succeed
        self.node.backend.send_batch_locations.return_value = {"processed": 100}

    def tearDown(self):
        self.backend_patcher.stop()
        self.settings_patcher.stop()
        self.anchors_patcher.stop()

    @given(st.lists(st.integers(min_value=-90, max_value=-20), min_size=3, max_size=3))
    def test_location_flow_integrity(self, rssi_values):
        """
        Property: Given 3 valid RSSI readings, the node should attempt to trilaterate 
        and send data (either successful calc or fail, but flow should hold).
        """
        # Reset
        self.node.current_readings = {}
        self.node.backend.send_location.reset_mock()
        
        # Simulate receiving 3 readings
        anchors = ["MASTER", "ANCHOR_2", "ANCHOR_3"]
        for i, val in enumerate(rssi_values):
            self.node.current_readings[anchors[i]] = val
            
        self.node.current_device_id = "DEV_PROP"
        
        # Act
        self.node.perform_trilateration()
        
        # Assert
        # If trilateration returned a result, send_location must have been called
        # We can't easily know if trilateration succeeded without duplicating math logic,
        # but we can check internal consistency.
        
        # Mock MathEngine.trilaterate to always succeed for this test to verify flow
        with patch('src.utils.math_helper.MathEngine.trilaterate', return_value=(50, 50)):
             # Re-run with mocked math to ensure we enter the 'send' block
             self.node.current_readings = { anchors[i]: rssi_values[i] for i in range(3) }
             self.node.current_device_id = "DEV_PROP"
             self.node.perform_trilateration()
             
             self.node.backend.send_location.assert_called()

    @given(st.lists(st.booleans(), min_size=1, max_size=20))
    def test_offline_caching_logic(self, network_states):
        """
        Property: Data should be buffered when network is False, and flushed when True.
        """
        self.node.offline_buffer = []
        self.node.successful_sends = 0
        expected_buffer_count = 0
        
        for is_online in network_states:
            # Setup network state
            self.node.backend.send_location.return_value = is_online
            
            # Send a data point
            self.node.current_device_id = "DEV_NET"
            self.node.send_data(10, 10, -50)
            
            if is_online:
                # Should have sent successfully AND tried to flush
                # If flush happened, buffer should be empty (due to our mock batch response)
                expected_buffer_count = 0
            else:
                # Should have buffered
                expected_buffer_count += 1
                # Cap at buffer limit (100 in code)
                if expected_buffer_count > 100:
                    expected_buffer_count = 100
            
            self.assertEqual(len(self.node.offline_buffer), expected_buffer_count)

if __name__ == '__main__':
    unittest.main()
