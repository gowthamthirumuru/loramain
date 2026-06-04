"""
Simple Logger for LoRa Tourist Safety System
Provides timestamped logging with different severity levels
"""
import datetime
import os

# Log file directory
LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../logs')

def _ensure_log_dir():
    """Create logs directory if it doesn't exist"""
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR)

def _get_timestamp():
    """Get current timestamp string"""
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def log(message, level="INFO", node_id="SYSTEM"):
    """
    Log a message with timestamp
    
    Args:
        message: The message to log
        level: Log level (INFO, WARNING, ERROR, DEBUG)
        node_id: Identifier for which node is logging
    """
    timestamp = _get_timestamp()
    log_line = f"[{timestamp}] [{level}] [{node_id}] {message}"
    
    # Print to console
    print(log_line)
    
    # Optionally write to file
    try:
        _ensure_log_dir()
        log_file = os.path.join(LOG_DIR, f"{datetime.date.today()}.log")
        with open(log_file, 'a') as f:
            f.write(log_line + "\n")
    except Exception as e:
        print(f"[WARNING] Could not write to log file: {e}")

def info(message, node_id="SYSTEM"):
    log(message, "INFO", node_id)

def warning(message, node_id="SYSTEM"):
    log(message, "WARNING", node_id)

def error(message, node_id="SYSTEM"):
    log(message, "ERROR", node_id)

def debug(message, node_id="SYSTEM"):
    log(message, "DEBUG", node_id)
