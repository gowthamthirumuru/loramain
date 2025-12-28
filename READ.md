# LoRa Tourist Safety System

A low-network region positioning system using RSSI trilateration with SX1262 LoRa HATs on Raspberry Pi.

## Hardware Requirements

- 4x Raspberry Pi (3B+ or 4)
- 4x SX1262 LoRa HAT modules (E22-900T22S or E22-400T22S)
- Power supplies for each Pi

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd loramain/tourist-safety-system

# Install dependencies
pip install -r requirements.txt
```

## Configuration

### 1. Edit Anchor Positions
Create/edit `config/anchors.json`:
```json
{
    "MASTER": {"x": 0, "y": 0},
    "ANCHOR_2": {"x": 100, "y": 0},
    "ANCHOR_3": {"x": 50, "y": 86.6}
}
```

### 2. Verify Serial Port
Check `config/settings.py`:
```python
SERIAL_PORT = "/dev/ttyS0"  # or "/dev/ttyAMA0" on some Pi models
```

### 3. Calibrate RSSI
Measure the RSSI at 1 meter distance and update in `config/settings.py`:
```python
RSSI_AT_1M = -45  # Adjust based on your measurements
```

## Running the System

### Raspberry Pi 1 (Master/ANCHOR_1):
```bash
python main.py --mode master
```

### Raspberry Pi 2 (Relay/ANCHOR_2):
```bash
python main.py --mode relay --id ANCHOR_2
```

### Raspberry Pi 3 (Relay/ANCHOR_3):
```bash
python main.py --mode relay --id ANCHOR_3
```

### Raspberry Pi 4 (Tourist Device):
```bash
python main.py --mode tourist
```

## Expected Output

**Master Node:**
```
--- STARTING MASTER NODE (ANCHOR 1) ---
[Rx] Direct Hit! RSSI: -58
[Rx] Report from ANCHOR_2: -62
[Rx] Report from ANCHOR_3: -55

--- TRIANGULATING ---
Distances: 5.62m, 8.91m, 3.16m
✅ TOURIST LOCATED AT: X=34.50, Y=22.10
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Serial port not found" | Check SERIAL_PORT in settings.py |
| "setting fail" on startup | Ensure LoRa HAT pins are connected correctly |
| No RSSI data | Verify all nodes use same frequency (865MHz) |
| Inaccurate position | Recalibrate RSSI_AT_1M and ENV_FACTOR_N |

## File Structure

```
tourist-safety-system/
├── main.py              # Entry point
├── config/
│   ├── settings.py      # Hardware & calibration config
│   └── anchors.json     # Anchor coordinates
└── src/
    ├── drivers/
    │   └── sx126x.py    # LoRa HAT driver
    ├── nodes/
    │   ├── tourist.py   # Tourist transmitter
    │   ├── relay.py     # Relay anchor
    │   └── master.py    # Master triangulator
    └── utils/
        ├── math_helper.py  # RSSI & trilateration
        └── logger.py       # Logging utility
```

## License

MIT License
