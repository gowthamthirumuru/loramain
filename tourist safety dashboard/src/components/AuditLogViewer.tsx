import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Download,
    RefreshCw,
    Calendar,
    User,
    Activity,
    Eye,
    X,
    ChevronLeft,
    ChevronRight,
    FileText,
    Shield,
    AlertTriangle,
    CheckCircle,
    Info,
    Clock
} from 'lucide-react';
import { apiClient as api } from '../api/api';

interface AuditLogEntry {
    _id: string;
    action: string;
    category: 'auth' | 'user' | 'zone' | 'device' | 'alert' | 'system' | 'tourist';
    userId?: {
        _id: string;
        username: string;
        email: string;
    };
    targetEntity?: {
        type: string;
        id: string;
        name?: string;
    };
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    status: 'success' | 'failure' | 'warning';
    timestamp: string;
}

const categoryConfig = {
    auth: { color: '#a855f7', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700', icon: Shield, label: 'Authentication' },
    user: { color: '#3b82f6', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700', icon: User, label: 'User Management' },
    zone: { color: '#22c55e', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700', icon: Activity, label: 'Zone' },
    device: { color: '#f59e0b', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700', icon: Activity, label: 'Device' },
    alert: { color: '#ef4444', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700', icon: AlertTriangle, label: 'Alert' },
    system: { color: '#6b7280', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-700', icon: Info, label: 'System' },
    tourist: { color: '#06b6d4', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', textColor: 'text-cyan-700', icon: User, label: 'Tourist' }
};

const statusConfig = {
    success: { color: '#22c55e', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700', icon: CheckCircle, label: 'Success' },
    failure: { color: '#ef4444', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700', icon: AlertTriangle, label: 'Failed' },
    warning: { color: '#f59e0b', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700', icon: Info, label: 'Warning' }
};

export default function AuditLogViewer() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const logsPerPage = 20;

    // Fetch logs
    useEffect(() => {
        fetchLogs();
    }, [currentPage, filterCategory, filterStatus, startDate, endDate]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', currentPage.toString());
            params.append('limit', logsPerPage.toString());
            if (filterCategory !== 'all') params.append('category', filterCategory);
            if (filterStatus !== 'all') params.append('status', filterStatus);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await api.get(`/audit?${params.toString()}`);
            setLogs(response.data?.logs || []);
            setTotalPages(response.data?.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
            // Demo data
            setLogs([
                {
                    _id: '1',
                    action: 'User Login',
                    category: 'auth',
                    userId: { _id: '1', username: 'admin', email: 'admin@example.com' },
                    details: { method: 'password', ipAddress: '192.168.1.1' },
                    ipAddress: '192.168.1.1',
                    status: 'success',
                    timestamp: new Date().toISOString()
                },
                {
                    _id: '2',
                    action: 'Zone Created',
                    category: 'zone',
                    userId: { _id: '1', username: 'admin', email: 'admin@example.com' },
                    targetEntity: { type: 'Zone', id: 'z1', name: 'Beach Safe Zone' },
                    details: { zoneName: 'Beach Safe Zone', type: 'safe' },
                    status: 'success',
                    timestamp: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    _id: '3',
                    action: 'Failed Login Attempt',
                    category: 'auth',
                    details: { email: 'unknown@example.com', reason: 'Invalid credentials' },
                    ipAddress: '10.0.0.1',
                    status: 'failure',
                    timestamp: new Date(Date.now() - 7200000).toISOString()
                },
                {
                    _id: '4',
                    action: 'Device Status Changed',
                    category: 'device',
                    userId: { _id: '2', username: 'operator', email: 'operator@example.com' },
                    targetEntity: { type: 'Device', id: 'd1', name: 'LORA-001' },
                    details: { previousStatus: 'online', newStatus: 'offline' },
                    status: 'warning',
                    timestamp: new Date(Date.now() - 10800000).toISOString()
                },
                {
                    _id: '5',
                    action: 'SOS Alert Triggered',
                    category: 'alert',
                    userId: { _id: '3', username: 'tourist1', email: 'tourist@example.com' },
                    targetEntity: { type: 'Tourist', id: 't1', name: 'John Doe' },
                    details: { deviceId: 'LORA-005', location: { lat: 20.5, lng: 78.9 } },
                    status: 'success',
                    timestamp: new Date(Date.now() - 14400000).toISOString()
                },
                {
                    _id: '6',
                    action: 'Tourist Registered',
                    category: 'tourist',
                    userId: { _id: '1', username: 'admin', email: 'admin@example.com' },
                    targetEntity: { type: 'Tourist', id: 't2', name: 'Maria Garcia' },
                    details: { nationality: 'Spain', groupSize: 4 },
                    status: 'success',
                    timestamp: new Date(Date.now() - 18000000).toISOString()
                }
            ]);
            setTotalPages(3);
        } finally {
            setLoading(false);
        }
    };

    // Filter logs by search
    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.targetEntity?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Format timestamp
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString()
        };
    };

    // Export logs
    const exportLogs = () => {
        const csvContent = [
            ['Timestamp', 'Action', 'Category', 'User', 'Status', 'Details'].join(','),
            ...filteredLogs.map(log => [
                log.timestamp,
                log.action,
                log.category,
                log.userId?.username || 'System',
                log.status,
                JSON.stringify(log.details).replace(/,/g, ';')
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full p-6 overflow-auto bg-background">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                        <FileText className="w-7 h-7 text-cyan-600" />
                        Audit Log Viewer
                    </h1>
                    <p className="text-neutral-500 mt-1">View system activity and security events</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchLogs}
                        className="px-4 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button
                        onClick={exportLogs}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-all flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-neutral-200 rounded-lg p-4 mb-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by action, user, or entity..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        <option value="all">All Categories</option>
                        <option value="auth">Authentication</option>
                        <option value="user">User Management</option>
                        <option value="zone">Zone</option>
                        <option value="device">Device</option>
                        <option value="alert">Alert</option>
                        <option value="tourist">Tourist</option>
                        <option value="system">System</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        <option value="all">All Status</option>
                        <option value="success">Success</option>
                        <option value="failure">Failed</option>
                        <option value="warning">Warning</option>
                    </select>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <span className="text-neutral-500">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                </div>
            </div>

            {/* Log Table */}
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr className="bg-neutral-50">
                            <th className="text-left px-4 py-3 text-sm font-medium text-neutral-700">Timestamp</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-neutral-700">Action</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-neutral-700">Category</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-neutral-700">User</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-neutral-700">Target</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-neutral-700">Status</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-neutral-700">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="text-center py-12 text-neutral-500">
                                    Loading audit logs...
                                </td>
                            </tr>
                        ) : filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-12">
                                    <FileText className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
                                    <p className="text-neutral-500">No audit logs found</p>
                                    <p className="text-sm text-neutral-400 mt-1">Try adjusting your filters</p>
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map(log => {
                                const category = categoryConfig[log.category];
                                const status = statusConfig[log.status];
                                const CategoryIcon = category.icon;
                                const StatusIcon = status.icon;
                                const { date, time } = formatTimestamp(log.timestamp);

                                return (
                                    <tr key={log._id} className="border-t border-neutral-200 hover:bg-neutral-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="w-4 h-4 text-neutral-400" />
                                                <div>
                                                    <p className="text-neutral-900">{date}</p>
                                                    <p className="text-xs text-neutral-500">{time}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-neutral-900 font-medium">{log.action}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${category.bgColor} ${category.textColor} border ${category.borderColor}`}
                                            >
                                                <CategoryIcon className="w-3 h-3" />
                                                {category.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {log.userId ? (
                                                <div>
                                                    <p className="text-neutral-900 text-sm">{log.userId.username}</p>
                                                    <p className="text-xs text-neutral-500">{log.userId.email}</p>
                                                </div>
                                            ) : (
                                                <span className="text-neutral-400 text-sm">System</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {log.targetEntity ? (
                                                <div>
                                                    <p className="text-cyan-600 text-sm">{log.targetEntity.name || log.targetEntity.id}</p>
                                                    <p className="text-xs text-neutral-500">{log.targetEntity.type}</p>
                                                </div>
                                            ) : (
                                                <span className="text-neutral-400 text-sm">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${status.bgColor} ${status.textColor} border ${status.borderColor}`}
                                            >
                                                <StatusIcon className="w-3 h-3" />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-cyan-600 transition-colors ml-auto block"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
                    <p className="text-sm text-neutral-500">
                        Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg border border-neutral-200 w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                            <h3 className="text-lg font-semibold text-neutral-900">Log Details</h3>
                            <button onClick={() => setSelectedLog(null)} className="text-neutral-400 hover:text-neutral-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-neutral-500">Action</p>
                                    <p className="text-neutral-900 font-medium">{selectedLog.action}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Timestamp</p>
                                    <p className="text-neutral-900">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Category</p>
                                    <p className="text-neutral-900">{categoryConfig[selectedLog.category].label}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Status</p>
                                    <p className={statusConfig[selectedLog.status].textColor}>
                                        {statusConfig[selectedLog.status].label}
                                    </p>
                                </div>
                            </div>

                            {selectedLog.userId && (
                                <div className="pt-4 border-t border-neutral-200">
                                    <p className="text-xs text-neutral-500 mb-2">User</p>
                                    <div className="bg-neutral-100 rounded-lg p-3">
                                        <p className="text-neutral-900 font-medium">{selectedLog.userId.username}</p>
                                        <p className="text-neutral-500 text-sm">{selectedLog.userId.email}</p>
                                    </div>
                                </div>
                            )}

                            {selectedLog.targetEntity && (
                                <div className="pt-4 border-t border-neutral-200">
                                    <p className="text-xs text-neutral-500 mb-2">Target Entity</p>
                                    <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                                        <p className="text-cyan-700 font-medium">{selectedLog.targetEntity.name || selectedLog.targetEntity.id}</p>
                                        <p className="text-neutral-500 text-sm">{selectedLog.targetEntity.type}</p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-neutral-200">
                                <p className="text-xs text-neutral-500 mb-2">Details</p>
                                <pre className="bg-neutral-100 rounded-lg p-3 text-xs text-neutral-700 overflow-x-auto">
                                    {JSON.stringify(selectedLog.details, null, 2)}
                                </pre>
                            </div>

                            {selectedLog.ipAddress && (
                                <div className="pt-4 border-t border-neutral-200">
                                    <p className="text-xs text-neutral-500">IP Address</p>
                                    <p className="text-neutral-900 font-mono">{selectedLog.ipAddress}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-neutral-200">
                            <button
                                onClick={() => setSelectedLog(null)}
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
