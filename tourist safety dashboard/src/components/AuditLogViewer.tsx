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
    auth: { color: '#a855f7', icon: Shield, label: 'Authentication' },
    user: { color: '#3b82f6', icon: User, label: 'User Management' },
    zone: { color: '#22c55e', icon: Activity, label: 'Zone' },
    device: { color: '#f59e0b', icon: Activity, label: 'Device' },
    alert: { color: '#ef4444', icon: AlertTriangle, label: 'Alert' },
    system: { color: '#6b7280', icon: Info, label: 'System' },
    tourist: { color: '#06b6d4', icon: User, label: 'Tourist' }
};

const statusConfig = {
    success: { color: '#22c55e', icon: CheckCircle, label: 'Success' },
    failure: { color: '#ef4444', icon: AlertTriangle, label: 'Failed' },
    warning: { color: '#f59e0b', icon: Info, label: 'Warning' }
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
        <div className="h-full p-6 overflow-auto" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FileText className="w-7 h-7 text-cyan-400" />
                        Audit Log Viewer
                    </h1>
                    <p className="text-slate-400 mt-1">View system activity and security events</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchLogs}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button
                        onClick={exportLogs}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by action, user, or entity..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        style={{ colorScheme: 'dark' }}
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
                        className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        style={{ colorScheme: 'dark' }}
                    >
                        <option value="all">All Status</option>
                        <option value="success">Success</option>
                        <option value="failure">Failed</option>
                        <option value="warning">Warning</option>
                    </select>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <span className="text-slate-400">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                </div>
            </div>

            {/* Log Table */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-700/50">
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Timestamp</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Action</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Category</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">User</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Target</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Status</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-slate-300">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="text-center py-12 text-slate-400">
                                    Loading audit logs...
                                </td>
                            </tr>
                        ) : filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-12">
                                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                                    <p className="text-slate-400">No audit logs found</p>
                                    <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
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
                                    <tr key={log._id} className="border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="w-4 h-4 text-slate-500" />
                                                <div>
                                                    <p className="text-white">{date}</p>
                                                    <p className="text-xs text-slate-400">{time}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-white font-medium">{log.action}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit"
                                                style={{
                                                    backgroundColor: `${category.color}20`,
                                                    color: category.color
                                                }}
                                            >
                                                <CategoryIcon className="w-3 h-3" />
                                                {category.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {log.userId ? (
                                                <div>
                                                    <p className="text-white text-sm">{log.userId.username}</p>
                                                    <p className="text-xs text-slate-400">{log.userId.email}</p>
                                                </div>
                                            ) : (
                                                <span className="text-slate-500 text-sm">System</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {log.targetEntity ? (
                                                <div>
                                                    <p className="text-cyan-400 text-sm">{log.targetEntity.name || log.targetEntity.id}</p>
                                                    <p className="text-xs text-slate-400">{log.targetEntity.type}</p>
                                                </div>
                                            ) : (
                                                <span className="text-slate-500 text-sm">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit"
                                                style={{
                                                    backgroundColor: `${status.color}20`,
                                                    color: status.color
                                                }}
                                            >
                                                <StatusIcon className="w-3 h-3" />
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="p-2 rounded-lg hover:bg-slate-600/50 text-slate-400 hover:text-cyan-400 transition-colors ml-auto block"
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
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
                    <p className="text-sm text-slate-400">
                        Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h3 className="text-lg font-semibold text-white">Log Details</h3>
                            <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500">Action</p>
                                    <p className="text-white font-medium">{selectedLog.action}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Timestamp</p>
                                    <p className="text-white">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Category</p>
                                    <p className="text-white">{categoryConfig[selectedLog.category].label}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Status</p>
                                    <p style={{ color: statusConfig[selectedLog.status].color }}>
                                        {statusConfig[selectedLog.status].label}
                                    </p>
                                </div>
                            </div>

                            {selectedLog.userId && (
                                <div className="pt-4 border-t border-slate-700">
                                    <p className="text-xs text-slate-500 mb-2">User</p>
                                    <div className="bg-slate-700/50 rounded-lg p-3">
                                        <p className="text-white font-medium">{selectedLog.userId.username}</p>
                                        <p className="text-slate-400 text-sm">{selectedLog.userId.email}</p>
                                    </div>
                                </div>
                            )}

                            {selectedLog.targetEntity && (
                                <div className="pt-4 border-t border-slate-700">
                                    <p className="text-xs text-slate-500 mb-2">Target Entity</p>
                                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                                        <p className="text-cyan-400 font-medium">{selectedLog.targetEntity.name || selectedLog.targetEntity.id}</p>
                                        <p className="text-slate-400 text-sm">{selectedLog.targetEntity.type}</p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-700">
                                <p className="text-xs text-slate-500 mb-2">Details</p>
                                <pre className="bg-slate-900 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto">
                                    {JSON.stringify(selectedLog.details, null, 2)}
                                </pre>
                            </div>

                            {selectedLog.ipAddress && (
                                <div className="pt-4 border-t border-slate-700">
                                    <p className="text-xs text-slate-500">IP Address</p>
                                    <p className="text-white font-mono">{selectedLog.ipAddress}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-700">
                            <button
                                onClick={() => setSelectedLog(null)}
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
