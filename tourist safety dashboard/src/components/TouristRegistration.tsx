import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Edit3,
    Trash2,
    X,
    Save,
    User,
    Phone,
    Mail,
    Globe,
    Calendar,
    Users,
    MapPin,
    Radio,
    AlertCircle,
    CheckCircle,
    Clock,
    Filter,
    Download,
    Eye
} from 'lucide-react';
import { apiClient as api } from '../api/api';

interface Tourist {
    _id: string;
    name: string;
    email: string;
    phone: string;
    nationality: string;
    emergencyContact: {
        name: string;
        phone: string;
        relation: string;
    };
    tripDetails: {
        startDate: string;
        endDate: string;
        groupSize: number;
        zones: string[];
    };
    device?: {
        _id: string;
        deviceId: string;
    };
    status: 'registered' | 'active' | 'completed' | 'emergency';
    createdAt: string;
}

interface TouristFormData {
    name: string;
    email: string;
    phone: string;
    nationality: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelation: string;
    startDate: string;
    endDate: string;
    groupSize: number;
    deviceId: string;
}

const statusConfig = {
    registered: { color: '#3b82f6', label: 'Registered', icon: Clock },
    active: { color: '#22c55e', label: 'Active Trip', icon: CheckCircle },
    completed: { color: '#6b7280', label: 'Completed', icon: CheckCircle },
    emergency: { color: '#ef4444', label: 'Emergency', icon: AlertCircle }
};

