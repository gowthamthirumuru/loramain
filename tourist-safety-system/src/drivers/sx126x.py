import sys
import time

# --- ENVIRONMENT DETECTION (Windows vs Pi) ---
try:
    import RPi.GPIO as GPIO
    import serial
    IS_HARDWARE = True
except (ImportError, ModuleNotFoundError):
    IS_HARDWARE = False
    # --- MOCK CLASSES FOR WINDOWS SIMULATION ---
    class MockGPIO:
        BCM = "BCM"
        OUT = "OUT"
        LOW = 0
        HIGH = 1
        @staticmethod
        def setmode(mode): pass
        @staticmethod
        def setwarnings(flag): pass
        @staticmethod
        def setup(pin, mode): pass
        @staticmethod
        def output(pin, state): pass
        @staticmethod
        def cleanup(): pass

    class MockSerial:
        def __init__(self, port, baudrate): pass
        def flushInput(self): pass
        def write(self, data): print(f"[SIMULATION] Radio Sent: {data}")
        def inWaiting(self): return 0
        def read(self, count): return b''
        def close(self): pass

    # Assign Mocks
    GPIO = MockGPIO()
    serial = type('obj', (object,), {'Serial': MockSerial})

class SX126X:
    # Pin Definitions (From your file)
    M0 = 22
    M1 = 27
    
    # Configuration Constants
    REG_ADDH = 0x00
    REG_ADDL = 0x00
    REG_NETID = 0x00
    REG_LR_FREQ = 868 # Default Frequency
    
    # Packet Configuration (RSSI Enabled by default)
    # We use 0xC2 to save settings temporarily (RAM)
    # The crucial byte is index 9: 0x43 (Default) + 0x80 (Enable RSSI) = 0xC3
    CFG_REG = [0xC2, 0x00, 0x09, 0x00, 0x00, 0x00, 0x62, 0x00, 0x12, 0xC3, 0x00, 0x00]

    def __init__(self, serial_port="/dev/ttyS0"):
        self.is_hardware = IS_HARDWARE
        
        # 1. Setup GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)
        GPIO.setup(self.M0, GPIO.OUT)
        GPIO.setup(self.M1, GPIO.OUT)
        
        # 2. Setup Serial
        try:
            # Raspberry Pi 3/4 uses /dev/ttyS0 or /dev/ttyAMA0
            self.ser = serial.Serial("/dev/serial0", 9600, timeout=1)
            self.ser.flushInput()
        except Exception as e:
            print(f"[WARNING] Serial HW not found: {e}")
            if not IS_HARDWARE:
                self.ser = serial.Serial("COM1", 9600)

        # 3. Configure Mode (M0=0, M1=1 -> Configuration)
        GPIO.output(self.M0, GPIO.LOW)
        GPIO.output(self.M1, GPIO.HIGH)
        time.sleep(0.1)

        # 4. Apply Settings
        if IS_HARDWARE:
            self._configure()
        else:
            print("[SIMULATION] SX126x Configured (RSSI Enabled)")

        # 5. Switch to Normal Mode (M0=0, M1=0)
        GPIO.output(self.M0, GPIO.LOW)
        GPIO.output(self.M1, GPIO.LOW)
        time.sleep(0.1)
        print("SX126x Radio Ready.")

    def _configure(self):
        """ Internal method to write hex config to module """
        self.ser.write(bytes(self.CFG_REG))
        time.sleep(0.5)
        self.ser.flushInput()

    def send(self, data):
        """ Sends string data """
        # Ensure Normal Mode
        GPIO.output(self.M0, GPIO.LOW)
        GPIO.output(self.M1, GPIO.LOW)
        time.sleep(0.01) # Short delay for stability
        
        if isinstance(data, str):
            data = data.encode()
            
        self.ser.write(data)
        
    def receive(self):
        """ 
        Checks for data. 
        Returns: (data_string, rssi_int) or (None, None)
        """
        if self.is_hardware:
            # --- REAL HARDWARE LOGIC ---
            if self.ser.inWaiting() > 0:
                time.sleep(0.1) # Wait for full packet
                r_buff = self.ser.read(self.ser.inWaiting())
                
                if len(r_buff) > 1:
                    # Last byte is RSSI (because we enabled it)
                    rssi_byte = r_buff[-1]
                    rssi_val = -(256 - rssi_byte)
                    
                    try:
                        msg = r_buff[:-1].decode('utf-8', errors='ignore')
                        return msg, rssi_val
                    except:
                        return None, None
            return None, None
            
        else:
            # --- WINDOWS SIMULATION (SMARTER) ---
            # Randomly simulate hearing PINGS and REPORTS so Master can calculate
            import random
            
            # 20% chance to receive a packet per loop
            if random.random() < 0.2: 
                sim_rssi = random.randint(-90, -40) # The signal strength the anchor heard
                link_rssi = random.randint(-60, -30) # Strong signal between anchors
                
                dice = random.randint(1, 3)
                
                if dice == 1:
                    # Simulate hearing the Tourist directly
                    return "TOURIST:PING", sim_rssi
                    
                elif dice == 2:
                    # Simulate hearing a Report from Anchor 2
                    # Msg format: REPORT:ANCHOR_ID:RSSI_VAL
                    return f"REPORT:ANCHOR_2:{sim_rssi}", link_rssi
                    
                elif dice == 3:
                    # Simulate hearing a Report from Anchor 3
                    return f"REPORT:ANCHOR_3:{sim_rssi}", link_rssi
                    
            return None, None