import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, useMap, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import {
    Search,
    Plus,
    Edit3,
    Trash2,
    MapPin,
    Shield,
    AlertTriangle,
    Ban,
    X,
    Save,
    Eye,
    EyeOff,
    Layers
} from 'lucide-react';
import { apiClient as api } from '../api/api';
import 'leaflet/dist/leaflet.css';

interface Zone {
    _id: string;
    name: string;
    type: 'safe' | 'danger' | 'restricted' | 'monitoring';
    riskLevel: number;
    boundary: {
        type: 'Polygon';
        coordinates: number[][][];
    };
    status: 'active' | 'inactive';
    description?: string;
    createdAt: string;
}

interface ZoneFormData {
    name: string;
    type: 'safe' | 'danger' | 'restricted' | 'monitoring';
    riskLevel: number;
    description: string;
    coordinates: [number, number][];
}

const zoneTypeConfig = {
    safe: { color: '#22c55e', icon: Shield, label: 'Safe Zone' },
    danger: { color: '#ef4444', icon: AlertTriangle, label: 'Danger Zone' },
    restricted: { color: '#f59e0b', icon: Ban, label: 'Restricted Area' },
    monitoring: { color: '#3b82f6', icon: Eye, label: 'Monitoring Zone' }
};

// Drawing controller component
function DrawingController({
    isDrawing,
    points,
    setPoints,
    onComplete
}: {
    isDrawing: boolean;
    points: [number, number][];
    setPoints: (p: [number, number][]) => void;
    onComplete: () => void;
}) {
    useMapEvents({
        click(e) {
            if (isDrawing) {
                const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
                setPoints([...points, newPoint]);
            }
        }
    });

    return null;
}

// Component to fit map to zones
function MapFitter({ zones }: { zones: Zone[] }) {
    const map = useMap();

    useEffect(() => {
        if (zones.length > 0) {
            const allCoords: [number, number][] = [];
            zones.forEach(zone => {
                if (zone.boundary?.coordinates?.[0]) {
                    zone.boundary.coordinates[0].forEach(coord => {
                        allCoords.push([coord[1], coord[0]]); // GeoJSON is [lng, lat]
                    });
                }
            });
            if (allCoords.length > 0) {
                const bounds = allCoords.map(c => new LatLng(c[0], c[1]));
                map.fitBounds(bounds.map(b => [b.lat, b.lng] as [number, number]));
            }
        }
    }, [zones, map]);

    return null;
}