export default function TouristRegistration() {
    const [tourists, setTourists] = useState<Tourist[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedTourist, setSelectedTourist] = useState<Tourist | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [availableDevices, setAvailableDevices] = useState<any[]>([]);

    const [formData, setFormData] = useState<TouristFormData>({
        name: '',
        email: '',
        phone: '',
        nationality: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',
        startDate: '',
        endDate: '',
        groupSize: 1,
        deviceId: ''
    });

    // Fetch tourists
    useEffect(() => {
        const loadData = async () => {
            await fetchTourists();
            await fetchAvailableDevices();
        };
        loadData();
    }, []);

    const fetchTourists = async () => {
        try {
            setLoading(true);
            const response = await api.get('/tourists');
            setTourists(response.data || []);
        } catch (error) {
            console.error('Failed to fetch tourists:', error);
            // Demo data
            setTourists([
                {
                    _id: '1',
                    name: 'John Smith',
                    email: 'john@example.com',
                    phone: '+1 234 567 8900',
                    nationality: 'USA',
                    emergencyContact: {
                        name: 'Jane Smith',
                        phone: '+1 234 567 8901',
                        relation: 'Spouse'
                    },
                    tripDetails: {
                        startDate: '2026-01-10',
                        endDate: '2026-01-15',
                        groupSize: 2,
                        zones: ['Beach Zone', 'Mountain Trail']
                    },
                    device: { _id: '1', deviceId: 'LORA-001' },
                    status: 'active',
                    createdAt: new Date().toISOString()
                },
                {
                    _id: '2',
                    name: 'Maria Garcia',
                    email: 'maria@example.com',
                    phone: '+34 612 345 678',
                    nationality: 'Spain',
                    emergencyContact: {
                        name: 'Carlos Garcia',
                        phone: '+34 612 345 679',
                        relation: 'Brother'
                    },
                    tripDetails: {
                        startDate: '2026-01-12',
                        endDate: '2026-01-18',
                        groupSize: 4,
                        zones: ['Forest Zone']
                    },
                    status: 'registered',
                    createdAt: new Date().toISOString()
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableDevices = async () => {
        try {
            const response = await api.get('/devices?status=online&unassigned=true');
            setAvailableDevices(response.data || []);
        } catch (error) {
            // Demo devices
            setAvailableDevices([
                { _id: '1', deviceId: 'LORA-002', name: 'Tourist Device #2' },
                { _id: '2', deviceId: 'LORA-003', name: 'Tourist Device #3' }
            ]);
        }
    };

    // Filter tourists
    const filteredTourists = tourists.filter(tourist => {
        const matchesSearch =
            tourist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tourist.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tourist.phone.includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || tourist.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Open create dialog
    const openCreateDialog = () => {
        setIsEditing(false);
        const today = new Date().toISOString().split('T')[0];
        setFormData({
            name: '',
            email: '',
            phone: '',
            nationality: '',
            emergencyContactName: '',
            emergencyContactPhone: '',
            emergencyContactRelation: '',
            startDate: today,
            endDate: '',
            groupSize: 1,
            deviceId: ''
        });
        setShowDialog(true);
    };

    // Open edit dialog
    const openEditDialog = (tourist: Tourist) => {
        setSelectedTourist(tourist);
        setIsEditing(true);
        setFormData({
            name: tourist.name,
            email: tourist.email,
            phone: tourist.phone,
            nationality: tourist.nationality,
            emergencyContactName: tourist.emergencyContact.name,
            emergencyContactPhone: tourist.emergencyContact.phone,
            emergencyContactRelation: tourist.emergencyContact.relation,
            startDate: tourist.tripDetails.startDate,
            endDate: tourist.tripDetails.endDate,
            groupSize: tourist.tripDetails.groupSize,
            deviceId: tourist.device?.deviceId || ''
        });
        setShowDialog(true);
    };

    // View tourist details
    const viewDetails = (tourist: Tourist) => {
        setSelectedTourist(tourist);
        setShowDetailsDialog(true);
    };

    // Save tourist
    const saveTourist = async () => {
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                nationality: formData.nationality,
                emergencyContact: {
                    name: formData.emergencyContactName,
                    phone: formData.emergencyContactPhone,
                    relation: formData.emergencyContactRelation
                },
                tripDetails: {
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    groupSize: formData.groupSize,
                    zones: []
                },
                deviceId: formData.deviceId
            };

            if (isEditing && selectedTourist) {
                await api.put(`/tourists/${selectedTourist._id}`, payload);
            } else {
                await api.post('/tourists', payload);
            }

            await fetchTourists();
            closeDialog();
        } catch (error) {
            console.error('Failed to save tourist:', error);
        }
    };

    // Delete tourist
    const deleteTourist = async (id: string) => {
        if (!confirm('Are you sure you want to remove this tourist registration?')) return;

        try {
            await api.delete(`/tourists/${id}`);
            await fetchTourists();
        } catch (error) {
            console.error('Failed to delete tourist:', error);
        }
    };

    // Close dialogs
    const closeDialog = () => {
        setShowDialog(false);
        setIsEditing(false);
        setSelectedTourist(null);
    };

    // Stats
    const stats = {
        total: tourists.length,
        active: tourists.filter(t => t.status === 'active').length,
        registered: tourists.filter(t => t.status === 'registered').length,
        emergency: tourists.filter(t => t.status === 'emergency').length
    };

    return (
        <div className="h-full p-6 overflow-auto" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Users className="w-7 h-7 text-cyan-400" />
                        Tourist Registration
                    </h1>
                    <p className="text-slate-400 mt-1">Register and manage tourist information</p>
                </div>
                <button
                    onClick={openCreateDialog}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Register Tourist
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Total Registered</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                        </div>
                        <Users className="w-8 h-8 text-slate-500" />
                    </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Active Trips</p>
                            <p className="text-2xl font-bold text-green-400 mt-1">{stats.active}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Pending Start</p>
                            <p className="text-2xl font-bold text-blue-400 mt-1">{stats.registered}</p>
                        </div>
                        <Clock className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Emergency</p>
                            <p className="text-2xl font-bold text-red-400 mt-1">{stats.emergency}</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-red-500" />
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
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        style={{ colorScheme: 'dark' }}
                    >
                        <option value="all">All Status</option>
                        <option value="registered">Registered</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="emergency">Emergency</option>
                    </select>
                </div>
            </div>

            {/* Tourist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-slate-400">
                        Loading tourists...
                    </div>
                ) : filteredTourists.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                        <p className="text-slate-400">No tourists found</p>
                        <p className="text-sm text-slate-500 mt-1">Register a new tourist to get started</p>
                    </div>
                ) : (
                    filteredTourists.map(tourist => {
                        const statusInfo = statusConfig[tourist.status];
                        const StatusIcon = statusInfo.icon;

                        return (
                            <div
                                key={tourist._id}
                                className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4 hover:border-cyan-500/50 transition-all"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                            {tourist.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">{tourist.name}</h3>
                                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                                <Globe className="w-3 h-3" />
                                                {tourist.nationality}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
                                        style={{
                                            backgroundColor: `${statusInfo.color}20`,
                                            color: statusInfo.color
                                        }}
                                    >
                                        <StatusIcon className="w-3 h-3" />
                                        {statusInfo.label}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Mail className="w-4 h-4" />
                                        <span className="truncate">{tourist.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Phone className="w-4 h-4" />
                                        <span>{tourist.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Calendar className="w-4 h-4" />
                                        <span>{tourist.tripDetails.startDate} → {tourist.tripDetails.endDate}</span>
                                    </div>
                                    {tourist.device && (
                                        <div className="flex items-center gap-2 text-cyan-400">
                                            <Radio className="w-4 h-4" />
                                            <span>{tourist.device.deviceId}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-700/50">
                                    <button
                                        onClick={() => viewDetails(tourist)}
                                        className="flex-1 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </button>
                                    <button
                                        onClick={() => openEditDialog(tourist)}
                                        className="p-1.5 rounded-lg hover:bg-slate-600/50 text-slate-400 hover:text-cyan-400 transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteTourist(tourist._id)}
                                        className="p-1.5 rounded-lg hover:bg-slate-600/50 text-slate-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Registration Dialog */}
            {showDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800">
                            <h3 className="text-lg font-semibold text-white">
                                {isEditing ? 'Edit Tourist' : 'Register Tourist'}
                            </h3>
                            <button onClick={closeDialog} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-6">
                            {/* Personal Information */}
                            <div>
                                <h4 className="text-sm font-medium text-cyan-400 mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Personal Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm text-slate-300 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            placeholder="Enter full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            placeholder="+1 234 567 8900"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm text-slate-300 mb-1">Nationality</label>
                                        <input
                                            type="text"
                                            value={formData.nationality}
                                            onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            placeholder="Country"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <div>
                                <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Emergency Contact
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={formData.emergencyContactName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            placeholder="Contact name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.emergencyContactPhone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            placeholder="Contact phone"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">Relation</label>
                                        <input
                                            type="text"
                                            value={formData.emergencyContactRelation}
                                            onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactRelation: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            placeholder="e.g., Spouse, Parent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Trip Details */}
                            <div>
                                <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Trip Details
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">Group Size</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.groupSize}
                                            onChange={(e) => setFormData(prev => ({ ...prev, groupSize: parseInt(e.target.value) || 1 }))}
                                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Device Assignment */}
                            <div>
                                <h4 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
                                    <Radio className="w-4 h-4" />
                                    Device Assignment
                                </h4>
                                <select
                                    value={formData.deviceId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, deviceId: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    style={{ colorScheme: 'dark' }}
                                >
                                    <option value="">No device assigned</option>
                                    {availableDevices.map(device => (
                                        <option key={device._id} value={device.deviceId}>
                                            {device.deviceId} - {device.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 p-4 border-t border-slate-700 sticky bottom-0 bg-slate-800">
                            <button
                                onClick={closeDialog}
                                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveTourist}
                                disabled={!formData.name || !formData.phone}
                                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isEditing ? 'Update' : 'Register'} Tourist
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Dialog */}
            {showDetailsDialog && selectedTourist && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h3 className="text-lg font-semibold text-white">Tourist Details</h3>
                            <button onClick={() => setShowDetailsDialog(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                                    {selectedTourist.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{selectedTourist.name}</h3>
                                    <p className="text-slate-400">{selectedTourist.nationality}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                                <div>
                                    <p className="text-xs text-slate-500">Email</p>
                                    <p className="text-white">{selectedTourist.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Phone</p>
                                    <p className="text-white">{selectedTourist.phone}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Trip Dates</p>
                                    <p className="text-white">{selectedTourist.tripDetails.startDate} → {selectedTourist.tripDetails.endDate}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Group Size</p>
                                    <p className="text-white">{selectedTourist.tripDetails.groupSize} person(s)</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-700">
                                <p className="text-xs text-slate-500 mb-2">Emergency Contact</p>
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                    <p className="text-white font-medium">{selectedTourist.emergencyContact.name}</p>
                                    <p className="text-slate-400 text-sm">{selectedTourist.emergencyContact.relation}</p>
                                    <p className="text-red-400 text-sm mt-1">{selectedTourist.emergencyContact.phone}</p>
                                </div>
                            </div>

                            {selectedTourist.device && (
                                <div className="pt-4 border-t border-slate-700">
                                    <p className="text-xs text-slate-500 mb-2">Assigned Device</p>
                                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 flex items-center gap-3">
                                        <Radio className="w-5 h-5 text-cyan-400" />
                                        <span className="text-cyan-400 font-medium">{selectedTourist.device.deviceId}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-700">
                            <button
                                onClick={() => setShowDetailsDialog(false)}
                                className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
