import sys
import os
import unittest
from unittest.mock import MagicMock, patch
from hypothesis import given, strategies as st, settings

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

# Mock sx126x driver before importing tourist node
sys.modules['src.drivers.sx126x'] = MagicMock()

from src.nodes.tourist import TouristNode

class TestTouristNodeProperty(unittest.TestCase):
    
    def setUp(self):
        # Patch settings (IS_RASPBERRY_PI to False)
        self.settings_patcher = patch('src.nodes.tourist.IS_RASPBERRY_PI', False)
        self.settings_patcher.start()
        
        self.node = TouristNode(device_id="TEST_DEV")
        # Mock the internal node object to capture sends
        self.node.node = MagicMock()

    def tearDown(self):
        self.settings_patcher.stop()

    @given(st.booleans())
    def test_message_format(self, is_sos):
        """
        Property: Messages must strictly follow "TYPE:DEVICE_ID" format.
        """
        self.node.send_data(is_sos)
        
        # Verify call
        args, _ = self.node.node.send.call_args
        sent_bytes = args[0]
        sent_msg = sent_bytes.decode()
        
        expected_type = "SOS" if is_sos else "PING"
        expected_msg = f"{expected_type}:TEST_DEV"
        
        self.assertEqual(sent_msg, expected_msg)

    @given(st.integers(min_value=1, max_value=20))
    def test_sos_test_mode_logic(self, ping_count):
        """
        Property: In test_mode, SOS should only be True for ping counts 5, 6, 7.
        """
        self.node.test_mode = True
        self.node.ping_count = ping_count
        
        status = self.node.check_sos_status()
        
        if 5 <= ping_count <= 7:
            self.assertTrue(status, f"SOS should be Active at count {ping_count}")
        else:
            self.assertFalse(status, f"SOS should be Inactive at count {ping_count}")

if __name__ == '__main__':
    unittest.main()