export default function ZoneEditor() {
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
    const [hiddenZones, setHiddenZones] = useState<Set<string>>(new Set());

    const [formData, setFormData] = useState<ZoneFormData>({
        name: '',
        type: 'monitoring',
        riskLevel: 1,
        description: '',
        coordinates: []
    });

    // Fetch zones
    useEffect(() => {
        fetchZones();
    }, []);

    const fetchZones = async () => {
        try {
            setLoading(true);
            const response = await api.get('/zones');
            setZones(response.data || []);
        } catch (error) {
            console.error('Failed to fetch zones:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter zones
    const filteredZones = zones.filter(zone => {
        const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || zone.type === filterType;
        return matchesSearch && matchesType;
    });

    // Convert GeoJSON coordinates to Leaflet format
    const toLeafletCoords = (geoJsonCoords: number[][]): [number, number][] => {
        return geoJsonCoords.map(coord => [coord[1], coord[0]] as [number, number]);
    };

    // Convert Leaflet coordinates to GeoJSON format
    const toGeoJsonCoords = (leafletCoords: [number, number][]): number[][] => {
        const coords = leafletCoords.map(coord => [coord[1], coord[0]]);
        // Close the polygon
        if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
            coords.push([...coords[0]]);
        }
        return coords;
    };

    // Start drawing new zone
    const startDrawing = () => {
        setIsDrawing(true);
        setDrawingPoints([]);
        setFormData({
            name: '',
            type: 'monitoring',
            riskLevel: 1,
            description: '',
            coordinates: []
        });
    };

    // Complete drawing
    const completeDrawing = () => {
        if (drawingPoints.length >= 3) {
            setFormData(prev => ({ ...prev, coordinates: drawingPoints }));
            setIsDrawing(false);
            setShowDialog(true);
        }
    };

    // Cancel drawing
    const cancelDrawing = () => {
        setIsDrawing(false);
        setDrawingPoints([]);
    };

    // Open edit dialog
    const openEditDialog = (zone: Zone) => {
        setSelectedZone(zone);
        setIsEditing(true);
        const coords = zone.boundary?.coordinates?.[0]
            ? toLeafletCoords(zone.boundary.coordinates[0])
            : [];
        setFormData({
            name: zone.name,
            type: zone.type,
            riskLevel: zone.riskLevel,
            description: zone.description || '',
            coordinates: coords
        });
        setShowDialog(true);
    };

    // Save zone
    const saveZone = async () => {
        try {
            const payload = {
                name: formData.name,
                type: formData.type,
                riskLevel: formData.riskLevel,
                description: formData.description,
                boundary: {
                    type: 'Polygon',
                    coordinates: [toGeoJsonCoords(formData.coordinates)]
                }
            };

            if (isEditing && selectedZone) {
                await api.put(`/zones/${selectedZone._id}`, payload);
            } else {
                await api.post('/zones', payload);
            }

            await fetchZones();
            closeDialog();
        } catch (error) {
            console.error('Failed to save zone:', error);
        }
    };

    // Delete zone
    const deleteZone = async (id: string) => {
        if (!confirm('Are you sure you want to delete this zone?')) return;

        try {
            await api.delete(`/zones/${id}`);
            await fetchZones();
        } catch (error) {
            console.error('Failed to delete zone:', error);
        }
    };

    // Toggle zone visibility
    const toggleZoneVisibility = (id: string) => {
        setHiddenZones(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Close dialog
    const closeDialog = () => {
        setShowDialog(false);
        setIsEditing(false);
        setSelectedZone(null);
        setDrawingPoints([]);
    };

    return (
        <div className="h-full flex" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
            {/* Sidebar */}
            <div className="w-80 bg-slate-800/50 backdrop-blur border-r border-slate-700/50 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-700/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-cyan-400" />
                        Zone Management
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Draw and manage geofences</p>
                </div>

                {/* Search & Filter */}
                <div className="p-4 space-y-3 border-b border-slate-700/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search zones..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        style={{ colorScheme: 'dark' }}
                    >
                        <option value="all">All Types</option>
                        <option value="safe">Safe Zones</option>
                        <option value="danger">Danger Zones</option>
                        <option value="restricted">Restricted Areas</option>
                        <option value="monitoring">Monitoring Zones</option>
                    </select>
                </div>

                {/* Zone List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="text-center text-slate-400 py-8">Loading zones...</div>
                    ) : filteredZones.length === 0 ? (
                        <div className="text-center text-slate-400 py-8">
                            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No zones found</p>
                            <p className="text-sm">Click "New Zone" to create one</p>
                        </div>
                    ) : (
                        filteredZones.map(zone => {
                            const config = zoneTypeConfig[zone.type];
                            const Icon = config.icon;
                            const isHidden = hiddenZones.has(zone._id);

                            return (
                                <div
                                    key={zone._id}
                                    className={`p-3 rounded-lg border transition-all cursor-pointer ${selectedZone?._id === zone._id
                                        ? 'bg-cyan-500/20 border-cyan-500'
                                        : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50'
                                        }`}
                                    onClick={() => setSelectedZone(zone)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: `${config.color}20` }}
                                            >
                                                <Icon className="w-4 h-4" style={{ color: config.color }} />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-medium text-sm">{zone.name}</h4>
                                                <p className="text-xs text-slate-400">{config.label}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleZoneVisibility(zone._id); }}
                                                className="p-1.5 rounded hover:bg-slate-600/50 text-slate-400 hover:text-white"
                                            >
                                                {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openEditDialog(zone); }}
                                                className="p-1.5 rounded hover:bg-slate-600/50 text-slate-400 hover:text-cyan-400"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteZone(zone._id); }}
                                                className="p-1.5 rounded hover:bg-slate-600/50 text-slate-400 hover:text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    {zone.description && (
                                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">{zone.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded text-xs ${zone.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/50 text-slate-400'
                                            }`}>
                                            {zone.status}
                                        </span>
                                        <span className="text-xs text-slate-500">Risk: {zone.riskLevel}/5</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-slate-700/50">
                    {isDrawing ? (
                        <div className="space-y-2">
                            <p className="text-sm text-cyan-400">
                                Click on map to add points ({drawingPoints.length} points)
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={completeDrawing}
                                    disabled={drawingPoints.length < 3}
                                    className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Complete
                                </button>
                                <button
                                    onClick={cancelDrawing}
                                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={startDrawing}
                            className="w-full px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            New Zone
                        </button>
                    )}
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                <MapContainer
                    center={[20.5937, 78.9629]} // India center
                    zoom={5}
                    className="h-full w-full"
                    style={{ background: '#1e293b' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapFitter zones={zones} />
                    <DrawingController
                        isDrawing={isDrawing}
                        points={drawingPoints}
                        setPoints={setDrawingPoints}
                        onComplete={completeDrawing}
                    />

                    {/* Render existing zones */}
                    {filteredZones
                        .filter(zone => !hiddenZones.has(zone._id))
                        .map(zone => {
                            if (!zone.boundary?.coordinates?.[0]) return null;
                            const coords = toLeafletCoords(zone.boundary.coordinates[0]);
                            const config = zoneTypeConfig[zone.type];

                            return (
                                <Polygon
                                    key={zone._id}
                                    positions={coords}
                                    pathOptions={{
                                        color: config.color,
                                        fillColor: config.color,
                                        fillOpacity: selectedZone?._id === zone._id ? 0.4 : 0.2,
                                        weight: selectedZone?._id === zone._id ? 3 : 2
                                    }}
                                    eventHandlers={{
                                        click: () => setSelectedZone(zone)
                                    }}
                                />
                            );
                        })}

                    {/* Drawing preview */}
                    {isDrawing && drawingPoints.length > 0 && (
                        <Polygon
                            positions={drawingPoints}
                            pathOptions={{
                                color: '#06b6d4',
                                fillColor: '#06b6d4',
                                fillOpacity: 0.3,
                                weight: 2,
                                dashArray: '5, 5'
                            }}
                        />
                    )}
                </MapContainer>

                {/* Map overlay info */}
                {isDrawing && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur px-4 py-2 rounded-lg border border-cyan-500/50 text-cyan-400 text-sm">
                        🖱️ Click to add polygon points • Need at least 3 points
                    </div>
                )}
            </div>

            {/* Zone Dialog */}
            {showDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md mx-4 shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h3 className="text-lg font-semibold text-white">
                                {isEditing ? 'Edit Zone' : 'Create Zone'}
                            </h3>
                            <button onClick={closeDialog} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-300 mb-1">Zone Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="Enter zone name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-300 mb-1">Zone Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    style={{ colorScheme: 'dark' }}
                                >
                                    <option value="safe">Safe Zone</option>
                                    <option value="danger">Danger Zone</option>
                                    <option value="restricted">Restricted Area</option>
                                    <option value="monitoring">Monitoring Zone</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-300 mb-1">Risk Level (1-5)</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={formData.riskLevel}
                                    onChange={(e) => setFormData(prev => ({ ...prev, riskLevel: parseInt(e.target.value) }))}
                                    className="w-full accent-cyan-500"
                                />
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                    <span>Low</span>
                                    <span>{formData.riskLevel}</span>
                                    <span>High</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-300 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 h-20 resize-none"
                                    placeholder="Optional description..."
                                />
                            </div>

                            <div className="bg-slate-700/30 rounded-lg p-3">
                                <p className="text-xs text-slate-400">
                                    📍 {formData.coordinates.length} boundary points defined
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 p-4 border-t border-slate-700">
                            <button
                                onClick={closeDialog}
                                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveZone}
                                disabled={!formData.name || formData.coordinates.length < 3}
                                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Zone
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
