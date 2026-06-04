<p align="center">
  <img src="https://img.shields.io/badge/Platform-Raspberry%20Pi-red?style=for-the-badge&logo=raspberrypi" alt="Platform">
  <img src="https://img.shields.io/badge/Protocol-LoRa-blueviolet?style=for-the-badge" alt="Protocol">
  <img src="https://img.shields.io/badge/Python-3.7+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

# 🛡️ LoRa Tourist Safety System

> **A real-time positioning and safety monitoring system for tourists in low-network coverage areas using LoRa technology and trilateration.**

---

## 📖 Overview

The **LoRa Tourist Safety System** is designed to track and locate tourists in remote areas where traditional cellular networks are unavailable or unreliable. Using **LoRa (Long Range)** radio communication and **trilateration algorithms**, this system can pinpoint a tourist's location within a defined area using multiple anchor nodes.

### 🎯 Key Features

- **📡 Long-Range Communication** — Utilizes SX126x LoRa modules for communication up to several kilometers
- **📍 Real-Time Positioning** — Triangulates tourist locations using RSSI-based distance estimation
- **🏔️ Works Offline** — No internet or cellular connectivity required
- **🔋 Low Power** — Designed for battery-powered wearable devices
- **🚨 SOS Capability** — Tourists can send distress signals to relay stations

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TOURIST SAFETY NETWORK                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────┐              ┌──────────┐              ┌──────────┐  │
│   │ ANCHOR 2 │              │ ANCHOR 3 │              │  MASTER  │  │
│   │  (Relay) │              │  (Relay) │              │ (ANCHOR 1)│  │
│   └────┬─────┘              └────┬─────┘              └────┬─────┘  │
│        │                         │                         │        │
│        │         LoRa            │        LoRa             │        │
│        │     Communication       │    Communication        │        │
│        │                         │                         │        │
│        │         ┌───────┐       │                         │        │
│        └─────────┤TOURIST├───────┴─────────────────────────┘        │
│                  │(Sender)│                                         │
│                  └───────┘                                          │
│                                                                     │
│  Flow: Tourist → Ping → All Anchors → RSSI Reports → Master        │
│        Master → Trilateration → Tourist Position (X, Y)             │
└─────────────────────────────────────────────────────────────────────┘
```

### Node Types

| Node Type | Role | Description |
|-----------|------|-------------|
| **Tourist** | Sender | Wearable device carried by tourists. Periodically broadcasts ping signals. |
| **Relay** | Receiver/Forwarder | Stationary anchor points that receive tourist pings and report RSSI to Master. |
| **Master** | Central Hub | Collects all RSSI readings and performs trilateration to calculate position. |

---

## 📂 Project Structure

```
tourist-safety-system/
│
├── main.py                     # Entry point - CLI for running different nodes
│
├── config/
│   ├── settings.py             # LoRa & environment configuration
│   └── anchors.json            # Anchor node positions (coordinates)
│
├── src/
│   ├── drivers/
│   │   └── sx126x.py           # SX126x LoRa HAT driver (RPi compatible)
│   │
│   ├── nodes/
│   │   ├── tourist.py          # Tourist node implementation
│   │   ├── relay.py            # Relay/Anchor node implementation
│   │   └── master.py           # Master node with trilateration logic
│   │
│   └── utils/
│       ├── math_helper.py      # RSSI-to-distance & trilateration algorithms
│       └── logger.py           # Logging utilities
│
├── tests/                      # Unit tests
├── logs/                       # Log files
└── README.md                   # This file
```

---

## 🔧 Hardware Requirements

### Per Node (Raspberry Pi Setup)

| Component | Specification | Quantity |
|-----------|---------------|----------|
| **Raspberry Pi** | Model 4B / 3B+ | 1 |
| **LoRa HAT** | SX126x (E22-900T22S or E22-400T22S) | 1 |
| **Antenna** | 868MHz / 915MHz (region-specific) | 1 |
| **Power Supply** | 5V 3A USB-C / Battery Pack | 1 |
| **MicroSD Card** | 16GB+ Class 10 | 1 |

### Minimum Deployment

- **1x Master Node** (Central hub with display/server)
- **2x Relay Nodes** (Anchor points for triangulation)
- **1x Tourist Device** (Can be multiple)

---

## ⚙️ Configuration

### LoRa Settings (`config/settings.py`)

```python
LORA_SETTINGS = {
    "FREQUENCY": 868,        # MHz (868 EU / 915 US / 433 Asia)
    "TX_POWER": 22,          # dBm (Max power)
    "BANDWIDTH": 125.0,      # kHz
    "SPREADING_FACTOR": 9,   # Higher = More Range
    "CODING_RATE": 5         # 4/5 error correction
}
```

### Calibration Constants

```python
ENV_FACTOR_N = 3.0    # Path loss exponent (2.0=open, 3.0=urban/trees)
RSSI_AT_1M = -45      # Calibrated RSSI at 1 meter distance
```

### Anchor Positions (`config/anchors.json`)

```json
{
    "MASTER": {"x": 0, "y": 0},
    "ANCHOR_2": {"x": 100, "y": 0},
    "ANCHOR_3": {"x": 50, "y": 86.6}
}
```

> ⚠️ **Note:** Coordinates are in meters. Adjust based on your actual anchor placements.

---

## 🚀 Installation

### Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python dependencies
sudo apt install python3-pip python3-serial -y

# Enable serial port
sudo raspi-config
# Navigate to: Interface Options → Serial Port → Disable login shell, Enable hardware
```

