import React from 'react';
import { Home, Map, AlertTriangle, FileText, Phone, BarChart3, MessageSquare, Shield, Users, Settings, Layers, Radio, UserPlus, ClipboardList } from 'lucide-react';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { useAlerts, useTeams, useDashboardStore } from '../store/store';
import { useAuth } from '../auth/AuthContext';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export function Sidebar({ activeView, setActiveView }: SidebarProps) {
  // Use Zustand store for dynamic counts
  const alerts = useAlerts();
  const teams = useTeams();
  const { conversations } = useDashboardStore();
  const { user } = useAuth();

  // Calculate dynamic counts
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const safeTeams = Array.isArray(teams) ? teams : [];

  const activeAlertCount = safeAlerts.filter(a => a.status === 'active' || a.status === 'responding').length;
  const unreadMessageCount = safeConversations.reduce((acc, c) => acc + c.unread, 0);
  const availableTeamCount = safeTeams.filter(t => t.status === 'available').length;
  const totalTeamCount = safeTeams.length;

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'map', label: 'Live Map', icon: Map },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: activeAlertCount > 0 ? activeAlertCount : undefined },
    { id: 'emergency', label: 'Emergency Response', icon: Phone },
    { id: 'zones', label: 'Zones', icon: Layers },
    { id: 'tourists', label: 'Tourists', icon: UserPlus },
    { id: 'devices', label: 'Devices', icon: Radio },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'communication', label: 'Communications', icon: MessageSquare, badge: unreadMessageCount > 0 ? unreadMessageCount : undefined },
    { id: 'reports', label: 'Reports', icon: FileText },
    // Admin-only items
    ...(user?.role === 'admin' ? [
      { id: 'users', label: 'User Management', icon: Users },
      { id: 'audit', label: 'Audit Logs', icon: ClipboardList },
    ] : []),
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-[#18181b] text-white flex flex-col h-full shadow-xl">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-600 p-2.5 rounded-lg shadow-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm tracking-wide">Command Center</h2>
            <p className="text-xs text-neutral-400">Tourist Safety</p>
          </div>
        </div>
      </div>

      <Separator className="bg-neutral-800" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-all duration-200 group ${isActive
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-white'}`} />
                <span className="text-sm">{item.label}</span>
              </div>
              {item.badge && (
                <Badge
                  variant="destructive"
                  className="h-5 min-w-5 flex items-center justify-center px-1.5 text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      <Separator className="bg-neutral-800" />

      {/* System Status - Dynamic */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-400">System Status</span>
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-500">Online</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-400">Active Teams</span>
          <span className="text-white">{totalTeamCount - availableTeamCount} / {totalTeamCount}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-400">Emergency Line</span>
          <span className="text-white font-mono">1-800-SAFE</span>
        </div>
      </div>
    </div>
  );
}
