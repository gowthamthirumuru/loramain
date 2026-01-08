# Tourist Safety System - Database Schema

## Overview
MongoDB database with 10 collections for comprehensive data management of the LoRa Tourist Safety System.

---

## Collections (10 Total)

### Core - Tourist Tracking

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| **tourists** | Tourist registration & status | `name`, `phone`, `device_id`, `status`, `last_location` |
| **locationlogs** | Location history trail | `device_id`, `tourist_id`, `x`, `y`, `timestamp` |
| **anchors** | LoRa network nodes | `anchor_id`, `local_position`, `gps_position`, `status` |

### Safety - Emergency Management

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| **sosalerts** | SOS alerts from LoRa devices | `tourist_id`, `device_id`, `location`, `status` |
| **alerts** | General alerts (dashboard) | `type`, `severity`, `status`, `tourist`, `assignedTeam` |
| **emergencies** | Emergency incidents | `type`, `severity`, `status`, `assignedTeam`, `responseTime` |

### Operations - Response Teams

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| **responseteams** | Response team management | `name`, `type`, `status`, `members`, `currentAssignment` |

### Communication

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| **conversations** | Communication threads | `participant`, `type`, `status`, `priority` |
| **messages** | Chat messages | `conversationId`, `sender`, `message`, `time` |

### Reporting

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| **reports** | Generated reports | `name`, `type`, `dateRange`, `status`, `data` |

---

## Data Flow

```
Tourist Device → LoRa Anchors → Master Node → Backend API → MongoDB
                                                    ↓
                              Dashboard ← Socket.IO ←
```

---

## Missing Collections (Recommended)

| Collection | Purpose | Priority |
|------------|---------|----------|
| **users** | Admin/staff authentication | 🔴 High |
| **auditlogs** | Track who changed what | 🟠 Medium |
| **notifications** | Push notification history | 🟡 Low |
| **zones** | Geofenced areas | 🟡 Low |
| **shifts** | Response team schedules | 🟡 Low |

---

## Indexes Summary

All collections have appropriate indexes:
- `tourists`: `device_id` (unique), `status`
- `locationlogs`: `{tourist_id, timestamp}`, `{device_id, timestamp}`
- `sosalerts`: `status`, `tourist_id`, `created_at`
- `anchors`: `anchor_id` (unique), `status`
- `responseteams`: `status`, `type`
