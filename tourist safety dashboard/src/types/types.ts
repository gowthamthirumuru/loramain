// Tourist Safety Dashboard - Type Definitions

// ============================================
// Base Types
// ============================================

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'active' | 'responding' | 'investigating' | 'resolved';
export type EmergencyStatus = 'dispatched' | 'in_progress' | 'searching' | 'resolved';
export type TeamStatus = 'available' | 'responding' | 'patrol' | 'offline';
export type ConversationType = 'radio' | 'phone' | 'email';
export type ConversationStatus = 'active' | 'waiting' | 'standby' | 'closed';

// ============================================
// Tourist Types
// ============================================

export interface Tourist {
  id: string;
  name: string;
  nationality: string;
  phone: string;
  email?: string;
  passport?: string;
  location?: GeoLocation;
  emergencyContact?: string;
  registrationDate: string;
  last_seen?: string | Date; // Unified with backend
  status?: string;
  device_id?: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  x?: number; // Local coordinates
  y?: number; // Local coordinates
  address?: string;
  landmark?: string;
}

// ============================================
// Alert Types
// ============================================

export interface Alert {
  id: string;
  type: string;
  severity: Severity;
  status: AlertStatus;
  location: string;
  coordinates?: string;
  tourist: string;
  touristId?: string;
  phone: string;
  description: string;
  time: string;
  createdAt: string;
  assignedTeam?: string;
  priority: number;
}

// ============================================
// Emergency Types
// ============================================

export interface Emergency {
  id: string;
  type: string;
  severity: Severity;
  status: EmergencyStatus;
  location: string;
  coordinates: string;
  tourist: string;
  touristId?: string;
  timeElapsed: string;
  createdAt: string;
  assignedTeam: string;
  responseTime?: number;
  resolvedAt?: string;
  notes?: string;
}

// ============================================
// Team Types
// ============================================

export interface ResponseTeam {
  id: string;
  name: string;
  type: 'Medical' | 'Security' | 'Tourist Aid' | 'Search & Rescue';
  status: TeamStatus;
  location: string;
  coordinates?: GeoLocation;
  members: number;
  eta?: string;
  currentAssignment?: string;
}

// ============================================
// Communication Types
// ============================================

export interface Conversation {
  id: number;
  participant: string;
  type: ConversationType;
  status: ConversationStatus;
  lastMessage: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  unread: number;
}

export interface Message {
  id: number;
  conversationId: number;
  sender: string;
  message: string;
  time: string;
  isOwnMessage: boolean;
  read?: boolean;
}

// ============================================
// Report Types
// ============================================

export interface ReportTemplate {
  id: number;
  name: string;
  description: string;
  type: 'incident' | 'analysis' | 'tourism' | 'performance' | 'risk' | 'custom';
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'On-demand';
  lastGenerated?: string;
  size?: string;
}

export interface GeneratedReport {
  id: number;
  name: string;
  type: string;
  dateRange: string;
  createdBy: string;
  createdAt: string;
  status: 'completed' | 'processing' | 'failed';
  size?: string;
  downloads?: number;
  downloadUrl?: string;
}

// ============================================
// Anchor Types
// ============================================

export interface Anchor {
  id: string;
  anchor_id: string;
  name: string;
  local_position: { x: number; y: number };
  gps_position?: { lat: number; lng: number };
  status: string;
  last_heartbeat?: string;
}

// ============================================
// Analytics Types
// ============================================

export interface IncidentTrend {
  date: string;
  incidents: number;
  resolved: number;
  responseTime: number;
}

export interface TouristFlow {
  month: string;
  domestic: number;
  international: number;
}

export interface IncidentCategory {
  name: string;
  value: number;
  trend: string;
  color: string;
}

// ============================================
// Notification Types
// ============================================

export interface Notification {
  id: number;
  type: 'emergency' | 'system' | 'weather' | 'alert';
  title: string;
  message: string;
  time: string;
  read: boolean;
  severity: 'critical' | 'warning' | 'info';
  actionUrl?: string;
}

// ============================================
// Dashboard Metrics
// ============================================

export interface DashboardMetrics {
  activeEmergencies: number;
  avgResponseTime: number;
  availableTeams: number;
  totalTeams: number;
  touristsTracked: number;
  touristsChange: number;
}

// ============================================
// System Status
// ============================================

export interface SystemStatus {
  gpsTracking: 'online' | 'offline' | 'degraded';
  communications: 'online' | 'offline' | 'degraded';
  database: 'online' | 'offline' | 'degraded';
  websocket: 'connected' | 'disconnected' | 'connecting';
}
