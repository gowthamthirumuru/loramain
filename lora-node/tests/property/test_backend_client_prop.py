import sys
import os
import time
import unittest
import requests
from unittest.mock import MagicMock, patch
from hypothesis import given, strategies as st, settings

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from src.utils.backend_client import BackendClient

class TestBackendClientProperty(unittest.TestCase):
    
    @given(st.integers(min_value=0, max_value=5))
    @settings(max_examples=50) 
    def test_retry_logic_resilience(self, fail_count):
        """
        Property: Client should retry on failure and eventually succeed if failures < max_retries.
        If failures >= max_retries, it should return False.
        """
        client = BackendClient()
        # Speed up retries for test
        client.retry_count = 3
        
        # We patch time.sleep to avoid waiting
        with patch('time.sleep', return_value=None):
            with patch.object(client.session, 'post') as mock_post:
                # Setup side effects
                # We need a list of side effects: fail_count * [Exception] + [Success]
                side_effects = []
                for _ in range(fail_count):
                    side_effects.append(requests.exceptions.ConnectionError("Connection failed"))
                
                # Finally succeed
                mock_response = MagicMock()
                mock_response.status_code = 200
                side_effects.append(mock_response)
                
                # If side_effects runs out, it raises StopIteration, but logic shouldn't typically call more than defined unless bug.
                # To be safe for "failed >= retry_count" cases where client might call exactly retry_count times,
                # we ensure side_effects has enough errors.
                # Actually, if fail_count=3, we append 3 errors then 1 success.
                # Client calls 3 times. All 3 are errors. It stops. 4th item (success) untouched. Correct.
                
                mock_post.side_effect = side_effects
                
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
