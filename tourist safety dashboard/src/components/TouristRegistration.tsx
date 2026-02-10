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
    Radio,
    AlertCircle,
    CheckCircle,
    Clock,
    Eye
} from 'lucide-react';
import { apiClient as api } from '../api/api';

interface Tourist {
    id: string;
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
    device_id?: string;
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

const defaultStatusConfig = { color: '#6b7280', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-700', label: 'Unknown', icon: Clock };

const statusConfig: Record<string, typeof defaultStatusConfig> = {
    registered: { color: '#3b82f6', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700', label: 'Registered', icon: Clock },
    active: { color: '#22c55e', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700', label: 'Active Trip', icon: CheckCircle },
    completed: { color: '#6b7280', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-700', label: 'Completed', icon: CheckCircle },
    emergency: { color: '#ef4444', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700', label: 'Emergency', icon: AlertCircle },
    // Backend may use 'SOS' instead of 'emergency'
    SOS: { color: '#ef4444', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700', label: 'SOS', icon: AlertCircle },
    finished: { color: '#6b7280', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-700', label: 'Finished', icon: CheckCircle }
};

export default function TouristRegistration() {
    // State for view mode: 'list' | 'form'
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');

    const [tourists, setTourists] = useState<Tourist[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedTourist, setSelectedTourist] = useState<Tourist | null>(null);
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
            // Handle both flat array and wrapped response formats
            let data = response.data;
            if (data && !Array.isArray(data)) {
                // Check for common wrapper keys
                data = data.tourists || data.data || data.items || [];
            }
            setTourists(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch tourists:', error);
            setTourists([]); // Ensure empty array on error, NO DEMO DATA
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableDevices = async () => {
        try {
            const response = await api.get('/devices?status=online&unassigned=true');
            setAvailableDevices(response.data || []);
        } catch (error) {
            console.error('Failed to fetch devices:', error);
            setAvailableDevices([]); // Ensure empty array on error, NO DEMO DATA
        }
    };

    // Filter tourists - ensure tourists is an array
    const safeTourists = Array.isArray(tourists) ? tourists : [];
    const filteredTourists = safeTourists.filter(tourist => {
        const matchesSearch =
            tourist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tourist.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tourist.phone.includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || tourist.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Determine current title based on view mode
    const pageTitle = viewMode === 'list'
        ? 'Tourist Registration'
        : (isEditing ? 'Edit Tourist' : 'Register New Tourist');

    const pageSubtitle = viewMode === 'list'
        ? 'Register and manage tourist information'
        : 'Enter tourist details below';

    // Switch to create form
    const switchToCreate = () => {
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
        setViewMode('form');
    };

    // Switch to edit form
    const switchToEdit = (tourist: Tourist) => {
        setSelectedTourist(tourist);
        setIsEditing(true);
        setFormData({
            name: tourist.name || '',
            email: tourist.email || '',
            phone: tourist.phone || '',
            nationality: tourist.nationality || '',
            emergencyContactName: tourist.emergencyContact?.name || '',
            emergencyContactPhone: tourist.emergencyContact?.phone || '',
            emergencyContactRelation: tourist.emergencyContact?.relation || '',
            startDate: tourist.tripDetails?.startDate || '',
            endDate: tourist.tripDetails?.endDate || '',
            groupSize: tourist.tripDetails?.groupSize || 1,
            deviceId: tourist.device_id || ''
        });
        setViewMode('form');
    };

    // Switch back to list
    const backToList = () => {
        setViewMode('list');
        setIsEditing(false);
        setSelectedTourist(null);
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
                device_id: formData.deviceId
            };

            if (isEditing && selectedTourist) {
                await api.put(`/tourists/${selectedTourist.id}`, payload);
            } else {
                await api.post('/tourists', payload);
            }

            await fetchTourists();
            backToList(); // Return to list view after save
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

    // Stats - use safeTourists to prevent crashes
    const stats = {
        total: safeTourists.length,
        active: safeTourists.filter(t => t.status === 'active').length,
        registered: safeTourists.filter(t => t.status === 'registered').length,
        emergency: safeTourists.filter(t => t.status === 'emergency').length
    };

    return (
        <div className="h-full p-6 overflow-auto bg-background">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                        {viewMode === 'form' && (
                            <button onClick={backToList} className="mr-2 hover:bg-neutral-100 p-1 rounded-full transition-colors">
                                <X className="w-6 h-6 text-neutral-500" />
                            </button>
                        )}
                        <Users className="w-7 h-7 text-cyan-600" />
                        {pageTitle}
                    </h1>
                    <p className="text-neutral-500 mt-1 ml-11">{pageSubtitle}</p>
                </div>
                {viewMode === 'list' && (
                    <button
                        onClick={switchToCreate}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-all flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Register Tourist
                    </button>
                )}
            </div>

            {viewMode === 'list' ? (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-neutral-500 text-sm">Total Registered</p>
                                    <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.total}</p>
                                </div>
                                <Users className="w-8 h-8 text-neutral-400" />
                            </div>
                        </div>
                        <div className="bg-white border border-green-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-neutral-500 text-sm">Active Trips</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                        </div>
                        <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-neutral-500 text-sm">Pending Start</p>
                                    <p className="text-2xl font-bold text-blue-600 mt-1">{stats.registered}</p>
                                </div>
                                <Clock className="w-8 h-8 text-blue-500" />
                            </div>
                        </div>
                        <div className="bg-white border border-red-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-neutral-500 text-sm">Emergency</p>
                                    <p className="text-2xl font-bold text-red-600 mt-1">{stats.emergency}</p>
                                </div>
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white border border-neutral-200 rounded-lg p-4 mb-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or phone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                            <div className="col-span-full text-center py-12 text-neutral-500">
                                Loading tourists...
                            </div>
                        ) : filteredTourists.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <Users className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
                                <p className="text-neutral-500">No tourists found</p>
                                <p className="text-sm text-neutral-400 mt-1">Register a new tourist to get started</p>
                            </div>
                        ) : (
                            filteredTourists.map(tourist => {
                                const statusInfo = statusConfig[tourist.status] || defaultStatusConfig;
                                const StatusIcon = statusInfo.icon;

                                return (
                                    <div
                                        key={tourist.id}
                                        className={`bg-white border ${statusInfo.borderColor} rounded-lg p-4 hover:shadow-md transition-all`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-lg">
                                                    {(tourist.name || '').charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="text-neutral-900 font-medium">{tourist.name}</h3>
                                                    <p className="text-xs text-neutral-500 flex items-center gap-1">
                                                        <Globe className="w-3 h-3" />
                                                        {tourist.nationality}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${statusInfo.bgColor} ${statusInfo.textColor}`}
                                            >
                                                <StatusIcon className="w-3 h-3" />
                                                {statusInfo.label}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-neutral-600">
                                                <Mail className="w-4 h-4" />
                                                <span className="truncate">{tourist.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-neutral-600">
                                                <Phone className="w-4 h-4" />
                                                <span>{tourist.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-neutral-600">
                                                <Calendar className="w-4 h-4" />
                                                <span>{tourist.tripDetails?.startDate || 'N/A'} → {tourist.tripDetails?.endDate || 'N/A'}</span>
                                            </div>
                                            {tourist.device_id && (
                                                <div className="flex items-center gap-2 text-cyan-600">
                                                    <Radio className="w-4 h-4" />
                                                    <span>{tourist.device_id}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-200">
                                            <button
                                                onClick={() => viewDetails(tourist)}
                                                className="flex-1 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </button>
                                            <button
                                                onClick={() => switchToEdit(tourist)}
                                                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-cyan-600 transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteTourist(tourist.id)}
                                                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            ) : (
                /* Form View */
                <div className="bg-white border border-neutral-200 rounded-lg shadow-sm max-w-4xl mx-auto">
                    <div className="p-6 space-y-8">
                        {/* Personal Information */}
                        <div>
                            <h4 className="text-lg font-medium text-cyan-600 mb-4 flex items-center gap-2 border-b border-neutral-100 pb-2">
                                <User className="w-5 h-5" />
                                Personal Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-2 !bg-white border border-neutral-300 rounded-lg !text-black placeholder:!text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-shadow"
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-4 py-2 !bg-white border border-neutral-300 rounded-lg !text-black placeholder:!text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-shadow"
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Phone *</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-4 py-2 !bg-white border border-neutral-300 rounded-lg !text-black placeholder:!text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-shadow"
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Nationality</label>
                                    <input
                                        type="text"
                                        value={formData.nationality}
                                        onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                                        className="w-full px-4 py-2 !bg-white border border-neutral-300 rounded-lg !text-black placeholder:!text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-shadow"
                                        placeholder="Country"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div>
                            <h4 className="text-lg font-medium text-red-600 mb-4 flex items-center gap-2 border-b border-neutral-100 pb-2">
                                <AlertCircle className="w-5 h-5" />
                                Emergency Contact
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={formData.emergencyContactName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                                        className="w-full px-4 py-2 !bg-white border border-neutral-300 rounded-lg !text-black placeholder:!text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-shadow"
                                        placeholder="Contact name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.emergencyContactPhone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                                        className="w-full px-4 py-2 !bg-white border border-neutral-300 rounded-lg !text-black placeholder:!text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-shadow"
                                        placeholder="Contact phone"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Relation</label>
                                    <input
                                        type="text"
                                        value={formData.emergencyContactRelation}
                                        onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactRelation: e.target.value }))}
                                        className="w-full px-4 py-2 !bg-white border border-neutral-300 rounded-lg !text-black placeholder:!text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-shadow"
                                        placeholder="e.g., Spouse, Parent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Trip Details */}
                        <div>
                            <h4 className="text-lg font-medium text-green-600 mb-4 flex items-center gap-2 border-b border-neutral-100 pb-2">
                                <Calendar className="w-5 h-5" />
                                Trip Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full px-4 py-2 !bg-white border border-neutral-300 rounded-lg !text-black focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-shadow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full px-4 py-2 !bg-white border border-neutral-300 rounded-lg !text-black focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-shadow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Group Size</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.groupSize}
                                        onChange={(e) => setFormData(prev => ({ ...prev, groupSize: parseInt(e.target.value) || 1 }))}
                                        className="w-full px-4 py-2 !bg-white border border-neutral-300 rounded-lg !text-black focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-shadow"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Device Assignment */}
                        <div>
                            <h4 className="text-lg font-medium text-purple-600 mb-4 flex items-center gap-2 border-b border-neutral-100 pb-2">
                                <Radio className="w-5 h-5" />
                                Device Assignment
                            </h4>
                            <div>
                                <select
                                    value={formData.deviceId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, deviceId: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-shadow"
                                >
                                    <option value="">No device assigned</option>
                                    {availableDevices.map(device => (
                                        <option key={device.id} value={device.deviceId}>
                                            {device.deviceId} - {device.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-sm text-neutral-500 mt-2">Only online and unassigned devices are shown.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-neutral-200">
                            <button
                                onClick={backToList}
                                className="px-6 py-2.5 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg transition-colors font-medium shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveTourist}
                                disabled={!formData.name || !formData.phone}
                                className="flex-1 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium shadow-sm"
                            >
                                <Save className="w-5 h-5" />
                                {isEditing ? 'Update Tourist Registration' : 'Complete Registration'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Dialog */}
            {showDetailsDialog && selectedTourist && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg border border-neutral-200 w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                            <h3 className="text-lg font-semibold text-neutral-900">Tourist Details</h3>
                            <button onClick={() => setShowDetailsDialog(false)} className="text-neutral-400 hover:text-neutral-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-2xl">
                                    {(selectedTourist.name || '').charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-neutral-900">{selectedTourist.name}</h3>
                                    <p className="text-neutral-500">{selectedTourist.nationality}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
                                <div>
                                    <p className="text-xs text-neutral-500">Email</p>
                                    <p className="text-neutral-900">{selectedTourist.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Phone</p>
                                    <p className="text-neutral-900">{selectedTourist.phone}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Trip Dates</p>
                                    <p className="text-neutral-900">{selectedTourist.tripDetails?.startDate || 'N/A'} → {selectedTourist.tripDetails?.endDate || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Group Size</p>
                                    <p className="text-neutral-900">{selectedTourist.tripDetails?.groupSize || 0} person(s)</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-neutral-200">
                                <p className="text-xs text-neutral-500 mb-2">Emergency Contact</p>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-neutral-900 font-medium">{selectedTourist.emergencyContact?.name || 'N/A'}</p>
                                    <p className="text-neutral-600 text-sm">{selectedTourist.emergencyContact?.relation || 'N/A'}</p>
                                    <p className="text-red-600 text-sm mt-1">{selectedTourist.emergencyContact?.phone || 'N/A'}</p>
                                </div>
                            </div>

                            {selectedTourist.device_id && (
                                <div className="pt-4 border-t border-neutral-200">
                                    <p className="text-xs text-neutral-500 mb-2">Assigned Device</p>
                                    <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 flex items-center gap-3">
                                        <Radio className="w-5 h-5 text-cyan-600" />
                                        <span className="text-cyan-700 font-medium">{selectedTourist.device_id}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-neutral-200">
                            <button
                                onClick={() => setShowDetailsDialog(false)}
                                className="w-full px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg transition-colors"
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
