<div align="center">

# 🛡️ Tourist Safety & Tracking System

**An offline, long-range safety monitoring system for tourists in remote environments.**

[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-blue?style=for-the-badge&logo=react)](./frontend)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green?style=for-the-badge&logo=node.js)](./backend)
[![Python](https://img.shields.io/badge/Hardware-Python%20%7C%20LoRa-blueviolet?style=for-the-badge&logo=python)](./lora-node)


*Real-time localization, SOS alerts, and offline mesh networking where cellular coverage fails.*

</div>

<br />

## 📋 Table of Contents
- [Overview](#-overview)
- [Features](#-features)
- [Screenshots & Demo](#-screenshots--demo)
- [System Architecture](#-system-architecture)
- [How It Works](#-how-it-works)
- [Technologies Used](#-technologies-used)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#-usage)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📖 Overview

The **Tourist Safety System** is a complete hardware and software solution designed to ensure the safety of individuals in national parks, mountains, and remote trails. By utilizing **LoRa (Long Range)** radio technology, the system establishes an offline mesh network. Wearable hardware nodes broadcast signals to relay anchors, allowing the system to calculate the exact location of the user and instantly propagate SOS distress signals without requiring cellular internet.

---

## ✨ Features

- ** Completely Offline Tracking:** Operates entirely independently of cellular and internet networks.
- ** Real-Time Trilateration:** Calculates accurate X/Y coordinates using RSSI-based distance estimation.
- ** Instant SOS Alerts:** Immediate distress signal broadcasting with high-priority routing to the dashboard.
- ** Interactive Dashboard:** A beautiful, responsive React-based interface for park rangers to monitor all active nodes.
- ** Low Power Consumption:** Optimized hardware nodes meant to run on battery power for extended periods.

---

## 📸 Screenshots & Demo

*(Replace these placeholders with actual screenshots of your project)*

| Dashboard Map View | SOS Alert Notification |
| :---: | :---: |
| <img src="https://placehold.co/600x400/png?text=Dashboard+Map+View" alt="Dashboard Map View Placeholder" width="400"/> | <img src="https://placehold.co/600x400/png?text=SOS+Alert+Popup" alt="SOS Alert Placeholder" width="400"/> |

| Hardware Setup (Raspberry Pi + LoRa) | Mobile Responsive UI |
| :---: | :---: |
| <img src="https://placehold.co/600x400/png?text=Hardware+LoRa+Node" alt="Hardware Setup Placeholder" width="400"/> | <img src="https://placehold.co/600x400/png?text=Mobile+Dashboard+View" alt="Mobile View Placeholder" width="400"/> |

---

## 🏗️ System Architecture

This repository is built as a full-stack monorepo featuring three core components working in tandem:

<div align="center">
  <img src="https://placehold.co/800x400/png?text=Architecture+Diagram+Placeholder\n(Tourist+->+LoRa+Nodes+->+Backend+->+Dashboard)" alt="Architecture Diagram Placeholder" width="800"/>
</div>
<br/>

1. **`lora-node/` (Hardware Layer):** Raspberry Pi devices equipped with SX126x LoRa HATs. These act as wearable trackers and stationary anchor relays.
2. **`backend/` (API Layer):** A Node.js/Express server that ingests hardware data, processes trilateration algorithms, and stores records in PostgreSQL.
3. **`frontend/` (Presentation Layer):** A Vite + React application providing a real-time, interactive map and alert center for administrators.

---

## 📡 How It Works

1. **Ping Broadcasting:** The tourist's wearable node broadcasts a periodic LoRa ping containing their unique ID.
2. **Signal Reception:** Multiple stationary Anchor Nodes (relays) receive this ping and measure the RSSI (Received Signal Strength Indicator).
3. **Data Aggregation:** Anchors forward their RSSI readings to the Master Node (connected to the backend server).
4. **Trilateration:** The backend calculates the tourist's exact position using intersecting distances derived from the RSSI values.
5. **Dashboard Update:** The React frontend fetches the updated coordinates via WebSocket/Polling and visually moves the tourist's pin on the map. 

---

## 🛠️ Technologies Used

### Frontend
- React 18, Vite, TypeScript
- Tailwind CSS
- React Router DOM

### Backend
- Node.js, Express.js
- Prisma ORM
- PostgreSQL (Dockerized)

### Hardware / IoT
- Python 3.7+
- Raspberry Pi (RPi.GPIO)
- SX126x LoRa Communication Module

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/downloads/) (v3.7 or higher)
- [Docker](https://www.docker.com/) & Docker Compose (for the database)
- Git

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/tourist-safety-system.git
cd tourist-safety-system
```

**2. Setup the Database**
Start the PostgreSQL database and PGAdmin interface using Docker Compose:
```bash
docker-compose up -d
```

**3. Setup the Backend**
```bash
cd backend
npm install
# Rename .env.example to .env and configure your database URL if needed
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```
*The backend API will run on `http://localhost:3000`.*

**4. Setup the Frontend**
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The dashboard will be available at `http://localhost:5173`.*

**5. Setup the LoRa Hardware (Optional)**
For physical device testing, navigate to the `lora-node` directory. Refer to the [Hardware README](./lora-node/README.md) for detailed wiring and configuration instructions.
```bash
cd lora-node
pip install -r requirements.txt
python main.py --mode master
```

---

##  Usage

- **Simulate Data:** If you do not have physical LoRa nodes, use the backend API simulation endpoints (detailed in the backend README) to mock tourist movements and trigger SOS alerts.
- **Monitor the Map:** Open the frontend dashboard to watch simulated or real trackers move in real-time.
- **Respond to SOS:** Trigger an SOS alert to test the dashboard's warning system and response protocols.

---

## 🛣️ Roadmap

- [ ] Implement WebSockets for true real-time frontend updates.
- [ ] Add GPS integration for hybrid LoRa/GPS outdoor tracking.
- [ ] Develop a mobile application companion for tourists.
- [ ] Implement weighted average trilateration for >3 anchor nodes.
- [ ] Add battery monitoring telemetry to hardware packets.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

