# Requirements Document

## Introduction

The Tourist Safety System Integration project aims to complete the end-to-end integration of a LoRa-based tourist safety system. The system consists of three main components: a LoRa IoT positioning system, a Node.js backend API, and a React dashboard. Currently, each component has core functionality implemented but lacks proper integration between components. This project will establish seamless data flow from LoRa devices through the backend to real-time dashboard updates, enabling comprehensive tourist tracking and emergency response capabilities.

## Glossary

- **LoRa_System**: The IoT component consisting of master, relay, and tourist nodes using SX126x LoRa modules for positioning and communication
- **Backend_API**: The Node.js Express server with PostgreSQL/Prisma database providing REST endpoints and Socket.IO real-time communication
- **Dashboard**: The React TypeScript frontend application providing real-time monitoring and emergency response interface
- **Master_Node**: The primary LoRa anchor node (Anchor 1) that performs trilateration calculations and communicates with the backend
- **Tourist_Device**: A LoRa-enabled wearable device carried by tourists that broadcasts position pings and SOS alerts
- **Trilateration**: The mathematical process of determining position using distance measurements from three known anchor points
- **SOS_Alert**: An emergency signal triggered by a tourist device indicating distress or danger
- **Device_Registration**: The process of associating a tourist device ID with a tourist profile in the backend system
- **Real_Time_Updates**: Live data synchronization between backend and dashboard using WebSocket connections
- **Coordinate_Conversion**: The transformation of local X,Y coordinates from trilateration to GPS latitude/longitude coordinates

## Requirements

### Requirement 1: LoRa to Backend Integration

**User Story:** As a system operator, I want the LoRa master node to automatically send tourist positions to the backend API, so that location data is centrally stored and available for monitoring.

#### Acceptance Criteria

1. WHEN a tourist device broadcasts a position ping, THE LoRa_System SHALL perform trilateration and send the calculated position to the Backend_API
2. WHEN sending position data to the backend, THE Master_Node SHALL include device ID, GPS coordinates, RSSI values, and timestamp
3. WHEN the backend receives position data, THE Backend_API SHALL validate the device ID exists in the system before storing the location
4. WHEN position data is successfully stored, THE Backend_API SHALL broadcast real-time updates to connected dashboard clients
5. WHEN the backend is unreachable, THE Master_Node SHALL implement retry logic with exponential backoff for up to 3 attempts

### Requirement 2: SOS Alert End-to-End Workflow

**User Story:** As an emergency responder, I want to receive immediate notifications when a tourist triggers an SOS alert, so that I can coordinate rescue operations quickly.

#### Acceptance Criteria

1. WHEN a tourist triggers an SOS alert, THE Tourist_Device SHALL broadcast an SOS message with device ID
2. WHEN an SOS message is received, THE Master_Node SHALL immediately send the alert to the Backend_API with high priority
3. WHEN an SOS alert is received by the backend, THE Backend_API SHALL create an emergency record and notify all connected dashboard clients
4. WHEN an SOS alert is created, THE Dashboard SHALL display a prominent visual and audio notification to emergency responders
5. WHEN an SOS alert is resolved, THE Backend_API SHALL update the alert status and notify dashboard clients of the resolution

### Requirement 3: Device Registration and Management

**User Story:** As a tour operator, I want to register tourist devices before trips, so that the system can track and identify tourists properly.

#### Acceptance Criteria

1. WHEN registering a new tourist, THE Backend_API SHALL require name, phone number, device ID, and emergency contact information
2. WHEN a device ID is registered, THE Backend_API SHALL ensure the device ID is unique across all active tourists
3. WHEN position data is received for an unregistered device, THE Backend_API SHALL reject the data and log the attempt
4. WHEN a tourist trip ends, THE Backend_API SHALL allow deactivation of the device while preserving historical data
5. WHEN viewing device status, THE Dashboard SHALL display registration status, last seen time, and battery level for all devices

### Requirement 4: Coordinate System Conversion

**User Story:** As a system architect, I want accurate GPS coordinate conversion from local positioning, so that tourist locations are correctly displayed on maps.

#### Acceptance Criteria

1. WHEN performing trilateration, THE Master_Node SHALL convert local X,Y coordinates to GPS latitude and longitude
2. WHEN converting coordinates, THE LoRa_System SHALL use calibrated GPS reference points for the anchor triangle
3. WHEN GPS conversion is performed, THE Master_Node SHALL account for local coordinate system orientation and scale factors
4. WHEN coordinates are sent to the backend, THE Backend_API SHALL validate that latitude and longitude values are within reasonable geographic bounds
5. WHEN displaying positions on the map, THE Dashboard SHALL accurately render tourist locations using the converted GPS coordinates

