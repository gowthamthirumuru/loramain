import React, { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Search, Filter, MapPin, AlertTriangle, Users, Layers, ExternalLink } from 'lucide-react';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { useEmergencies, useTeams, useAlerts } from '../store/store';

// Sample tourist locations around India
const touristLocations = [
  { id: 't1', name: 'Tourist Group A', lat: 27.1850, lng: 78.0520, count: 12 },
  { id: 't2', name: 'Tourist Group B', lat: 28.6100, lng: 77.2200, count: 8 },
  { id: 't3', name: 'Tourist Group C', lat: 18.9400, lng: 72.8400, count: 15 },
  { id: 't4', name: 'Tourist Group D', lat: 26.9200, lng: 75.7800, count: 5 },
];

export function MapView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showIncidents, setShowIncidents] = useState(true);
  const [showTeams, setShowTeams] = useState(true);
  const [showTourists, setShowTourists] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState({ lat: 22.5, lng: 78.9, zoom: 5 });

  // Get data from store
  const emergencies = useEmergencies();
  const teams = useTeams();
  const alerts = useAlerts();

  // Parse coordinates from emergency data
  const incidentMarkers = useMemo(() => {
    return emergencies.map(e => {
      const parts = e.coordinates?.split(',') || [];
      const lat = parseFloat(parts[0]?.trim() || '0');
      const lng = parseFloat(parts[1]?.trim() || '0');
      return { ...e, lat, lng };
    }).filter(e => e.lat !== 0 && e.lng !== 0);
  }, [emergencies]);

  // Team coordinates
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

  const handleDispatch = (incidentId: string) => {
    toast.success(`Team dispatched to incident ${incidentId}`, {
      description: 'Response team en route'
    });
  };

  const focusOnLocation = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng, zoom: 14 });
    toast.info('Map focused on location');
  };

  // Generate OpenStreetMap embed URL with markers
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${selectedLocation.lng - 10},${selectedLocation.lat - 5},${selectedLocation.lng + 10},${selectedLocation.lat + 5}&layer=mapnik&marker=${selectedLocation.lat},${selectedLocation.lng}`;

  // Layer controls
  const mapLayers = [
    { id: 'incidents', label: 'Active Incidents', count: emergencies.length, enabled: showIncidents, color: 'bg-red-500' },
    { id: 'tourists', label: 'Tourist Groups', count: touristLocations.reduce((a, t) => a + t.count, 0), enabled: showTourists, color: 'bg-cyan-500' },
    { id: 'responders', label: 'Response Teams', count: teams.length, enabled: showTeams, color: 'bg-green-500' },
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
              <Button size="sm" variant="outline" className="h-9 text-xs border-neutral-300">
                <Filter className="w-4 h-4 mr-1.5" />
                Filters
              </Button>
              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 h-9 text-xs">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1.5"></div>
                Live
              </Button>
              <a
                href={`https://www.openstreetmap.org/?mlat=${selectedLocation.lat}&mlon=${selectedLocation.lng}#map=${selectedLocation.zoom}/${selectedLocation.lat}/${selectedLocation.lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="h-9 text-xs border-neutral-300">
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  Full Map
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Map Display */}
        <div className="flex-1 relative">
          <iframe
            title="Tourist Safety Map"
            src={mapUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            className="bg-neutral-200"
          />

          {/* Overlay with markers info */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <h4 className="text-sm font-semibold mb-2 text-neutral-800">Map Overview</h4>
            <p className="text-xs text-neutral-600 mb-2">
              Interactive map showing {incidentMarkers.length} incidents, {teamMarkers.length} teams, and {touristLocations.length} tourist groups across India.
            </p>
            <div className="flex gap-2 flex-wrap">
              {showIncidents && (
                <div className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {incidentMarkers.length} Incidents
                </div>
              )}
              {showTeams && (
                <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {teamMarkers.length} Teams
                </div>
              )}
              {showTourists && (
                <div className="flex items-center gap-1 text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                  {touristLocations.length} Groups
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-white border-l border-neutral-200 flex flex-col overflow-hidden">
        {/* Active Incidents */}
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900">Active Incidents</h3>
            <Badge variant="destructive" className="text-xs">{emergencies.length}</Badge>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {emergencies.map((incident) => (
              <div
                key={incident.id}
                className="p-3 rounded-lg border bg-neutral-50 border-neutral-200 hover:bg-neutral-100 transition-colors cursor-pointer"
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
                <p className="text-xs text-neutral-900 mb-1">{incident.location}</p>
                <p className="text-xs text-neutral-500 font-mono mb-2">{incident.coordinates}</p>
                <Button
                  size="sm"
                  className="w-full h-7 text-xs bg-cyan-600 hover:bg-cyan-700"
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
                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs border-neutral-300">
                    Track
                  </Button>
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
          <div className="space-y-3">
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
                    onChange={() => {
                      if (layer.id === 'incidents') setShowIncidents(!showIncidents);
                      if (layer.id === 'tourists') setShowTourists(!showTourists);
                      if (layer.id === 'responders') setShowTeams(!showTeams);
                    }}
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
                onClick={() => setSelectedLocation({ lat: 28.6139, lng: 77.2090, zoom: 11 })}
              >
                <MapPin className="w-3 h-3 mr-2 text-cyan-600" />
                Delhi Region
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start text-xs h-7"
                onClick={() => setSelectedLocation({ lat: 19.0760, lng: 72.8777, zoom: 11 })}
              >
                <MapPin className="w-3 h-3 mr-2 text-cyan-600" />
                Mumbai Region
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start text-xs h-7"
                onClick={() => setSelectedLocation({ lat: 27.1751, lng: 78.0421, zoom: 13 })}
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
                <AlertTriangle className="w-3 h-3 text-red-600" />
                <span>Emergency Incidents</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-neutral-600">
                <Users className="w-3 h-3 text-green-600" />
                <span>Response Teams</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-neutral-600">
                <MapPin className="w-3 h-3 text-cyan-600" />
                <span>Tourist Groups</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
