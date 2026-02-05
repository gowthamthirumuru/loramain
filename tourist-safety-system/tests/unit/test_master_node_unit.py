import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

# Mock sx126x driver before importing master node
sys.modules['src.drivers.sx126x'] = MagicMock()

from src.nodes.master import MasterNode

class TestMasterNodeUnit(unittest.TestCase):
    
    def setUp(self):
        # Patch BackendClient
        self.backend_patcher = patch('src.nodes.master.BackendClient')
        self.MockBackend = self.backend_patcher.start()
        
        # Patch settings (IS_RASPBERRY_PI to False to avoid hardware init)
        self.settings_patcher = patch('src.nodes.master.IS_RASPBERRY_PI', False)
        self.settings_patcher.start()
        
        # Patch anchors
        self.anchors_patcher = patch('src.nodes.master.get_anchors', return_value={
            "MASTER": {"x": 0, "y": 0}, 
            "ANCHOR_2": {"x": 100, "y": 0},
            "ANCHOR_3": {"x": 0, "y": 100}
        })
        self.anchors_patcher.start()
        
        # Initialize node
        self.node = MasterNode()
        self.node.backend = self.MockBackend.return_value
    
    def tearDown(self):
        self.backend_patcher.stop()
        self.settings_patcher.stop()
        self.anchors_patcher.stop()
    
    def test_process_message_ping(self):
        # Test processing a PING message
        self.node.process_message("PING:DEV001", -50)
        self.assertEqual(self.node.current_device_id, "DEV001")
        self.assertEqual(self.node.current_readings["MASTER"], -50)
        self.assertFalse(self.node.is_sos)
        
    def test_process_message_sos(self):
        # Test processing an SOS message
        self.node.process_message("SOS:DEV002", -60)
        self.assertEqual(self.node.current_device_id, "DEV002")
        self.assertTrue(self.node.is_sos)

    def test_send_location_success(self):
        # Setup backend success
        self.node.backend.send_location.return_value = True
        
        # Act
        self.node.current_device_id = "DEV_TEST"
        self.node.send_data(10, 20, -70)
        
        # Assert
        self.node.backend.send_location.assert_called_once()
        self.assertEqual(self.node.successful_sends, 1)
        self.assertEqual(len(self.node.offline_buffer), 0)

    def test_send_location_failure_buffering(self):
        # Setup backend failure
        self.node.backend.send_location.return_value = False
        
        # Act
        self.node.current_device_id = "DEV_TEST"
        self.node.send_data(10, 20, -70)
        
        # Assert (1 call, 0 success count, 1 buffered)
        self.node.backend.send_location.assert_called_once()
        self.assertEqual(self.node.successful_sends, 0)
        self.assertEqual(len(self.node.offline_buffer), 1)
        self.assertEqual(self.node.offline_buffer[0]['device_id'], "DEV_TEST")

    def test_flush_buffer(self):
        # Setup buffer
        self.node.offline_buffer = [{"data": 1}, {"data": 2}]
        
        # Setup flush success (assuming send_batch_locations returns dict with processed > 0)
        self.node.backend.send_batch_locations.return_value = {"processed": 2}
        
        # Act
        self.node.flush_buffer()
        
        # Assert
        self.node.backend.send_batch_locations.assert_called_once()
        self.assertEqual(len(self.node.offline_buffer), 0)

    def test_flush_buffer_fail(self):
        # Setup buffer
        self.node.offline_buffer = [{"data": 1}]
        
        # Setup flush failure
        self.node.backend.send_batch_locations.return_value = {"processed": 0}
        
        # Act
        self.node.flush_buffer()
        
        # Assert buffer remains
        self.assertEqual(len(self.node.offline_buffer), 1)

if __name__ == '__main__':
    unittest.main()