### Requirement 5: Real-Time Dashboard Integration

**User Story:** As an emergency responder, I want to see live tourist positions and status updates on the dashboard, so that I can monitor tourist safety in real-time.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE Dashboard SHALL establish a WebSocket connection to the Backend_API for real-time updates
2. WHEN a tourist position is updated, THE Backend_API SHALL broadcast the location update to all connected dashboard clients
3. WHEN receiving location updates, THE Dashboard SHALL update the map display with new tourist positions without page refresh
4. WHEN a tourist goes offline, THE Dashboard SHALL indicate the offline status and show the last known position
5. WHEN connection to the backend is lost, THE Dashboard SHALL display a connection status indicator and attempt automatic reconnection

### Requirement 6: Multi-Tourist Tracking

**User Story:** As a tour guide, I want to track multiple tourists simultaneously, so that I can ensure the safety of my entire group.

#### Acceptance Criteria

1. WHEN multiple tourist devices are active, THE LoRa_System SHALL handle concurrent position calculations for all devices
2. WHEN processing multiple tourists, THE Master_Node SHALL maintain separate tracking state for each device ID
3. WHEN storing location data, THE Backend_API SHALL efficiently handle bulk location updates from multiple devices
4. WHEN displaying multiple tourists, THE Dashboard SHALL show distinct markers for each tourist with unique identifiers
5. WHEN a tourist device has not been heard from for 5 minutes, THE Backend_API SHALL mark the tourist as potentially missing and alert responders

### Requirement 7: System Health Monitoring

**User Story:** As a system administrator, I want to monitor the health of all system components, so that I can ensure reliable operation and quickly identify issues.

#### Acceptance Criteria

1. WHEN anchor nodes are operational, THE LoRa_System SHALL report node status and connectivity to the Backend_API
2. WHEN system components fail, THE Backend_API SHALL log errors and notify administrators of critical failures
3. WHEN monitoring system health, THE Dashboard SHALL display status indicators for LoRa network, backend services, and database connectivity
4. WHEN network connectivity is restored after an outage, THE Master_Node SHALL synchronize any cached location data with the backend
5. WHEN system performance degrades, THE Backend_API SHALL implement rate limiting and load balancing to maintain service availability

### Requirement 8: Data Persistence and History

**User Story:** As a safety analyst, I want access to historical location and incident data, so that I can analyze patterns and improve safety protocols.

#### Acceptance Criteria

1. WHEN location data is received, THE Backend_API SHALL store complete location history with timestamps for all tourists
2. WHEN storing location data, THE Backend_API SHALL implement data retention policies to manage storage growth
3. WHEN querying historical data, THE Backend_API SHALL provide efficient access to location trails and incident reports
4. WHEN generating reports, THE Dashboard SHALL allow filtering and export of historical data for analysis
5. WHEN system maintenance is performed, THE Backend_API SHALL ensure data integrity and implement backup procedures

### Requirement 9: Authentication and Authorization

**User Story:** As a security administrator, I want secure access control for the dashboard and API, so that only authorized personnel can access tourist safety data.

#### Acceptance Criteria

1. WHEN accessing the dashboard, THE Dashboard SHALL require user authentication with username and password
2. WHEN authenticating users, THE Backend_API SHALL implement JWT token-based authentication with secure session management
3. WHEN API requests are made, THE Backend_API SHALL validate authentication tokens and enforce role-based access control
4. WHEN user sessions expire, THE Dashboard SHALL automatically redirect to login and clear sensitive data from memory
5. WHEN administrative functions are accessed, THE Backend_API SHALL require elevated permissions and log all administrative actions

### Requirement 10: Error Handling and Recovery

**User Story:** As a system operator, I want robust error handling and recovery mechanisms, so that the system remains operational even when individual components fail.

#### Acceptance Criteria

1. WHEN network communication fails, THE Master_Node SHALL cache location data locally and retry transmission when connectivity is restored
2. WHEN the backend database is unavailable, THE Backend_API SHALL implement graceful degradation and queue operations for later processing
3. WHEN parsing errors occur in LoRa messages, THE Master_Node SHALL log the error and continue processing other messages
4. WHEN WebSocket connections are interrupted, THE Dashboard SHALL automatically attempt reconnection with exponential backoff
5. WHEN critical system errors occur, THE Backend_API SHALL send notifications to system administrators and maintain service availability where possible