/**
 * User Management Component
 * Admin-only screen for managing system users
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
    Users, Plus, Search, Edit, Trash2, Key,
    Shield, Eye, UserCheck, UserX, Loader2,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { toast } from 'sonner';
import { apiClient as api } from '../api/api';

interface User {
    _id: string;
    username: string;
    email: string;
    name: string;
    role: 'admin' | 'operator' | 'viewer';
    status: 'active' | 'inactive';
    phone?: string;
    createdAt: string;
    lastLogin?: string;
}

export function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Dialog states
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        name: '',
        password: '',
        role: 'operator',
        phone: ''
    });

    // Fetch users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', '10');
            if (roleFilter) params.append('role', roleFilter);

            const response = await api.get(`/users?${params}`);
            setUsers(response.data.users || []);
            setTotalPages(response.data.pagination?.pages || 1);
        } catch (error: any) {
            toast.error('Failed to load users');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, roleFilter]);

    // Filter users by search
    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Create user
    const handleCreate = async () => {
        try {
            await api.post('/users', formData);
            toast.success('User created successfully');
            setShowCreateDialog(false);
            resetForm();
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create user');
        }
    };

    // Update user
    const handleUpdate = async () => {
        if (!selectedUser) return;
        try {
            await api.put(`/users/${selectedUser._id}`, {
                name: formData.name,
                role: formData.role,
                phone: formData.phone
            });
            toast.success('User updated');
            setShowEditDialog(false);
            fetchUsers();
        } catch (error: any) {
            toast.error('Failed to update user');
        }
    };

    // Delete user
    const handleDelete = async () => {
        if (!selectedUser) return;
        try {
            await api.delete(`/users/${selectedUser._id}`);
            toast.success('User deactivated');
            setShowDeleteDialog(false);
            fetchUsers();
        } catch (error: any) {
            toast.error('Failed to delete user');
        }
    };

    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            name: '',
            password: '',
            role: 'operator',
            phone: ''
        });
    };

    const openEditDialog = (user: User) => {
        setSelectedUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            name: user.name || '',
            password: '',
            role: user.role,
            phone: user.phone || ''
        });
        setShowEditDialog(true);
    };

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            operator: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            viewer: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
        };
        return styles[role] || styles.viewer;
    };

    const getStatusBadge = (status: string) => {
        return status === 'active'
            ? 'bg-green-500/20 text-green-300 border-green-500/30'
            : 'bg-red-500/20 text-red-300 border-red-500/30';
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-cyan-400" />
                        User Management
                    </h1>
                    <p className="text-slate-400 mt-1">Manage system users and access</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setShowCreateDialog(true); }}
                    className="bg-cyan-600 hover:bg-cyan-500"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                </Button>
            </div>

            {/* Filters */}
            <Card className="bg-slate-800/50 border-slate-700 p-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-slate-900/50 border-slate-600"
                                style={{ color: 'white' }}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {['', 'admin', 'operator', 'viewer'].map(role => (
                            <Button
                                key={role || 'all'}
                                variant={roleFilter === role ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setRoleFilter(role)}
                                className={roleFilter === role ? 'bg-cyan-600' : 'border-slate-600'}
                            >
                                {role || 'All'}
                            </Button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Users Table */}
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900/50 border-b border-slate-700">
                                <tr>
                                    <th className="text-left px-6 py-4 text-slate-400 font-medium">User</th>
                                    <th className="text-left px-6 py-4 text-slate-400 font-medium">Role</th>
                                    <th className="text-left px-6 py-4 text-slate-400 font-medium">Status</th>
                                    <th className="text-left px-6 py-4 text-slate-400 font-medium">Last Login</th>
                                    <th className="text-right px-6 py-4 text-slate-400 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-slate-400">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user._id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-white font-medium">{user.name || user.username}</p>
                                                    <p className="text-slate-400 text-sm">{user.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={getRoleBadge(user.role)}>
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={getStatusBadge(user.status)}>
                                                    {user.status === 'active' ? (
                                                        <UserCheck className="w-3 h-3 mr-1" />
                                                    ) : (
                                                        <UserX className="w-3 h-3 mr-1" />
                                                    )}
                                                    {user.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">
                                                {user.lastLogin
                                                    ? new Date(user.lastLogin).toLocaleDateString()
                                                    : 'Never'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditDialog(user)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-400 hover:text-red-300"
                                                        onClick={() => { setSelectedUser(user); setShowDeleteDialog(true); }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
                        <p className="text-slate-400 text-sm">Page {page} of {totalPages}</p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Create User Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-white">Create New User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            placeholder="Username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="bg-slate-900/50 border-slate-600"
                            style={{ color: 'white' }}
                        />
                        <Input
                            placeholder="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="bg-slate-900/50 border-slate-600"
                            style={{ color: 'white' }}
                        />
                        <Input
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="bg-slate-900/50 border-slate-600"
                            style={{ color: 'white' }}
                        />
                        <Input
                            placeholder="Password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="bg-slate-900/50 border-slate-600"
                            style={{ color: 'white' }}
                        />
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-white"
                        >
                            <option value="viewer">Viewer</option>
                            <option value="operator">Operator</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                        <Button className="bg-cyan-600" onClick={handleCreate}>Create User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-white">Edit User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="bg-slate-900/50 border-slate-600"
                            style={{ color: 'white' }}
                        />
                        <Input
                            placeholder="Phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="bg-slate-900/50 border-slate-600"
                            style={{ color: 'white' }}
                        />
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-white"
                        >
                            <option value="viewer">Viewer</option>
                            <option value="operator">Operator</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                        <Button className="bg-cyan-600" onClick={handleUpdate}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-white">Deactivate User</DialogTitle>
                    </DialogHeader>
                    <p className="text-slate-300 py-4">
                        Are you sure you want to deactivate <strong>{selectedUser?.name || selectedUser?.email}</strong>?
                        They will no longer be able to log in.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                        <Button className="bg-red-600 hover:bg-red-500" onClick={handleDelete}>Deactivate</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default UserManagement;
