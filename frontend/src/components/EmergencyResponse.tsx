import React, { useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Phone, Radio, MapPin, Clock, AlertTriangle, CheckCircle2, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useDashboardStore, useEmergencies, useTeams } from '../store/store';

export function EmergencyResponse() {
  // Use Zustand store
  const emergencies = useEmergencies();
  const teams = useTeams();
  const { updateEmergencyStatus, deployTeam } = useDashboardStore();

  const handleDispatch = (emergencyId: string) => {
    const availableTeam = teams.find(t => t.status === 'available');
    if (availableTeam) {
      deployTeam(availableTeam.id, emergencyId);
      updateEmergencyStatus(emergencyId, 'in_progress');
      toast.success(`${availableTeam.name} dispatched`, {
        description: 'Team has been alerted and is en route.'
      });
    } else {
      toast.error('No teams available', {
        description: 'All response teams are currently deployed.'
      });
    }
  };

  const handleCall = (name: string) => {
    toast.info(`Calling ${name}`, {
      description: 'Establishing direct communication...'
    });
  };

  const handleTrack = (emergencyId: string, location: string) => {
    toast.info('Opening live tracking', {
      description: `Tracking response to ${location}`
    });
  };

  const handleMarkResolved = (emergencyId: string) => {
    updateEmergencyStatus(emergencyId, 'resolved');
    toast.success('Emergency resolved', {
      description: 'Incident report generated and filed.'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'destructive' };
      case 'high': return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'default' };
      case 'medium': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'secondary' };
      default: return { bg: 'bg-neutral-50', border: 'border-neutral-200', text: 'text-neutral-700', badge: 'secondary' };
    }
  };

  const stats = useMemo(() => ({
    critical: emergencies.filter(e => e.severity?.toLowerCase() === 'critical').length,
    high: emergencies.filter(e => e.severity?.toLowerCase() === 'high').length,
    avgResponse: '5.8 min',
    resolvedToday: 47,
  }), [emergencies]);

  const activeEmergencies = useMemo(() =>
    emergencies.filter(e => e.status !== 'resolved'),
    [emergencies]
  );

  const availableTeams = useMemo(() =>
    teams.filter(t => t.status === 'available'),
    [teams]
  );

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg text-neutral-900">Emergency Response Center</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Manage and coordinate emergency incidents</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {activeEmergencies.length} Active
          </Badge>
          <Badge variant="outline" className="text-xs text-green-600 border-green-300">
            {availableTeams.length} Teams Ready
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Critical</p>
              <p className="text-2xl text-red-700">{stats.critical}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">High Priority</p>
              <p className="text-2xl text-orange-700">{stats.high}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-cyan-200 bg-cyan-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Clock className="w-4 h-4 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Avg Response</p>
              <p className="text-2xl text-cyan-700">{stats.avgResponse}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-600">Resolved Today</p>
              <p className="text-2xl text-green-700">{stats.resolvedToday}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Emergencies */}
      <div className="space-y-4">
        <h3 className="text-sm text-neutral-700">Active Incidents ({activeEmergencies.length})</h3>

        {activeEmergencies.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h4 className="text-sm text-neutral-900 mb-1">All Clear</h4>
            <p className="text-xs text-neutral-500">No active emergencies at this time</p>
          </Card>
        ) : (
          activeEmergencies.map((emergency) => {
            const colors = getSeverityColor(emergency.severity);
            return (
              <Card
                key={emergency.id}
                className={`border-2 ${colors.border} ${colors.bg} hover:shadow-md transition-shadow`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={colors.badge as any} className="text-xs">
                          {emergency.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-white">
                          {emergency.status}
                        </Badge>
                        <span className="text-xs text-neutral-500">#{emergency.id}</span>
                      </div>
                      <h4 className="text-base text-neutral-900 mb-1">{emergency.tourist}</h4>
                      <div className="flex items-center space-x-4 text-xs text-neutral-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{emergency.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span className={colors.text}>{emergency.timeElapsed}</span>
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className="text-xs bg-white border-neutral-300"
                    >
                      <Radio className="w-3 h-3 mr-1" />
                      {emergency.assignedTeam || 'Unassigned'}
                    </Badge>
                  </div>

                  <Separator className="my-4 bg-neutral-200" />

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      className="bg-cyan-600 hover:bg-cyan-700 h-8 text-xs"
                      onClick={() => handleDispatch(emergency.id)}
                    >
                      <Radio className="w-3 h-3 mr-1.5" />
                      Dispatch
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs border-neutral-300"
                      onClick={() => handleCall(emergency.tourist)}
                    >
                      <Phone className="w-3 h-3 mr-1.5" />
                      Call
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs border-neutral-300"
                      onClick={() => handleTrack(emergency.id, emergency.location)}
                    >
                      <MapPin className="w-3 h-3 mr-1.5" />
                      Track
                    </Button>
                    <div className="flex-1" />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs border-green-300 text-green-700 hover:bg-green-50"
                      onClick={() => handleMarkResolved(emergency.id)}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1.5" />
                      Resolve
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Available Teams */}
      <div className="space-y-4">
        <h3 className="text-sm text-neutral-700">Available Response Teams ({availableTeams.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teams.slice(0, 6).map((team) => (
            <Card key={team.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-neutral-900">{team.name}</h4>
                <Badge
                  variant={team.status === 'available' ? 'default' : team.status === 'responding' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {team.status}
                </Badge>
              </div>
              <div className="flex items-center space-x-3 text-xs text-neutral-600">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{team.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{team.members} members</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
