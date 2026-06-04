import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import {
  AlertTriangle,
  Users,
  Clock,
  Shield,
  Phone,
  MapPin,
  Activity,
  Search,
  Radio,
  CheckCircle2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { useDashboardStore, useMetrics, useEmergencies, useAlerts, useTeams } from '../store/store';

export function DashboardOverview() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // Use Zustand store
  const metrics = useMetrics();
  const emergencies = useEmergencies();
  const safeEmergencies = Array.isArray(emergencies) ? emergencies : [];
  const storeAlerts = useAlerts();
  const teams = useTeams();
  const { updateEmergencyStatus, deployTeam, setActiveView, refreshData } = useDashboardStore();

  // Default metrics to prevent crash - use property-level defaults
  const safeMetrics = {
    activeEmergencies: metrics?.activeEmergencies ?? 0,
    avgResponseTime: metrics?.avgResponseTime ?? 0,
    availableTeams: metrics?.availableTeams ?? 0,
    totalTeams: metrics?.totalTeams ?? 0,
    touristsTracked: metrics?.touristsTracked ?? 0,
    touristsChange: metrics?.touristsChange ?? 0
  };

  // Filter available teams with useMemo for stable reference
  const safeTeams = Array.isArray(teams) ? teams : [];
  const availableTeams = useMemo(() => safeTeams.filter(t => t.status === 'available'), [safeTeams]);

  useEffect(() => {
    // Initial fetch
    refreshData();

    // Poll every 10 seconds
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      refreshData();
    }, 10000); // 10s poll

    // Separate clock timer update every second for smoother UI
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      clearInterval(timer);
      clearInterval(clockTimer);
    };
  }, [refreshData]);

  // Critical Metrics - now using store data
  const metricsDisplay = [
    {
      id: 'emergencies',
      label: 'Active Emergencies',
      value: String(safeMetrics.activeEmergencies),
      change: '+1 in last hour',
      trend: 'up',
      icon: AlertTriangle,
      severity: 'critical',
      bgColor: 'bg-red-50',
      textColor: 'text-red-900',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200'
    },
    {
      id: 'response',
      label: 'Avg Response Time',
      value: `${safeMetrics.avgResponseTime} min`,
      change: 'Target: <8 min',
      trend: 'stable',
      icon: Clock,
      severity: 'success',
      bgColor: 'bg-green-50',
      textColor: 'text-green-900',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      id: 'teams',
      label: 'Available Teams',
      value: `${safeMetrics.availableTeams} / ${safeMetrics.totalTeams}`,
      change: `${safeMetrics.totalTeams - safeMetrics.availableTeams} responding`,
      trend: 'stable',
      icon: Shield,
      severity: 'info',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-900',
      iconColor: 'text-cyan-600',
      borderColor: 'border-cyan-200'
    },
    {
      id: 'tourists',
      label: 'Tourists Tracked',
      value: safeMetrics.touristsTracked.toLocaleString(),
      change: `+${safeMetrics.touristsChange} today`,
      trend: 'up',
      icon: Users,
      severity: 'info',
      bgColor: 'bg-neutral-50',
      textColor: 'text-neutral-900',
      iconColor: 'text-neutral-600',
      borderColor: 'border-neutral-200'
    }
  ];

  // Live Emergencies - now from store
  // Using emergencies from store hook above

  // Available Teams - now from store
  // Using availableTeams from store hook above

  // Priority Alerts - local notifications (separate from store alerts)
  const priorityAlerts = [
    {
      id: 1,
      message: 'Monsoon alert - 47 tourists in affected area',
      severity: 'warning',
      time: '2 min ago'
    },
    {
      id: 2,
      message: 'Taj Mahal at 95% capacity - crowd control recommended',
      severity: 'medium',
      time: '5 min ago'
    },
    {
      id: 3,
      message: 'GPS tracking delays in Jaipur region',
      severity: 'info',
      time: '8 min ago'
    }
  ];

  const handleEmergencyAction = (id: string, action: string) => {
    if (action === 'Dispatch') {
      deployTeam(availableTeams[0]?.id || '', id);
    }
    toast.success(`${action} initiated for ${id}`, {
      description: 'Response team notified and en route.'
    });
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    toast.info(`Searching for: ${searchQuery}`, {
      description: 'Checking all tracking systems...'
    });
  };

  const handleTeamDeploy = (teamId: string) => {
    deployTeam(teamId, 'manual-dispatch');
    toast.success(`${teamId} deployed`, {
      description: 'Team is now responding.'
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* KPI Header Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsDisplay.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.id}
              className={`p-4 border ${metric.borderColor} ${metric.bgColor} hover:shadow-md transition-shadow cursor-pointer`}
              onClick={() => {
                if (metric.id === 'emergencies') setActiveView('emergency');
                else if (metric.id === 'teams') setActiveView('map');
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className={`p-2 rounded-lg bg-white shadow-sm ${metric.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 mb-1">{metric.label}</p>
                  <p className={`text-2xl mb-1 ${metric.textColor}`}>{metric.value}</p>
                  <p className="text-xs text-neutral-500">{metric.change}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Active Emergencies */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Emergencies */}
          <Card className="border-red-200 bg-red-50/30">
            <div className="p-4 border-b border-red-200 bg-red-50 sticky top-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <h3 className="text-sm text-red-900">Active Emergencies</h3>
                </div>
                <Badge variant="destructive" className="text-xs">
                  {safeEmergencies.length} Active
                </Badge>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {safeEmergencies.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">No active emergencies</p>
                </div>
              ) : (
                safeEmergencies.map((emergency) => (
                  <Card key={emergency.id} className="p-4 bg-white border-red-200 hover:shadow-sm transition-shadow">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge
                              variant="destructive"
                              className="text-xs"
                            >
                              {emergency.type}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs bg-white"
                            >
                              {emergency.status.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-neutral-500">#{emergency.id}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-neutral-500">Tourist</p>
                              <p className="text-neutral-900">{emergency.tourist}</p>
                            </div>
                            <div>
                              <p className="text-neutral-500">Location</p>
                              <p className="text-neutral-900">{emergency.location}</p>
                            </div>
                            <div>
                              <p className="text-neutral-500">Team</p>
                              <p className="text-cyan-600">{emergency.assignedTeam}</p>
                            </div>
                            <div>
                              <p className="text-neutral-500">Time</p>
                              <p className="text-red-600">{emergency.timeElapsed}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-neutral-200" />

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-red-600 hover:bg-red-700 h-8 text-xs"
                          onClick={() => handleEmergencyAction(emergency.id, 'Dispatch')}
                        >
                          <Radio className="w-3 h-3 mr-1.5" />
                          Dispatch
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs border-neutral-300"
                          onClick={() => handleEmergencyAction(emergency.id, 'Call')}
                        >
                          <Phone className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs border-neutral-300"
                          onClick={() => handleEmergencyAction(emergency.id, 'Track')}
                        >
                          <MapPin className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>

          {/* Priority Alerts */}
          <Card>
            <div className="p-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm text-neutral-900">Priority Notifications</h3>
            </div>
            <div className="p-4 space-y-2">
              {priorityAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors"
                >
                  <div className="flex items-start space-x-2 flex-1">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${alert.severity === 'warning' ? 'bg-amber-500' :
                      alert.severity === 'medium' ? 'bg-orange-500' : 'bg-cyan-500'
                      }`}></div>
                    <div className="flex-1">
                      <p className="text-xs text-neutral-900">{alert.message}</p>
                      <p className="text-xs text-neutral-500 mt-1">{alert.time}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 ml-2 border-neutral-300"
                    onClick={() => {
                      toast.info('Taking action', {
                        description: `Handling: ${alert.message.substring(0, 40)}...`
                      });
                      setActiveView('alerts');
                    }}
                  >
                    Action
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column - Command & Teams */}
        <div className="space-y-6">
          {/* Quick Command */}
          <Card>
            <div className="p-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm text-neutral-900">Quick Command</h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Tourist Search */}
              <div>
                <label className="text-xs text-neutral-600 mb-2 block">Tourist Search</label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-sm h-9 border-neutral-300"
                  />
                  <Button
                    size="sm"
                    onClick={handleSearch}
                    className="bg-cyan-600 hover:bg-cyan-700 h-9 px-3"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Separator className="bg-neutral-200" />

              {/* Region Selector - using native select for compatibility */}
              <div>
                <label className="text-xs text-neutral-600 mb-2 block">Broadcast Region</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-neutral-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select region...</option>
                  <option value="mumbai">Mumbai (3,200)</option>
                  <option value="delhi">Delhi (4,850)</option>
                  <option value="agra">Agra (2,100)</option>
                  <option value="all">All Regions</option>
                </select>
              </div>

              <Separator className="bg-neutral-200" />

              {/* System Status */}
              <div className="space-y-2">
                <p className="text-xs text-neutral-600">System Health</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-600">GPS Tracking</span>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="text-green-600">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-600">Communications</span>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="text-green-600">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-600">Database</span>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="text-green-600">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Available Response Teams */}
          <Card className="border-green-200 bg-green-50/30">
            <div className="p-4 border-b border-green-200 bg-green-50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-green-900">Response Teams</h3>
                <Badge variant="outline" className="text-xs bg-white border-green-200 text-green-700">
                  {availableTeams.length} Available
                </Badge>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {availableTeams.map((team) => (
                <div
                  key={team.id}
                  className="p-3 bg-white rounded-lg border border-green-200 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-xs text-neutral-900">{team.id}</p>
                        <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                          {team.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-500">{team.location}</p>
                      <p className="text-xs text-neutral-500">ETA: {team.eta}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 h-7 text-xs"
                      onClick={() => handleTeamDeploy(team.id)}
                    >
                      Deploy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-xs border-neutral-300"
                      onClick={() => toast.info(`Calling ${team.id}`, { description: 'Establishing radio contact...' })}
                    >
                      <Phone className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
