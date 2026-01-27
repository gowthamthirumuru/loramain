import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Edit3,
    Trash2,
    X,
    Save,
    Wifi,
    WifiOff,
    Battery,
    BatteryLow,
    BatteryWarning,
    Radio,
    MapPin,
    Clock,
    RefreshCw,
    Filter,
    Download,
    Upload
} from 'lucide-react';
import { apiClient as api } from '../api/api';

interface Device {
    _id: string;
    deviceId: string;
    name: string;
    type: 'tourist' | 'anchor' | 'relay' | 'gateway';
    status: 'online' | 'offline' | 'maintenance';
    batteryLevel: number;
    lastSeen: string;
    firmwareVersion?: string;
    assignedTo?: {
        _id: string;
        name: string;
    };
    location?: {
        lat: number;
        lng: number;
        zone?: string;
    };
    createdAt: string;
}

interface DeviceFormData {
    deviceId: string;
    name: string;
    type: 'tourist' | 'anchor' | 'relay' | 'gateway';
    firmwareVersion: string;
}

const deviceTypeConfig = {
    tourist: { color: '#22c55e', label: 'Tourist Device', icon: '👤' },
    anchor: { color: '#3b82f6', label: 'Anchor Node', icon: '📍' },
    relay: { color: '#a855f7', label: 'Relay Node', icon: '📡' },
    gateway: { color: '#f59e0b', label: 'Gateway', icon: '🌐' }
};

