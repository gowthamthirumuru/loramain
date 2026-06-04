import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icons
const createIcon = (color: string, size: number = 25) => L.divIcon({
    className: 'custom-marker',
    html: `<div style="
    background-color: ${color};
    width: ${size}px;
    height: ${size}px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
});

const incidentIcon = createIcon('#ef4444', 28);
const teamIcon = createIcon('#22c55e', 24);
const touristIcon = createIcon('#06b6d4', 20);

interface IncidentMarker {
    id: string;
    type: string;
    location: string;
    tourist: string;
    assignedTeam: string;
    timeElapsed: string;
    lat: number;
    lng: number;
}

interface TeamMarker {
    id: string;
    name: string;
    status: string;
    location: string;
    members: number;
    lat: number;
    lng: number;
}

interface TouristMarker {
    id: string;
    name: string;
    lat: number;
    lng: number;
    count: number;
}

interface LeafletMapProps {
    incidentMarkers: IncidentMarker[];
    teamMarkers: TeamMarker[];
    touristLocations: TouristMarker[];
    showIncidents: boolean;
    showTeams: boolean;
    showTourists: boolean;
    onDispatch: (id: string) => void;
}

export default function LeafletMap({
    incidentMarkers,
    teamMarkers,
    touristLocations,
    showIncidents,
    showTeams,
    showTourists,
    onDispatch,
}: LeafletMapProps) {
    return (
        <MapContainer
            center={[22.5, 78.9]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Incident Markers */}
            {showIncidents && incidentMarkers.map((incident) => (
                <Marker
                    key={incident.id}
                    position={[incident.lat, incident.lng]}
                    icon={incidentIcon}
                >
                    <Popup>
                        <div className="p-2 min-w-[200px]">
                            <div className="font-semibold text-red-600 mb-1">{incident.type}</div>
                            <p className="text-sm mb-1">Location: {incident.location}</p>
                            <p className="text-sm mb-1">Tourist: {incident.tourist}</p>
                            <p className="text-sm mb-2">Team: {incident.assignedTeam}</p>
                            <button
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                onClick={() => onDispatch(incident.id)}
                            >
                                Dispatch Team
                            </button>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Team Markers */}
            {showTeams && teamMarkers.map((team, index) => (
                <Marker
                    key={team.id || index}
                    position={[team.lat, team.lng]}
                    icon={teamIcon}
                >
                    <Popup>
                        <div className="p-2 min-w-[180px]">
                            <div className="font-semibold text-green-600 mb-1">{team.name}</div>
                            <p className="text-sm mb-1">Status: {team.status}</p>
                            <p className="text-sm mb-1">Location: {team.location}</p>
                            <p className="text-sm">Members: {team.members}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Tourist Markers */}
            {showTourists && touristLocations.map((tourist) => (
                <Marker
                    key={tourist.id}
                    position={[tourist.lat, tourist.lng]}
                    icon={touristIcon}
                >
                    <Popup>
                        <div className="p-2">
                            <div className="font-semibold text-cyan-600">{tourist.name}</div>
                            <p className="text-sm">{tourist.count} tourists in group</p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
