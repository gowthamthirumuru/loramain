import sys
import os
import time
import unittest
import requests
from unittest.mock import MagicMock, patch

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from src.utils.backend_client import BackendClient

class TestBackendClientUnit(unittest.TestCase):
    
    def test_retry_logic_scenarios(self):
        """
        Manually test 0 to 4 failures to simulate property test.
        """
        for fail_count in range(6):
            with self.subTest(fail_count=fail_count):
                self.verify_retry_logic(fail_count)
    
    def verify_retry_logic(self, fail_count):
        # Create a mock session
        mock_session = MagicMock()
        mock_post = mock_session.post
        
        # Setup side effects on the post method
        side_effects = []
        for _ in range(fail_count):
            side_effects.append(requests.exceptions.ConnectionError("Connection failed"))
        
        # Finally succeed
        mock_response = MagicMock()
        mock_response.status_code = 200
        side_effects.append(mock_response)
        
        mock_post.side_effect = side_effects
        
        # Initialize client with mock session
        client = BackendClient(session=mock_session)
        client.retry_count = 3
        
        print(f"Testing fail_count={fail_count} against retry_count={client.retry_count}")
        
        with patch('time.sleep', return_value=None):
            # Act
            result = client.send_location("DEV001", 10, 10, -50)
            
            # Assert
            if fail_count < client.retry_count:
                # Should succeed eventually
                self.assertTrue(result, f"Should succeed with {fail_count} failures < {client.retry_count} retries")
                self.assertEqual(mock_post.call_count, fail_count + 1)
            else:
                # Should fail after retries exhausted
                self.assertFalse(result, f"Should fail with {fail_count} failures >= {client.retry_count} retries")
                self.assertEqual(mock_post.call_count, client.retry_count)

if __name__ == '__main__':
    unittest.main()