export default function DeviceManagement() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState<DeviceFormData>({
        deviceId: '',
        name: '',
        type: 'tourist',
        firmwareVersion: '1.0.0'
    });

    // Fetch devices
    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const response = await api.get('/devices');
            setDevices(response.data || []);
        } catch (error) {
            console.error('Failed to fetch devices:', error);
            // Demo data for testing
            setDevices([
                {
                    _id: '1',
                    deviceId: 'LORA-001',
                    name: 'Tourist Device #1',
                    type: 'tourist',
                    status: 'online',
                    batteryLevel: 85,
                    lastSeen: new Date().toISOString(),
                    firmwareVersion: '1.2.0',
                    location: { lat: 20.5937, lng: 78.9629 },
                    createdAt: new Date().toISOString()
                },
                {
                    _id: '2',
                    deviceId: 'ANCHOR-001',
                    name: 'Beach Anchor',
                    type: 'anchor',
                    status: 'online',
                    batteryLevel: 100,
                    lastSeen: new Date().toISOString(),
                    firmwareVersion: '1.2.0',
                    location: { lat: 20.5, lng: 78.8 },
                    createdAt: new Date().toISOString()
                },
                {
                    _id: '3',
                    deviceId: 'RELAY-001',
                    name: 'Mountain Relay',
                    type: 'relay',
                    status: 'offline',
                    batteryLevel: 15,
                    lastSeen: new Date(Date.now() - 3600000).toISOString(),
                    firmwareVersion: '1.1.0',
                    createdAt: new Date().toISOString()
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Filter devices
    const filteredDevices = devices.filter(device => {
        const matchesSearch =
            device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.deviceId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || device.type === filterType;
        const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    // Get battery icon and color
    const getBatteryInfo = (level: number) => {
        if (level > 50) return { icon: Battery, color: 'text-green-400' };
        if (level > 20) return { icon: BatteryWarning, color: 'text-yellow-400' };
        return { icon: BatteryLow, color: 'text-red-400' };
    };

    // Get time ago string
    const getTimeAgo = (dateString: string) => {
        const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    // Open create dialog
    const openCreateDialog = () => {
        setIsEditing(false);
        setFormData({
            deviceId: '',
            name: '',
            type: 'tourist',
            firmwareVersion: '1.0.0'
        });
        setShowDialog(true);
    };

    // Open edit dialog
    const openEditDialog = (device: Device) => {
        setSelectedDevice(device);
        setIsEditing(true);
        setFormData({
            deviceId: device.deviceId,
            name: device.name,
            type: device.type,
            firmwareVersion: device.firmwareVersion || '1.0.0'
        });
        setShowDialog(true);
    };

    // Save device
    const saveDevice = async () => {
        try {
            if (isEditing && selectedDevice) {
                await api.put(`/devices/${selectedDevice._id}`, formData);
            } else {
                await api.post('/devices', formData);
            }
            await fetchDevices();
            closeDialog();
        } catch (error) {
            console.error('Failed to save device:', error);
        }
    };

    // Delete device
    const deleteDevice = async (id: string) => {
        if (!confirm('Are you sure you want to delete this device?')) return;

        try {
            await api.delete(`/devices/${id}`);
            await fetchDevices();
        } catch (error) {
            console.error('Failed to delete device:', error);
        }
    };

    // Close dialog
    const closeDialog = () => {
        setShowDialog(false);
        setIsEditing(false);
        setSelectedDevice(null);
    };

    // Stats
    const stats = {
        total: devices.length,
        online: devices.filter(d => d.status === 'online').length,
        offline: devices.filter(d => d.status === 'offline').length,
        lowBattery: devices.filter(d => d.batteryLevel < 20).length
    };

    return (
        <div className="h-full p-6 overflow-auto" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Radio className="w-7 h-7 text-cyan-400" />
                        Device Management
                    </h1>
                    <p className="text-slate-400 mt-1">Monitor and manage LoRa devices in the network</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchDevices}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button
                        onClick={openCreateDialog}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Device
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Total Devices</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                        </div>
                        <Radio className="w-8 h-8 text-slate-500" />
                    </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Online</p>
                            <p className="text-2xl font-bold text-green-400 mt-1">{stats.online}</p>
                        </div>
                        <Wifi className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Offline</p>
                            <p className="text-2xl font-bold text-red-400 mt-1">{stats.offline}</p>
                        </div>
                        <WifiOff className="w-8 h-8 text-red-500" />
                    </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Low Battery</p>
                            <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.lowBattery}</p>
                        </div>
                        <BatteryLow className="w-8 h-8 text-yellow-500" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or device ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        style={{ colorScheme: 'dark' }}
                    >
                        <option value="all">All Types</option>
                        <option value="tourist">Tourist Devices</option>
                        <option value="anchor">Anchor Nodes</option>
                        <option value="relay">Relay Nodes</option>
                        <option value="gateway">Gateways</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        style={{ colorScheme: 'dark' }}
                    >
                        <option value="all">All Status</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="maintenance">Maintenance</option>
                    </select>
                </div>
            </div>

            {/* Device Table */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-700/50">
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Device</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Type</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Status</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Battery</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Last Seen</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Assigned To</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-slate-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="text-center py-12 text-slate-400">
                                    Loading devices...
                                </td>
                            </tr>
                        ) : filteredDevices.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-12">
                                    <Radio className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                                    <p className="text-slate-400">No devices found</p>
                                    <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
                                </td>
                            </tr>
                        ) : (
                            filteredDevices.map(device => {
                                const typeConfig = deviceTypeConfig[device.type];
                                const batteryInfo = getBatteryInfo(device.batteryLevel);
                                const BatteryIcon = batteryInfo.icon;

                                return (
                                    <tr key={device._id} className="border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-lg">
                                                    {typeConfig.icon}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{device.name}</p>
                                                    <p className="text-xs text-slate-400">{device.deviceId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className="px-2 py-1 rounded text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${typeConfig.color}20`,
                                                    color: typeConfig.color
                                                }}
                                            >
                                                {typeConfig.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {device.status === 'online' ? (
                                                    <Wifi className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <WifiOff className="w-4 h-4 text-red-400" />
                                                )}
                                                <span className={`text-sm ${device.status === 'online' ? 'text-green-400' :
                                                        device.status === 'offline' ? 'text-red-400' : 'text-yellow-400'
                                                    }`}>
                                                    {device.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <BatteryIcon className={`w-4 h-4 ${batteryInfo.color}`} />
                                                <span className={`text-sm ${batteryInfo.color}`}>
                                                    {device.batteryLevel}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                                <Clock className="w-4 h-4" />
                                                {getTimeAgo(device.lastSeen)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {device.assignedTo ? (
                                                <span className="text-cyan-400 text-sm">{device.assignedTo.name}</span>
                                            ) : (
                                                <span className="text-slate-500 text-sm">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditDialog(device)}
                                                    className="p-2 rounded-lg hover:bg-slate-600/50 text-slate-400 hover:text-cyan-400 transition-colors"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteDevice(device._id)}
                                                    className="p-2 rounded-lg hover:bg-slate-600/50 text-slate-400 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Device Dialog */}
            {showDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md mx-4 shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h3 className="text-lg font-semibold text-white">
                                {isEditing ? 'Edit Device' : 'Add Device'}
                            </h3>
                            <button onClick={closeDialog} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-300 mb-1">Device ID</label>
                                <input
                                    type="text"
                                    value={formData.deviceId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, deviceId: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="e.g., LORA-001"
                                    disabled={isEditing}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-300 mb-1">Device Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="Enter device name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-300 mb-1">Device Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    style={{ colorScheme: 'dark' }}
                                >
                                    <option value="tourist">Tourist Device</option>
                                    <option value="anchor">Anchor Node</option>
                                    <option value="relay">Relay Node</option>
                                    <option value="gateway">Gateway</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-300 mb-1">Firmware Version</label>
                                <input
                                    type="text"
                                    value={formData.firmwareVersion}
                                    onChange={(e) => setFormData(prev => ({ ...prev, firmwareVersion: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="e.g., 1.0.0"
                                />
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
                                onClick={saveDevice}
                                disabled={!formData.deviceId || !formData.name}
                                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isEditing ? 'Update' : 'Add'} Device
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
