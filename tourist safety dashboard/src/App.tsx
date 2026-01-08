import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { DashboardOverview } from "./components/DashboardOverview";
import { MapView } from "./components/MapView";
import { AlertsManagement } from "./components/AlertsManagement";
import { ReportsView } from "./components/ReportsView";
import { EmergencyResponse } from "./components/EmergencyResponse";
import { AnalyticsView } from "./components/AnalyticsView";
import { CommunicationCenter } from "./components/CommunicationCenter";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { LoginPage } from "./components/LoginPage";
import { Toaster } from "./components/ui/sonner";
import { useAuth } from "./auth/AuthContext";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import {
  Bell,
  Settings,
  User,
  Search,
  HelpCircle,
  LogOut,
  Shield,
  Moon,
  Sun,
  Globe,
  Wifi,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { useDashboardStore, useNotifications, useUnreadNotificationsCount } from "./store/store";

export default function App() {
  // Authentication
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  // Use Zustand store for state management
  const { activeView, setActiveView, markNotificationRead } = useDashboardStore();
  const notifications = useNotifications();
  const unreadCount = useUnreadNotificationsCount();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-300 text-sm">Loading...</p>
        </div>
        <Toaster />
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  const handleNotificationClick = (notificationId: number) => {
    markNotificationRead(notificationId);
    toast.info("Viewing notification details", {
      description:
        "Opening detailed view for selected notification.",
    });
  };

  const handleProfileAction = (action: string) => {
    switch (action) {
      case "profile":
        toast.info("Opening user profile", {
          description: "Redirecting to profile management.",
        });
        break;
      case "settings":
        toast.info("Opening system settings", {
          description:
            "Accessing administrative configuration.",
        });
        break;
      case "logout":
        logout();
        toast.info("Logged out securely", {
          description:
            "Session ended. Redirecting to login.",
        });
        break;
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "search":
        toast.info("Global search activated", {
          description:
            "Search across all tourists, incidents, and reports.",
        });
        break;
      case "help":
        toast.info("Emergency procedures guide", {
          description:
            "Opening command center operation manual.",
        });
        break;
    }
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "overview":
        return <DashboardOverview />;
      case "map":
        return <MapView />;
      case "alerts":
        return <AlertsManagement />;
      case "reports":
        return <ReportsView />;
      case "emergency":
        return <EmergencyResponse />;
      case "analytics":
        return <AnalyticsView />;
      case "communication":
        return <CommunicationCenter />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-neutral-200 px-6 py-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            {/* Left Section - Title */}
            <div>
              <h1 className="text-lg text-neutral-900">
                Tourist Safety Command Center
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Real-time monitoring and emergency response system
              </p>
            </div>

            {/* Right Section - Actions and User Controls */}
            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <ConnectionStatus />

              {/* Divider */}
              <div className="h-6 w-px bg-neutral-200"></div>

              {/* Emergency Help */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("help")}
                className="h-9 w-9 p-0 border-neutral-300 hover:bg-neutral-50"
              >
                <HelpCircle className="w-4 h-4 text-neutral-600" />
              </Button>

              {/* Notifications */}
              <Popover
                open={notificationsOpen}
                onOpenChange={setNotificationsOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="relative h-9 w-9 p-0 border-neutral-300 hover:bg-neutral-50"
                  >
                    <Bell className="w-4 h-4 text-neutral-600" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center text-xs p-0"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 p-0 border-neutral-200"
                  align="end"
                >
                  <div className="p-3 border-b border-neutral-200 bg-neutral-50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm">
                        Notifications
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {unreadCount} new
                      </Badge>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors ${!notification.read ? "bg-cyan-50/30" : ""
                          }`}
                        onClick={() =>
                          handleNotificationClick(
                            notification.id,
                          )
                        }
                      >
                        <div className="flex items-start space-x-2">
                          <div
                            className={`w-1.5 h-1.5 rounded-full mt-1.5 ${notification.severity ===
                              "critical"
                              ? "bg-red-500"
                              : notification.severity ===
                                "warning"
                                ? "bg-amber-500"
                                : "bg-cyan-500"
                              }`}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-neutral-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-neutral-600 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 border-t border-neutral-200 bg-neutral-50">
                    <Button
                      variant="outline"
                      className="w-full text-xs h-8 border-neutral-300"
                      onClick={() => {
                        setNotificationsOpen(false);
                        setActiveView('alerts');
                        toast.info('Viewing all notifications');
                      }}
                    >
                      View All Notifications
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Settings */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 border-neutral-300 hover:bg-neutral-50"
                  >
                    <Settings className="w-4 h-4 text-neutral-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">
                    System Settings
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      handleProfileAction("settings")
                    }
                    className="text-sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Preferences
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm"
                    onClick={() => toast.info('Language settings', { description: 'Currently set to English (US)' })}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Language
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm"
                    onClick={() => toast.info('Security settings', { description: 'Two-factor authentication enabled' })}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Security
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-sm"
                    onClick={() => toast.info('Theme', { description: 'Switching between light/dark mode' })}
                  >
                    <Sun className="w-4 h-4 mr-2" />
                    Theme
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full p-0 hover:bg-neutral-100"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src="/placeholder-avatar.jpg"
                        alt="Command Officer"
                      />
                      <AvatarFallback className="bg-cyan-600 text-white text-sm">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email || 'Not logged in'}
                      </p>
                      <div className="flex items-center space-x-2 pt-1">
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          Level {user?.accessLevel || 0} Access
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {user?.role || 'guest'}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      handleProfileAction("profile")
                    }
                    className="text-sm"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleProfileAction("settings")
                    }
                    className="text-sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm"
                    onClick={() => toast.info('Security Log', { description: 'Last login: Today at 09:15 AM' })}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Security Log
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      handleProfileAction("logout")
                    }
                    className="text-red-600 focus:text-red-600 text-sm"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-background">
          {renderActiveView()}
        </main>
      </div>
      <Toaster />
    </div>
  );
}