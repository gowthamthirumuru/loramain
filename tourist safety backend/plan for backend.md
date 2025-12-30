# 🧠 LoRa-Based Tourist Safety System — Backend Documentation

## 📌 Overview

This backend powers a **LoRa-based positioning & emergency alert system** designed for tourists visiting remote areas such as forests, mountains, and protected heritage sites — where **cellular connectivity is unreliable or completely unavailable**.

Tourist wearable/handheld devices communicate via **LoRa nodes**, and the **gateway sends computed GPS coordinates to this backend**. The backend then:

- Stores location updates  
- Tracks tourist safety status  
- Handles SOS alerts  
- Streams live location data to an authority dashboard  
- Supports a tourist app for trip & safety monitoring  

This system is built to **assist rescue teams**, improve response time, and ensure **life-saving visibility** during emergencies.

---

## 🎯 Core Backend Objectives

1. Receive real-time coordinates from the LoRa gateway  
2. Save & manage tourist data securely  
3. Maintain trip association & activity history  
4. Detect & escalate SOS alerts instantly  
5. Push live updates to dashboards & mobile apps  
6. Remain lightweight, stable & scalable  

---

## 🏗 Recommended Tech Stack

| Layer | Technology |
|------|-----------|
| Runtime | **Node.js** |
| Framework | **Express.js** |
| Database | **MongoDB (Atlas recommended)** |
| Real-time | **Socket.IO (WebSockets)** |
| Device/Gateway Transport | **HTTP or MQTT** |
| Auth | API Key / Token Layer |
| Deployment | Render / Railway / VPS / Docker |

This stack keeps things:
✔ Fast  
✔ Cloud-ready  
✔ Dev-friendly  

---

## 🧩 System Architecture

```
[ Tourist Device ] 
       ⬇ LoRa
[ LoRa Node ]
       ⬇
[ LoRa Gateway ]
       ⬇ HTTP / MQTT
[ Backend Server ] ———> MongoDB
       ⬇
[ Dashboard / Mobile App ]
```

The **gateway** is the only entity talking directly to the backend — clients only read.

---

## 📂 Folder Structure (Suggested)

```
backend/
 ├── src/
 │   ├── config/
 │   │   └── db.js
 │   ├── models/
 │   │   ├── Tourist.js
 │   │   ├── Location.js
 │   │   └── SOS.js
 │   ├── routes/
 │   │   ├── touristRoutes.js
 │   │   ├── locationRoutes.js
 │   │   └── sosRoutes.js
 │   ├── services/
 │   │   └── notifier.js
 │   ├── sockets/
 │   │   └── socket.js
 │   ├── middleware/
 │   │   └── auth.js
 │   ├── app.js
 │   └── server.js
 ├── package.json
 ├── .env
 └── README.md
```

---

## 🗄 Database Design

### 👤 Tourist Collection

Stores tourist identity + trip + device binding.

```
tourist_id
name
phone
device_id
emergency_contact
trip_start
trip_end
status       (active / sos / offline)
last_seen
```

---

### 📍 Location Logs

Every update from gateway is stored here.

```
device_id
tourist_id
latitude
longitude
rssi
timestamp
sos_flag
```

---

### 🚨 SOS Alerts

```
sos_id
device_id
tourist_id
time
status (active / resolved)
```

---

## 🌐 API Design

Base path:

```
/api
```

---

### 1️⃣ Register Tourist

**POST** `/api/tourist/register`

Request:
```json
{
  "name": "Rahul",
  "phone": "9999999999",
  "device_id": "DEV123",
  "emergency_contact": "8888888888",
  "trip_start": "2025-01-01",
  "trip_end": "2025-01-05"
}
```

---

### 2️⃣ Update Location

**POST** `/api/location/update`

Request:
```json
{
  "device_id": "DEV123",
  "lat": 11.002,
  "lng": 76.952,
  "rssi": -87,
  "timestamp": "2025-01-29T10:00:00Z",
  "sos": false
}
```

Logic:
- lookup tourist  
- save location  
- update last_seen  
- broadcast update  
- if sos=true → create alert  

---

### 3️⃣ Get Location History

**GET** `/api/location/{touristId}`

---

### 4️⃣ Active SOS Alerts

**GET** `/api/sos/active`

---

### 5️⃣ Resolve SOS

**POST** `/api/sos/resolve`

Request:
```json
{
  "sos_id": "SOS778"
}
```

---

## ⚡ Real-Time Layer

Socket events:
```
location_update
sos_alert
```

---

## 🛡 Security (Phase-1)

- API key for gateway  
- Admin token for dashboard  
- Input validation  

---

## 📡 Data Validation Strategy

- reject stale timestamps  
- ensure device exists  
- fallback to last safe location  
- store error radius  

---

## 🧪 Testing Plan

Simulate:
- normal movement  
- SOS trigger  
- signal dropout  
- heavy traffic  

Measure:
- latency  
- reliability  
- alert response time  

---

## 🚨 SOS Lifecycle

1. SOS triggered  
2. Backend logs alert  
3. Tourist status updates  
4. Dashboard notified  
5. Response team acts  

---

## 📊 Monitoring

Suggested tools:
- PM2
- Winston logging
- Cloud monitoring

---

## 🚀 Deployment

Recommended:
- Render / Railway / VPS
- MongoDB Atlas
- ENV secrets

---

## 🔮 Future Enhancements

- geo-fencing
- predictive tracking
- ML-based anomaly alerts
- offline caching
- SMS auto-alerts

---

## ⚠️ Known Limitations

- RSSI accuracy varies  
- terrain interference  
- LoRa duty-cycle limits  
- gateway dependency  

---

## 🏁 Summary

This backend is the **central intelligence layer** enabling:

✔ real-time safety monitoring  
✔ emergency alerts  
✔ reliable data logging  
✔ scalable architecture  

It supports **mission-critical rescue operations** in remote areas — making tourism safer and smarter.

