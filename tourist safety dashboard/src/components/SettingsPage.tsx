/**
 * Settings Page Component
 * System configuration and preferences
 */

import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
    Settings, Bell, Shield, Database, Wifi,
    Save, RefreshCw, Moon, Sun, Globe,
    MapPin, Clock, Volume2, VolumeX
} from 'lucide-react';
import { toast } from 'sonner';

interface SettingsSection {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

function SettingsCard({ title, icon, children }: SettingsSection) {
    return (
        <Card className="bg-slate-800/50 border-slate-700 p-6">
            <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
                {icon}
                {title}
            </h3>
            <div className="space-y-4">
                {children}
            </div>
        </Card>
    );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0">
            <div>
                <p className="text-white font-medium">{label}</p>
                {description && <p className="text-slate-400 text-sm">{description}</p>}
            </div>
            {children}
        </div>
    );
}

export function SettingsPage() {
    const [settings, setSettings] = useState({
        // Notifications
        soundEnabled: true,
        desktopNotifications: true,
        sosAlertVolume: 80,

        // Map
        defaultZoom: 12,
        refreshInterval: 5,
        showInactiveDevices: true,

        // System
        darkMode: true,
        language: 'en',
        timezone: 'Asia/Kolkata',

        // API
        apiUrl: 'http://localhost:5000',
        wsUrl: 'http://localhost:5000'
    });

    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        // Simulate save
        await new Promise(r => setTimeout(r, 1000));
        localStorage.setItem('app_settings', JSON.stringify(settings));
        toast.success('Settings saved successfully');
        setSaving(false);
    };

    const handleReset = () => {
        // Reset to defaults
        setSettings({
            soundEnabled: true,
            desktopNotifications: true,
            sosAlertVolume: 80,
            defaultZoom: 12,
            refreshInterval: 5,
            showInactiveDevices: true,
            darkMode: true,
            language: 'en',
            timezone: 'Asia/Kolkata',
            apiUrl: 'http://localhost:5000',
            wsUrl: 'http://localhost:5000'
        });
        toast.info('Settings reset to defaults');
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
                        <Settings className="w-6 h-6 text-cyan-400" />
                        Settings
                    </h1>
                    <p className="text-slate-400 mt-1">Configure system preferences</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReset}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reset
                    </Button>
                    <Button className="bg-cyan-600 hover:bg-cyan-500" onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Notifications */}
                <SettingsCard title="Notifications" icon={<Bell className="w-5 h-5 text-cyan-400" />}>
                    <SettingRow label="Sound Alerts" description="Play sound for new alerts">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                            className={settings.soundEnabled ? 'bg-green-500/20 border-green-500/50' : ''}
                        >
                            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </Button>
                    </SettingRow>
                    <SettingRow label="Desktop Notifications" description="Show browser notifications">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSettings({ ...settings, desktopNotifications: !settings.desktopNotifications })}
                            className={settings.desktopNotifications ? 'bg-green-500/20 border-green-500/50' : ''}
                        >
                            {settings.desktopNotifications ? 'On' : 'Off'}
                        </Button>
                    </SettingRow>
                    <SettingRow label="SOS Alert Volume" description="Volume for critical alerts">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={settings.sosAlertVolume}
                            onChange={(e) => setSettings({ ...settings, sosAlertVolume: parseInt(e.target.value) })}
                            className="w-32"
                        />
                    </SettingRow>
                </SettingsCard>

                {/* Map Settings */}
                <SettingsCard title="Map Configuration" icon={<MapPin className="w-5 h-5 text-cyan-400" />}>
                    <SettingRow label="Default Zoom" description="Initial map zoom level">
                        <select
                            value={settings.defaultZoom}
                            onChange={(e) => setSettings({ ...settings, defaultZoom: parseInt(e.target.value) })}
                            className="bg-slate-900/50 border border-slate-600 rounded px-3 py-1 text-white"
                        >
                            {[8, 10, 12, 14, 16].map(z => (
                                <option key={z} value={z}>{z}</option>
                            ))}
                        </select>
                    </SettingRow>
                    <SettingRow label="Refresh Interval" description="Seconds between position updates">
                        <select
                            value={settings.refreshInterval}
                            onChange={(e) => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) })}
                            className="bg-slate-900/50 border border-slate-600 rounded px-3 py-1 text-white"
                        >
                            {[1, 2, 5, 10, 30].map(s => (
                                <option key={s} value={s}>{s}s</option>
                            ))}
                        </select>
                    </SettingRow>
                    <SettingRow label="Show Inactive Devices" description="Display offline tourist devices">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSettings({ ...settings, showInactiveDevices: !settings.showInactiveDevices })}
                            className={settings.showInactiveDevices ? 'bg-green-500/20 border-green-500/50' : ''}
                        >
                            {settings.showInactiveDevices ? 'Yes' : 'No'}
                        </Button>
                    </SettingRow>
                </SettingsCard>

                {/* Appearance */}
                <SettingsCard title="Appearance" icon={<Moon className="w-5 h-5 text-cyan-400" />}>
                    <SettingRow label="Theme" description="Dashboard color scheme">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
                            className={settings.darkMode ? 'bg-slate-600' : 'bg-yellow-500/20'}
                        >
                            {settings.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                            {settings.darkMode ? 'Dark' : 'Light'}
                        </Button>
                    </SettingRow>
                    <SettingRow label="Language" description="Interface language">
                        <select
                            value={settings.language}
                            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                            className="bg-slate-900/50 border border-slate-600 rounded px-3 py-1 text-white"
                        >
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                            <option value="ta">Tamil</option>
                        </select>
                    </SettingRow>
                    <SettingRow label="Timezone" description="Display time zone">
                        <select
                            value={settings.timezone}
                            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                            className="bg-slate-900/50 border border-slate-600 rounded px-3 py-1 text-white"
                        >
                            <option value="Asia/Kolkata">IST (India)</option>
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">EST</option>
                        </select>
                    </SettingRow>
                </SettingsCard>

                {/* Connection */}
                <SettingsCard title="Connection" icon={<Wifi className="w-5 h-5 text-cyan-400" />}>
                    <SettingRow label="API Server" description="Backend server URL">
                        <Input
                            value={settings.apiUrl}
                            onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
                            className="w-48 bg-slate-900/50 border-slate-600"
                            style={{ color: 'white' }}
                        />
                    </SettingRow>
                    <SettingRow label="WebSocket Server" description="Real-time connection URL">
                        <Input
                            value={settings.wsUrl}
                            onChange={(e) => setSettings({ ...settings, wsUrl: e.target.value })}
                            className="w-48 bg-slate-900/50 border-slate-600"
                            style={{ color: 'white' }}
                        />
                    </SettingRow>
                    <SettingRow label="Connection Status" description="Current server connection">
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            Connected
                        </Badge>
                    </SettingRow>
                </SettingsCard>
            </div>

            {/* System Info */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
                    <Database className="w-5 h-5 text-cyan-400" />
                    System Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900/50 rounded-lg p-4">
                        <p className="text-slate-400 text-sm">Version</p>
                        <p className="text-white font-medium">v1.0.0</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                        <p className="text-slate-400 text-sm">Build</p>
                        <p className="text-white font-medium">2026.01.09</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                        <p className="text-slate-400 text-sm">Environment</p>
                        <p className="text-white font-medium">Development</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                        <p className="text-slate-400 text-sm">Last Sync</p>
                        <p className="text-white font-medium">{new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default SettingsPage;