### Clone & Setup

```bash
# Clone the repository
git clone https://github.com/your-username/tourist-safety-system.git
cd tourist-safety-system

# Install Python dependencies
pip3 install numpy RPi.GPIO pyserial
```

### Pin Configuration

| LoRa HAT Pin | Raspberry Pi GPIO |
|--------------|-------------------|
| M0 | GPIO 22 |
| M1 | GPIO 27 |
| TX | GPIO 14 (UART TXD) |
| RX | GPIO 15 (UART RXD) |

---

## 🎮 Usage

### Running a Tourist Node

```bash
python3 main.py --mode tourist
```

### Running a Relay Node

```bash
python3 main.py --mode relay --id ANCHOR_2
```

### Running the Master Node

```bash
python3 main.py --mode master
```

### Quick Test (Simulation Mode)

```bash
# Run the math engine test on a Windows/Linux laptop
python3 src/utils/math_helper.py
```

---

## 📊 How It Works

### 1. Signal Broadcasting

The **Tourist** node periodically broadcasts a ping message:

```
Message Format: "ID:100,SOS"
Interval: Every 2 seconds
```

### 2. RSSI Collection

Each **Relay** node receives the ping and measures the **RSSI** (Received Signal Strength Indicator):

```
RSSI Example: -65 dBm
```

### 3. Distance Estimation

The system converts RSSI to distance using the **Log-Distance Path Loss Model**:

```
Distance = 10 ^ ((RSSI_at_1m - RSSI) / (10 × N))
```

Where:
- `RSSI_at_1m` = Calibrated signal strength at 1 meter (-45 dBm default)
- `N` = Environmental path loss exponent (2.0 - 4.0)

### 4. Trilateration

With distances from 3+ anchors, the **Master** node calculates the tourist's position using **geometric trilateration**:

```
┌───────────────────────────────────────┐
│       d1           d2                 │
│    (MASTER)●─────────●(ANCHOR_2)      │
│         ╲         ╱                   │
│          ╲  ●    ╱  d3                │
│           ╲│   ╱                      │
│            │  ╱                       │
│         TOURIST                       │
│            ●                          │
│          (ANCHOR_3)                   │
└───────────────────────────────────────┘
```

---

## 📈 Performance Specifications

| Metric | Value |
|--------|-------|
| **Communication Range** | Up to 5 km (line of sight) |
| **Position Accuracy** | ±5-15 meters (environment dependent) |
| **Update Rate** | 1 position update every 2-3 seconds |
| **Power Consumption** | ~1W per node |
| **Operating Frequency** | 433/868/915 MHz (regional) |

---

## 🛠️ Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **"Setting fail" on startup** | Check UART enabled in `raspi-config`, verify wiring |
| **No messages received** | Ensure all nodes use same frequency, check antenna connection |
| **Trilateration fails** | Verify anchor positions aren't collinear, calibrate RSSI_AT_1M |
| **Position inaccurate** | Adjust `ENV_FACTOR_N` for your environment, re-calibrate |

### Debug Mode

Enable debug output by checking the console for:
```
[DEBUG] Raw RX: <message> | RSSI: <value>
[Status] Have readings: ['MASTER', 'ANCHOR_2'] (2/3)
```

---

## 🔮 Future Enhancements

- [ ] Web dashboard for real-time visualization
- [ ] GPS integration for outdoor calibration
- [ ] Support for more than 3 anchors (weighted averaging)
- [ ] Battery monitoring and alerts
- [ ] Mesh networking for extended range
- [ ] Mobile app for tourist devices

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Project Team** — Initial development and implementation

---

## 🙏 Acknowledgments

- [Waveshare](https://www.waveshare.com/) for SX126x LoRa HAT documentation
- Raspberry Pi Foundation
- Open-source community contributors

---

<p align="center">
  <strong>Built with ❤️ for tourist safety in remote areas</strong>
</p>
