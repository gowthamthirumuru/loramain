#!/usr/bin/env python3
"""
LoRa Communication Diagnostic Tool
Run this on any Raspberry Pi to test LoRa hardware
"""
import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def check_serial_port():
    """Check if serial port exists"""
    ports = ['/dev/ttyS0', '/dev/ttyAMA0', '/dev/serial0']
    available = []
    for port in ports:
        if os.path.exists(port):
            available.append(port)
    return available

def check_gpio():
    """Check if GPIO is accessible"""
    try:
        import RPi.GPIO as GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)
        GPIO.setup(22, GPIO.OUT)
        GPIO.setup(27, GPIO.OUT)
        GPIO.cleanup()
        return True, "GPIO OK"
    except Exception as e:
        return False, str(e)

def test_lora_send():
    """Test sending a LoRa packet"""
    try:
        from src.drivers.sx126x import sx126x
        from config.settings import SERIAL_PORT, LORA_SETTINGS
        
        freq = LORA_SETTINGS.get("FREQUENCY", 865)
        print(f"[TEST] Initializing LoRa on {SERIAL_PORT}, freq={freq}MHz...")
        
        node = sx126x(serial_num=SERIAL_PORT, freq=freq, addr=99, power=22, rssi=True)
        print("[TEST] LoRa initialized successfully!")
        
        print("[TEST] Sending test packet...")
        node.send("TEST:DIAGNOSTIC")
        print("[TEST] Packet sent!")
        
        return True, "Send test passed"
    except Exception as e:
        return False, str(e)

def test_lora_receive(duration=10):
    """Test receiving LoRa packets for a duration"""
    try:
        from src.drivers.sx126x import sx126x
        from config.settings import SERIAL_PORT, LORA_SETTINGS
        
        freq = LORA_SETTINGS.get("FREQUENCY", 865)
        print(f"[TEST] Listening for {duration} seconds on freq={freq}MHz...")
        
        node = sx126x(serial_num=SERIAL_PORT, freq=freq, addr=0, power=22, rssi=True)
        
        packets_received = 0
        start = time.time()
        
        while time.time() - start < duration:
            msg, rssi = node.receive()
            if msg:
                packets_received += 1
                print(f"[RX #{packets_received}] Message: '{msg}' | RSSI: {rssi} dBm")
            time.sleep(0.1)
        
        return packets_received > 0, f"Received {packets_received} packets"
    except Exception as e:
        return False, str(e)

def run_diagnostics():
    print("="*60)
    print("  LoRa Communication Diagnostic Tool")
    print("="*60)
    
    # Test 1: Serial Ports
    print("\n[1] Checking Serial Ports...")
    ports = check_serial_port()
    if ports:
        print(f"    ✅ Available: {ports}")
    else:
        print("    ❌ No serial ports found!")
        print("    FIX: Enable serial in raspi-config")
    
    # Test 2: GPIO
    print("\n[2] Checking GPIO Access...")
    ok, msg = check_gpio()
    if ok:
        print(f"    ✅ {msg}")
    else:
        print(f"    ❌ GPIO Error: {msg}")
        print("    FIX: Run with sudo or add user to gpio group")
    
    # Test 3: LoRa Module
    print("\n[3] Testing LoRa Module...")
    ok, msg = test_lora_send()
    if ok:
        print(f"    ✅ {msg}")
    else:
        print(f"    ❌ LoRa Error: {msg}")
        print("    FIX: Check LoRa HAT connections")
    
    print("\n" + "="*60)
    print("  DIAGNOSTIC COMPLETE")
    print("="*60)

def listen_mode():
    """Just listen and print what we receive"""
    print("="*60)
    print("  LoRa Listener Mode (Press Ctrl+C to stop)")
    print("="*60)
    test_lora_receive(duration=300)  # 5 minutes

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--listen":
        listen_mode()
    else:
        run_diagnostics()
