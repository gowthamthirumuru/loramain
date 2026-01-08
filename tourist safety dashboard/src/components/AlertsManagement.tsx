import React, { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { AlertTriangle, Search, Filter, Clock, MapPin, Phone, CheckCircle, XCircle, User, Radio, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useDashboardStore, useAlerts, useTeams } from '../store/store';
import type { Alert, AlertStatus } from '../types/types';

export function AlertsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  // Use Zustand store for alerts
  const alerts = useAlerts();
  const teams = useTeams();
  const { updateAlertStatus, deployTeam } = useDashboardStore();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return { variant: 'destructive' as const, bg: 'bg-red-50', border: 'border-red-200' };
      case 'high': return { variant: 'destructive' as const, bg: 'bg-orange-50', border: 'border-orange-200' };
      case 'medium': return { variant: 'default' as const, bg: 'bg-amber-50', border: 'border-amber-200' };
      case 'low': return { variant: 'secondary' as const, bg: 'bg-neutral-50', border: 'border-neutral-200' };
      default: return { variant: 'secondary' as const, bg: 'bg-neutral-50', border: 'border-neutral-200' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'destructive';
      case 'responding': return 'default';
      case 'investigating': return 'secondary';
      case 'resolved': return 'outline';
      default: return 'secondary';
    }
  };

  const filteredAlerts = useMemo(() => alerts.filter(alert => {
    const matchesSearch = alert.tourist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [alerts, searchTerm, statusFilter]);

  const alertStats = useMemo(() => ({
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    responding: alerts.filter(a => a.status === 'responding').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  }), [alerts]);

  const selected = useMemo(() =>
    alerts.find(a => a.id === selectedAlertId) || null,
    [alerts, selectedAlertId]
  );

  const handleDispatch = () => {
    if (!selected) return;
    const availableTeam = teams.find(t => t.status === 'available');
    if (availableTeam) {
      deployTeam(availableTeam.id, selected.id);
      updateAlertStatus(selected.id, 'responding');
      toast.success('Emergency response dispatched', {
        description: `${availableTeam.name} has been notified and is en route.`
      });
    } else {
      toast.error('No teams available', {
        description: 'All response teams are currently deployed.'
      });
    }
  };

  const handleCall = () => {
    if (selected) {
      toast.info('Initiating call', {
        description: `Calling ${selected.tourist} at ${selected.phone}...`
      });
    }
  };

  const handleStatusChange = (newStatus: AlertStatus) => {
    if (selected) {
      updateAlertStatus(selected.id, newStatus);
      toast.success('Alert status updated', {
        description: `Status changed to ${newStatus}`
      });
    }
  };

  const handleResolve = () => {
    if (selected) {
      updateAlertStatus(selected.id, 'resolved');
      toast.success('Alert resolved', {
        description: 'The alert has been marked as resolved.'
      });
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Alert List */}
      <div className="w-[500px] border-r border-neutral-200 bg-white flex flex-col">
        {/* Header Stats */}
        <div className="p-4 border-b border-neutral-200 bg-neutral-50">
          <h2 className="text-sm text-neutral-900 mb-3">Alert Management</h2>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-white rounded border border-neutral-200">
              <p className="text-xs text-neutral-500">Total</p>
              <p className="text-lg text-neutral-900">{alertStats.total}</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-red-200">
              <p className="text-xs text-neutral-500">Active</p>
              <p className="text-lg text-red-600">{alertStats.active}</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-amber-200">
              <p className="text-xs text-neutral-500">Respond</p>
              <p className="text-lg text-amber-600">{alertStats.responding}</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-green-200">
              <p className="text-xs text-neutral-500">Resolved</p>
              <p className="text-lg text-green-600">{alertStats.resolved}</p>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="p-4 border-b border-neutral-200 bg-white space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm border-neutral-300"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 h-9 px-3 text-sm border border-neutral-300 rounded-md bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="responding">Responding</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>
            <Button variant="outline" size="sm" className="h-9 text-xs border-neutral-300">
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </Button>
          </div>
        </div>

        {/* Alert List */}
        <div className="flex-1 overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">No alerts found</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {filteredAlerts.map((alert) => {
                const colors = getSeverityColor(alert.severity);
                return (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-neutral-50 ${selectedAlertId === alert.id ? 'bg-cyan-50 border-l-4 border-l-cyan-600' : ''
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={colors.variant} className="text-xs">
                          {alert.type}
                        </Badge>
                        <Badge variant={getStatusColor(alert.status) as any} className="text-xs">
                          {alert.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-neutral-500">{alert.time}</span>
                    </div>

                    <h4 className="text-sm text-neutral-900 mb-1">{alert.tourist}</h4>
                    <p className="text-xs text-neutral-600 mb-1">{alert.location}</p>
                    <p className="text-xs text-neutral-500">#{alert.id} • {alert.assignedTeam || 'Unassigned'}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Details & Actions */}
      <div className="flex-1 bg-background flex flex-col">
        {selected ? (
          <>
            {/* Details Header */}
            <div className="p-6 bg-white border-b border-neutral-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant={getSeverityColor(selected.severity).variant} className="text-xs">
                      {selected.type}
                    </Badge>
                    <Badge variant={getStatusColor(selected.status) as any} className="text-xs">
                      {selected.status}
                    </Badge>
                    <span className="text-xs text-neutral-500">#{selected.id}</span>
                  </div>
                  <h2 className="text-lg text-neutral-900">Alert Details</h2>
                  <p className="text-sm text-neutral-500 mt-1">{selected.time}</p>
                </div>
              </div>

              <Separator className="my-4 bg-neutral-200" />

              {/* Tourist Information */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs text-neutral-500 mb-2">Tourist Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm text-neutral-900">{selected.tourist}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm text-neutral-900">{selected.phone}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs text-neutral-500 mb-2">Location & Response</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm text-neutral-900">{selected.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Radio className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm text-neutral-900">{selected.assignedTeam || 'No team assigned'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="p-6 bg-white border-b border-neutral-200">
              <h3 className="text-xs text-neutral-500 mb-2">Description</h3>
              <p className="text-sm text-neutral-700">{selected.description}</p>
            </div>

            {/* Actions */}
            <div className="p-6 bg-neutral-50 flex-1">
              <h3 className="text-xs text-neutral-500 mb-4">Quick Actions</h3>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  onClick={handleDispatch}
                  disabled={selected.status === 'resolved'}
                  className="bg-cyan-600 hover:bg-cyan-700 text-sm h-10"
                >
                  <Radio className="w-4 h-4 mr-2" />
                  Dispatch Team
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCall}
                  className="text-sm h-10 border-neutral-300"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Tourist
                </Button>
                <Button
                  variant="outline"
                  className="text-sm h-10 border-neutral-300"
                  onClick={() => toast.info('Opening map view', { description: `Showing ${selected.location}` })}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  View on Map
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResolve}
                  disabled={selected.status === 'resolved'}
                  className="text-sm h-10 border-green-300 text-green-700 hover:bg-green-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Resolved
                </Button>
              </div>

              {/* Update Status */}
              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                <h4 className="text-xs text-neutral-500 mb-2">Update Status</h4>
                <div className="flex items-center space-x-2">
                  <select
                    value={selected.status}
                    onChange={(e) => handleStatusChange(e.target.value as AlertStatus)}
                    className="flex-1 h-9 px-3 text-sm border border-neutral-300 rounded-md bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="responding">Responding</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <Button
                    size="sm"
                    className="h-9 bg-cyan-600 hover:bg-cyan-700"
                    onClick={() => toast.success('Status saved')}
                  >
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h3 className="text-sm text-neutral-900 mb-1">No Alert Selected</h3>
              <p className="text-xs text-neutral-500">Select an alert from the list to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
