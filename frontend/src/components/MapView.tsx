import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Search, Filter, MapPin, AlertTriangle, Users, Layers, ExternalLink, RefreshCw, Radio, Crosshair } from 'lucide-react';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { useEmergencies, useTeams, useAlerts, useTourists, useAnchors, useDashboardStore } from '../store/store';
import { apiClient as api } from '../api/api';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color: string, pulse = false) => {
  const pulseClass = pulse ? 'animate-ping' : '';
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative;">
        ${pulse ? `<div style="position: absolute; inset: -4px; background: ${color}; border-radius: 50%; opacity: 0.4; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
        <div style="width: 24px; height: 24px; background: ${color}; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const touristIcon = createCustomIcon('#06b6d4');
const teamIcon = createCustomIcon('#22c55e');
const sosIcon = createCustomIcon('#ef4444', true);
const anchorIcon = createCustomIcon('#8b5cf6');
const masterIcon = createCustomIcon('#f59e0b'); // Orange for master nodes

// Zone type colors
const zoneColors: Record<string, string> = {
  safe: '#22c55e',
  danger: '#ef4444',
  restricted: '#f59e0b',
  monitoring: '#3b82f6'
};

// Map center controller
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Zoom Handler Component
function ZoomHandler({ setZoom }: { setZoom: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    },
  });
  return null;
}

// Zone Dot Marker (shown when zoomed out)
function ZoneMarker({ position, color, count }: { position: [number, number]; color: string; count?: number }) {
  return (
    <Marker
      position={position}
      icon={L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="width: 24px; height: 24px; background: ${color}; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            ${count ? `<span style="font-size: 10px; color: white; font-weight: bold;">${count}</span>` : ''}
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })}
    />
  );
}



// Pulsing SOS marker component
function PulsingSosMarker({ position, emergency }: { position: [number, number]; emergency: any }) {
  return (
    <>
      <Circle
        center={position}
        radius={500}
        pathOptions={{
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.2,
          weight: 2
        }}
      />
      <Marker position={position} icon={sosIcon}>
        <Popup>
          <div className="min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="font-bold text-red-600">{emergency.type}</span>
            </div>
            <p className="text-sm font-medium">{emergency.tourist}</p>
            <div className="flex flex-col gap-0.5 mt-1 mb-1">
              <p className="text-xs text-gray-600">{emergency.location}</p>

            </div>
            <p className="text-xs text-gray-500 mt-1">{emergency.timeElapsed}</p>
            <div className="mt-2 pt-2 border-t">
              <span className={`px-2 py-1 rounded text-xs ${emergency.status === 'active' ? 'bg-red-100 text-red-700' :
                emergency.status === 'responding' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                {emergency.status}
              </span>
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
}

interface Zone {
  _id: string;
  name: string;
  type: 'safe' | 'danger' | 'restricted' | 'monitoring';
  boundary: {
    coordinates: number[][][];
  };
  status: string;
}

// interface Tourist removed to use shared type from store

// interface AnchorNode removed to use shared type from store
export function MapView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showIncidents, setShowIncidents] = useState(true);
  const [showTeams, setShowTeams] = useState(true);
  const [showTourists, setShowTourists] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showAnchors, setShowAnchors] = useState(true);
  const [showMasters, setShowMasters] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);

  const [currentZoom, setCurrentZoom] = useState(5);

  // Data from store
  const emergencies = useEmergencies();
  const teams = useTeams();
  const alerts = useAlerts();
  const tourists = useTourists();
  const anchors = useAnchors();

  // Local state for API data
  const [zones, setZones] = useState<Zone[]>([]);
  // const [tourists, setTourists] = useState<Tourist[]>([]); // Removed local state
  // const [anchors, setAnchors] = useState<AnchorNode[]>([]); // Removed local state

  // Fetch zones from API
  const connectSocket = useDashboardStore((state) => state.connectSocket);
  const disconnectSocket = useDashboardStore((state) => state.disconnectSocket);

  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, [connectSocket, disconnectSocket]);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await api.get('/zones');
        setZones(response.data || []);
      } catch (error) {
        console.error('Failed to fetch zones:', error);
        // Demo zones fallback
        setZones([
          {
            _id: 'z1',
            name: 'Taj Mahal Safe Zone',
            type: 'safe',
            boundary: { coordinates: [[[78.02, 27.16], [78.06, 27.16], [78.06, 27.19], [78.02, 27.19], [78.02, 27.16]]] },
            status: 'active'
          },
          {
            _id: 'z2',
            name: 'Yamuna River Danger Zone',
            type: 'danger',
            boundary: { coordinates: [[[78.01, 27.15], [78.04, 27.15], [78.04, 27.17], [78.01, 27.17], [78.01, 27.15]]] },
            status: 'active'
          }
        ]);
      }
    };
    fetchZones();
  }, []);

  // Removed hardcoded demo data for tourists and anchors to use real-time data only

  // Parse emergency coordinates
  const sosMarkers = useMemo(() => {
    return emergencies.map(e => {
      const parts = e.coordinates?.split(',') || [];
      const lat = parseFloat(parts[0]?.trim() || '0');
      const lng = parseFloat(parts[1]?.trim() || '0');
      return { ...e, lat, lng };
    }).filter(e => e.lat !== 0 && e.lng !== 0);
  }, [emergencies]);

  // Team positions
  const teamCoords = [
    { lat: 19.0760, lng: 72.8777 },
    { lat: 28.6139, lng: 77.2090 },
    { lat: 27.1767, lng: 78.0081 },
    { lat: 26.9124, lng: 75.7873 },
  ];

  const teamMarkers = useMemo(() => {
    return teams.slice(0, 4).map((team, index) => ({
      ...team,
      lat: teamCoords[index]?.lat || 20,
      lng: teamCoords[index]?.lng || 78,
    }));
  }, [teams]);

  const focusOnLocation = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
    setMapZoom(14);
    toast.info('Map focused on location');
  };

  const handleDispatch = (incidentId: string) => {
    toast.success(`Team dispatched to incident ${incidentId}`, {
      description: 'Response team en route'
    });
  };

  // Layer controls
  const masterNodes = anchors.filter(a => a.is_master);
  const regularAnchors = anchors.filter(a => !a.is_master);

  const mapLayers = [
    { id: 'incidents', label: 'SOS Alerts', count: sosMarkers.length, enabled: showIncidents, color: 'bg-red-500', toggle: () => setShowIncidents(!showIncidents) },
    { id: 'tourists', label: 'Tourists', count: tourists.length, enabled: showTourists, color: 'bg-cyan-500', toggle: () => setShowTourists(!showTourists) },
    { id: 'responders', label: 'Response Teams', count: teamMarkers.length, enabled: showTeams, color: 'bg-green-500', toggle: () => setShowTeams(!showTeams) },
    { id: 'zones', label: 'Zones', count: zones.length, enabled: showZones, color: 'bg-blue-500', toggle: () => setShowZones(!showZones) },
    { id: 'anchors', label: 'Anchor Nodes', count: regularAnchors.length, enabled: showAnchors, color: 'bg-purple-500', toggle: () => setShowAnchors(!showAnchors) },
    { id: 'masters', label: 'Master Nodes', count: masterNodes.length, enabled: showMasters, color: 'bg-amber-500', toggle: () => setShowMasters(!showMasters) },
  ];

  return (
    <div className="flex h-full">
      {/* Map Area */}
      <div className="flex-1 flex flex-col bg-neutral-100">
        {/* Map Controls */}
        <div className="p-4 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between max-w-[1600px] mx-auto">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-72 h-9 text-sm border-neutral-300"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9 text-xs border-neutral-300"
                onClick={() => { setMapCenter([20.5937, 78.9629]); setMapZoom(5); }}
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Reset View
              </Button>
              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 h-9 text-xs">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1.5"></div>
                Live
              </Button>
            </div>
          </div>
        </div>

        {/* Interactive Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="h-full w-full"
            style={{ background: '#e5e7eb' }}
          >
            {/* Zoom Handler to track zoom level */}
            <ZoomHandler setZoom={setCurrentZoom} />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={mapCenter} zoom={mapZoom} />


            {/* Zone polygons */}
            {showZones && zones.map(zone => {
              if (!zone.boundary?.coordinates?.[0]) return null;
              const coords = zone.boundary.coordinates[0].map(c => [c[1], c[0]] as [number, number]);

              // Calculate centroid for "Zone Dot"
              const latSum = coords.reduce((sum, c) => sum + c[0], 0);
              const lngSum = coords.reduce((sum, c) => sum + c[1], 0);
              const centroid: [number, number] = [latSum / coords.length, lngSum / coords.length];

              const isZoomedOut = currentZoom < 14;

              return (
                <React.Fragment key={zone._id}>
                  <Polygon
                    positions={coords}
                    pathOptions={{
                      color: zoneColors[zone.type] || '#3b82f6',
                      fillColor: zoneColors[zone.type] || '#3b82f6',
                      fillOpacity: 0.2,
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div className="font-medium">{zone.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{zone.type} zone</div>
                    </Popup>
                  </Polygon>

                  {/* Show Zone Dot when zoomed out */}
                  {isZoomedOut && (
                    <ZoneMarker
                      position={centroid}
                      color={zoneColors[zone.type] || '#3b82f6'}
                      count={tourists.length + anchors.length} // Simplified count logic, ideally should filter by zone
                    />
                  )}
                </React.Fragment>
              );
            })}

            {/* SOS markers (ALWAYS SHOW) */}
            {showIncidents && sosMarkers.map(emergency => (
              <PulsingSosMarker
                key={emergency.id}
                position={[emergency.lat, emergency.lng]}
                emergency={emergency}
              />
            ))}

            {/* Tourist markers */}
            {showTourists && tourists
              .filter(t => t.location?.lat && t.location?.lng)
              .map(tourist => (
                <Marker
                  key={tourist.id}
                  position={[tourist.location!.lat, tourist.location!.lng]}
                  icon={touristIcon}
                >
                  <Popup>
                    <div className="min-w-[150px]">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-cyan-500" />
                        <span className="font-medium">{tourist.name}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 mb-1">
                        {tourist.device_id && (
                          <p className="text-xs text-gray-500">Device: {tourist.device_id}</p>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs mt-1 inline-block ${tourist.status === 'offline' ? 'bg-gray-200 text-gray-700' :
                        tourist.status === 'sos' ? 'bg-red-100 text-red-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                        {tourist.status || 'active'}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Team markers (SHOW ONLY WHEN ZOOMED IN) */}
            {showTeams && currentZoom >= 14 && teamMarkers.map(team => (
              <Marker
                key={team.id}
                position={[team.lat, team.lng]}
                icon={teamIcon}
              >
                <Popup>
                  <div className="min-w-[150px]">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-green-500" />
                      <span className="font-medium">{team.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">{team.location}</p>

                    <p className="text-xs text-gray-500">{team.members} members</p>
                    <span className={`px-2 py-0.5 rounded text-xs mt-1 inline-block ${team.status === 'available' ? 'bg-green-100 text-green-700' :
                      team.status === 'responding' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                      {team.status}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Anchor node markers (regular - SHOW ONLY WHEN ZOOMED IN) */}
            {showAnchors && currentZoom >= 14 && regularAnchors
              .filter(a => a.gps_position?.lat && a.gps_position?.lng)
              .map(anchor => (
                <Marker
                  key={anchor.id}
                  position={[anchor.gps_position!.lat, anchor.gps_position!.lng]}
                  icon={anchorIcon}
                >
                  <Popup>
                    <div className="min-w-[150px]">
                      <div className="flex items-center gap-2 mb-1">
                        <Radio className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">{anchor.name}</span>
                      </div>
                      <p className="text-xs text-gray-500">ID: {anchor.anchor_id}</p>
                      <span className={`px-2 py-0.5 rounded text-xs ${anchor.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {anchor.status}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Master node markers (SHOW ONLY WHEN ZOOMED IN) */}
            {showMasters && currentZoom >= 14 && masterNodes
              .filter(a => a.gps_position?.lat && a.gps_position?.lng)
              .map(anchor => (
                <Marker
                  key={anchor.id}
                  position={[anchor.gps_position!.lat, anchor.gps_position!.lng]}
                  icon={masterIcon}
                >
                  <Popup>
                    <div className="min-w-[150px]">
                      <div className="flex items-center gap-2 mb-1">
                        <Crosshair className="w-4 h-4 text-amber-500" />
                        <span className="font-medium">{anchor.name}</span>
                        <span className="text-xs bg-amber-100 text-amber-700 px-1 rounded">Master</span>
                      </div>
                      <p className="text-xs text-gray-500">ID: {anchor.anchor_id}</p>
                      <span className={`px-2 py-0.5 rounded text-xs ${anchor.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {anchor.status}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-white border-l border-neutral-200 flex flex-col overflow-hidden">
        {/* Active Incidents */}
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900">Active SOS Alerts</h3>
            <Badge variant="destructive" className="text-xs">{emergencies.length}</Badge>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {emergencies.map((incident) => (
              <div
                key={incident.id}
                className="p-3 rounded-lg border bg-red-50 border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                onClick={() => {
                  const parts = incident.coordinates?.split(',') || [];
                  const lat = parseFloat(parts[0]?.trim() || '22.5');
                  const lng = parseFloat(parts[1]?.trim() || '78.9');
                  focusOnLocation(lat, lng);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="destructive" className="text-xs">{incident.type}</Badge>
                  <span className="text-xs text-neutral-500">{incident.timeElapsed}</span>
                </div>
                <p className="text-xs text-neutral-900 mb-1 font-medium">{incident.tourist}</p>
                <p className="text-xs text-neutral-600 mb-1">{incident.location}</p>
                <Button
                  size="sm"
                  className="w-full h-7 text-xs bg-cyan-600 hover:bg-cyan-700 mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDispatch(incident.id);
                  }}
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  Dispatch Team
                </Button>
              </div>
            ))}
            {emergencies.length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-4">No active alerts</p>
            )}
          </div>
        </div>

        {/* Response Teams */}
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900">Response Teams</h3>
            <Badge variant="outline" className="text-xs">{teams.length}</Badge>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {teamMarkers.map((team) => (
              <div
                key={team.id}
                className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-100"
                onClick={() => focusOnLocation(team.lat, team.lng)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-neutral-900">{team.name}</h4>
                  <Badge
                    variant={team.status === 'available' ? 'default' : team.status === 'responding' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {team.status}
                  </Badge>
                </div>
                <p className="text-xs text-neutral-500 mb-1">{team.location}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">
                    <Users className="w-3 h-3 inline mr-1" />
                    {team.members} members
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Layers */}
        <div className="p-4 bg-neutral-50 flex-1 overflow-y-auto">
          <div className="flex items-center space-x-2 mb-3">
            <Layers className="w-4 h-4 text-neutral-600" />
            <h4 className="text-sm font-semibold text-neutral-900">Map Layers</h4>
          </div>
          <div className="space-y-2">
            {mapLayers.map((layer) => (
              <div key={layer.id} className="flex items-center justify-between text-sm p-2 rounded bg-white border border-neutral-200">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded ${layer.color}`}></div>
                  <span className="text-xs text-neutral-700">{layer.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">{layer.count}</Badge>
                  <input
                    type="checkbox"
                    checked={layer.enabled}
                    onChange={layer.toggle}
                    className="w-4 h-4 accent-cyan-600"
                  />
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4 bg-neutral-200" />

          {/* Quick Navigation */}
          <div>
            <h5 className="text-xs font-semibold text-neutral-600 mb-2">Quick Navigation</h5>
            <div className="space-y-1.5">
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start text-xs h-7"
                onClick={() => { setMapCenter([28.6139, 77.2090]); setMapZoom(11); }}
              >
                <MapPin className="w-3 h-3 mr-2 text-cyan-600" />
                Delhi Region
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start text-xs h-7"
                onClick={() => { setMapCenter([19.0760, 72.8777]); setMapZoom(11); }}
              >
                <MapPin className="w-3 h-3 mr-2 text-cyan-600" />
                Mumbai Region
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start text-xs h-7"
                onClick={() => { setMapCenter([27.1751, 78.0421]); setMapZoom(13); }}
              >
                <MapPin className="w-3 h-3 mr-2 text-cyan-600" />
                Agra / Taj Mahal
              </Button>
            </div>
          </div>

          <Separator className="my-4 bg-neutral-200" />

          {/* Legend */}
          <div>
            <h5 className="text-xs font-semibold text-neutral-600 mb-2">Legend</h5>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-xs text-neutral-600">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>SOS Alerts</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-neutral-600">
                <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                <span>Tourists</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-neutral-600">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Response Teams</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-neutral-600">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Anchor Nodes</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-neutral-600">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span>Master Nodes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
