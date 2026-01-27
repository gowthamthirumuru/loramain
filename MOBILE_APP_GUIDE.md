# 📱 Tourist Safety Mobile App - Complete Implementation Guide

> **A comprehensive, step-by-step guide to building a React Native Expo mobile app for the Tourist Safety System**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Setup](#project-setup)
4. [Project Structure](#project-structure)
5. [Theme & Design System](#theme--design-system)
6. [Authentication Module](#authentication-module)
7. [Home Screen & SOS Feature](#home-screen--sos-feature)
8. [Map & Location Features](#map--location-features)
9. [Background Location Tracking](#background-location-tracking)
10. [Push Notifications](#push-notifications)
11. [Offline Mode](#offline-mode)
12. [API Integration](#api-integration)
13. [Testing](#testing)
14. [Build & Deployment](#build--deployment)
15. [Troubleshooting](#troubleshooting)

---

## Overview

### What We're Building
A cross-platform mobile app (iOS + Android) for tourists that provides:
- **Emergency SOS alerts** with one-tap activation
- **Real-time location tracking** with background updates
- **Zone awareness** (safe/danger/restricted areas)
- **Trip management** (start/end trips, group tracking)
- **Offline functionality** for areas with poor connectivity

### Why Expo?
We're using **Expo** (managed workflow) because:
- ✅ Faster development (no native build setup)
- ✅ Over-the-air updates
- ✅ Built-in push notifications
- ✅ Easy background location
- ✅ Cross-platform from single codebase
- ✅ EAS Build for app store deployment

---

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | React Native + Expo | SDK 51+ |
| **Language** | TypeScript | 5.x |
| **Navigation** | Expo Router | v3 |
| **State Management** | Zustand | 4.x |
| **API Client** | Axios + TanStack Query | 5.x |
| **Maps** | react-native-maps | 1.x |
| **Location** | expo-location | 17.x |
| **Notifications** | expo-notifications | 0.28+ |
| **Styling** | NativeWind (TailwindCSS) | 4.x |
| **Storage** | AsyncStorage + SecureStore | - |
| **Forms** | React Hook Form + Zod | - |

---

## Project Setup

### Step 1: Create Expo Project

```bash
# Create new Expo project with TypeScript
npx create-expo-app@latest tourist-safety-app --template expo-template-blank-typescript

cd tourist-safety-app
```

### Step 2: Install Core Dependencies

```bash
# Navigation (Expo Router)
npx expo install expo-router expo-linking expo-constants expo-status-bar

# Maps & Location
npx expo install react-native-maps expo-location expo-task-manager

# Notifications
npx expo install expo-notifications expo-device

# Storage
npx expo install @react-native-async-storage/async-storage expo-secure-store

# State & API
npm install zustand axios @tanstack/react-query

# Forms
npm install react-hook-form zod @hookform/resolvers

# Styling (NativeWind)
npm install nativewind tailwindcss
npx tailwindcss init
```

### Step 3: Configure NativeWind

**tailwind.config.js:**
```javascript
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Dark theme matching web dashboard
        primary: '#06b6d4',    // Cyan-500
        secondary: '#3b82f6',  // Blue-500
        danger: '#ef4444',     // Red-500
        success: '#22c55e',    // Green-500
        warning: '#f59e0b',    // Amber-500
        dark: {
          900: '#0f172a',      // Slate-900
          800: '#1e293b',      // Slate-800
          700: '#334155',      // Slate-700
          600: '#475569',      // Slate-600
        }
      }
    }
  },
  plugins: [],
}
```

**babel.config.js:**
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel"
    ],
  };
};
```

### Step 4: Configure app.json

```json
{
  "expo": {
    "name": "Tourist Safety",
    "slug": "tourist-safety-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "touristsafety",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0f172a"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.touristsafety.app",
      "infoPlist": {
        "NSLocationAlwaysAndWhenInUseUsageDescription": "We need your location to ensure your safety and enable emergency SOS features.",
        "NSLocationWhenInUseUsageDescription": "We need your location to show you on the map.",
        "UIBackgroundModes": ["location", "fetch", "remote-notification"]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0f172a"
      },
      "package": "com.touristsafety.app",
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-location",
      "expo-notifications",
      "expo-secure-store"
    ]
  }
}
```

---

## Project Structure

```
tourist-safety-app/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Auth group (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── login.tsx             # Email/Phone login
│   │   ├── register.tsx          # New user registration
│   │   ├── otp.tsx               # OTP verification
│   │   └── forgot-password.tsx
│   ├── (tabs)/                   # Main app (authenticated)
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── index.tsx             # Home + SOS
│   │   ├── map.tsx               # Map view
│   │   ├── trip.tsx              # Trip management
│   │   └── profile.tsx           # User profile
│   ├── sos-active.tsx            # Full-screen SOS mode
│   ├── settings.tsx              # App settings
│   ├── _layout.tsx               # Root layout
│   └── +not-found.tsx
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── OTPInput.tsx
│   │   └── RegisterForm.tsx
│   ├── home/
│   │   ├── SOSButton.tsx         # Main SOS button
│   │   ├── StatusCard.tsx        # Connection status
│   │   ├── QuickActions.tsx      # Quick action buttons
│   │   └── TripBanner.tsx        # Active trip info
│   ├── map/
│   │   ├── MapView.tsx           # Main map component
│   │   ├── ZonePolygon.tsx       # Zone overlays
│   │   ├── UserMarker.tsx        # Current location
│   │   └── AnchorMarker.tsx      # LoRa anchor points
│   └── common/
│       ├── Header.tsx
│       ├── LoadingScreen.tsx
│       └── ErrorBoundary.tsx
├── services/
│   ├── api/
│   │   ├── client.ts             # Axios instance
│   │   ├── auth.ts               # Auth endpoints
│   │   ├── location.ts           # Location endpoints
│   │   ├── sos.ts                # SOS endpoints
│   │   └── zones.ts              # Zone endpoints
│   ├── location/
│   │   ├── tracker.ts            # Background location
│   │   ├── permissions.ts        # Permission handling
│   │   └── geofence.ts           # Geofencing logic
│   ├── notifications/
│   │   ├── handler.ts            # Notification handling
│   │   └── tokens.ts             # Push token management
│   └── websocket/
│       └── socket.ts             # Real-time connection
├── store/
│   ├── authStore.ts              # Auth state
│   ├── locationStore.ts          # Location state
│   ├── tripStore.ts              # Trip state
│   └── settingsStore.ts          # App settings
├── hooks/
│   ├── useAuth.ts
│   ├── useLocation.ts
│   ├── useSOS.ts
│   └── useZones.ts
├── utils/
│   ├── storage.ts                # AsyncStorage helpers
│   ├── validation.ts             # Zod schemas
│   └── format.ts                 # Formatters
├── constants/
│   ├── theme.ts                  # Colors, spacing
│   ├── api.ts                    # API URLs
│   └── config.ts                 # App config
├── types/
│   └── index.ts                  # TypeScript types
├── assets/
│   ├── icons/
│   ├── images/
│   └── fonts/
├── app.json
├── babel.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Theme & Design System

### constants/theme.ts

```typescript
export const COLORS = {
  // Primary colors
  primary: '#06b6d4',
  primaryDark: '#0891b2',
  secondary: '#3b82f6',
  
  // Status colors
  danger: '#ef4444',
  dangerDark: '#dc2626',
  success: '#22c55e',
  warning: '#f59e0b',
  
  // Dark theme backgrounds
  background: '#0f172a',
  surface: '#1e293b',
  surfaceLight: '#334155',
  border: '#475569',
  
  // Text colors
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  
  // SOS specific
  sosRed: '#ef4444',
  sosRedDark: '#b91c1c',
  sosGlow: 'rgba(239, 68, 68, 0.3)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
```

---

## Authentication Module

### Types (types/index.ts)

```typescript
export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  deviceId: string;
  emergencyContact: string;
  emergencyContactName: string;
  status: 'registered' | 'active' | 'sos' | 'offline';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password?: string;
  otp?: string;
}
```

### Auth Store (store/authStore.ts)

```typescript
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import { authApi } from '../services/api/auth';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (credentials: { email: string; password: string }) => Promise<void>;
  loginWithPhone: (phone: string) => Promise<void>;
  verifyOTP: (phone: string, otp: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login(credentials);
      const { user, token } = response.data;
      
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loginWithPhone: async (phone) => {
    await authApi.requestOTP(phone);
  },

  verifyOTP: async (phone, otp) => {
    set({ isLoading: true });
    try {
      const response = await authApi.verifyOTP(phone, otp);
      const { user, token } = response.data;
      
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register(data);
      const { user, token } = response.data;
      
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const userStr = await SecureStore.getItemAsync('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },
}));
```

### Login Screen (app/(auth)/login.tsx)

```typescript
import { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { COLORS } from '../../constants/theme';

// Validation schemas
const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const phoneSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
});

type LoginMode = 'email' | 'phone';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithPhone } = useAuthStore();
  const [mode, setMode] = useState<LoginMode>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', password: '' },
  });

  const phoneForm = useForm({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const handleEmailLogin = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setError('');
    try {
      await login(data);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async (data: { phone: string }) => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithPhone(data.phone);
      router.push({ pathname: '/(auth)/otp', params: { phone: data.phone } });
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-dark-900"
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center mb-4">
            <Text className="text-4xl">🛡️</Text>
          </View>
          <Text className="text-3xl font-bold text-white">Tourist Safety</Text>
          <Text className="text-slate-400 mt-2">Your safety companion</Text>
        </View>

        {/* Mode Toggle */}
        <View className="flex-row bg-dark-800 rounded-xl p-1 mb-6">
          <TouchableOpacity
            onPress={() => setMode('email')}
            className={`flex-1 py-3 rounded-lg ${mode === 'email' ? 'bg-primary' : ''}`}
          >
            <Text className={`text-center font-medium ${mode === 'email' ? 'text-white' : 'text-slate-400'}`}>
              Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('phone')}
            className={`flex-1 py-3 rounded-lg ${mode === 'phone' ? 'bg-primary' : ''}`}
          >
            <Text className={`text-center font-medium ${mode === 'phone' ? 'text-white' : 'text-slate-400'}`}>
              Phone
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {error ? (
          <View className="bg-danger/20 border border-danger/50 rounded-lg p-3 mb-4">
            <Text className="text-danger text-center">{error}</Text>
          </View>
        ) : null}

        {/* Email Login Form */}
        {mode === 'email' && (
          <View>
            <Controller
              control={emailForm.control}
              name="email"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={error?.message}
                />
              )}
            />
            <Controller
              control={emailForm.control}
              name="password"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  error={error?.message}
                />
              )}
            />
            <Button
              title="Sign In"
              onPress={emailForm.handleSubmit(handleEmailLogin)}
              loading={isLoading}
              className="mt-4"
            />
          </View>
        )}

        {/* Phone Login Form */}
        {mode === 'phone' && (
          <View>
            <Controller
              control={phoneForm.control}
              name="phone"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Input
                  label="Phone Number"
                  placeholder="+91 98765 43210"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  error={error?.message}
                />
              )}
            />
            <Button
              title="Send OTP"
              onPress={phoneForm.handleSubmit(handlePhoneLogin)}
              loading={isLoading}
              className="mt-4"
            />
          </View>
        )}

        {/* Links */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-slate-400">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text className="text-primary font-medium">Register</Text>
          </TouchableOpacity>
        </View>

        {mode === 'email' && (
          <TouchableOpacity 
            onPress={() => router.push('/(auth)/forgot-password')}
            className="mt-4"
          >
            <Text className="text-center text-slate-400">Forgot Password?</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
```

---

## Home Screen & SOS Feature

### SOS Button Component (components/home/SOSButton.tsx)

```typescript
import { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated, Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSOS } from '../../hooks/useSOS';
import { COLORS } from '../../constants/theme';

const HOLD_DURATION = 2000; // 2 seconds to activate

export function SOSButton() {
  const router = useRouter();
  const { triggerSOS, isActive } = useSOS();
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<number>(0);

  // Pulsing animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handlePressIn = () => {
    setIsHolding(true);
    startTime.current = Date.now();

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      Vibration.vibrate([0, 50, 50, 50]);
    }

    // Progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: false,
    }).start();

    // Update progress every 50ms
    holdTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const prog = Math.min(elapsed / HOLD_DURATION, 1);
      setProgress(prog);

      if (prog >= 1) {
        activateSOS();
      }
    }, 50);
  };

  const handlePressOut = () => {
    setIsHolding(false);
    setProgress(0);
    progressAnim.stopAnimation();
    progressAnim.setValue(0);

    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const activateSOS = async () => {
    handlePressOut();
    
    // Strong haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Vibration.vibrate([0, 200, 100, 200, 100, 200]);
    }

    try {
      await triggerSOS();
      router.push('/sos-active');
    } catch (error) {
      console.error('Failed to trigger SOS:', error);
    }
  };

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View className="items-center justify-center">
      {/* Outer glow */}
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }],
          position: 'absolute',
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: COLORS.sosGlow,
        }}
      />

      {/* Progress ring */}
      <View className="absolute">
        <svg width={200} height={200}>
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke={COLORS.danger}
            strokeWidth="8"
            fill="none"
            opacity={0.3}
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke={COLORS.danger}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90, 100, 100)"
          />
        </svg>
      </View>

      {/* Main button */}
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={`w-44 h-44 rounded-full items-center justify-center ${
          isHolding ? 'bg-danger' : 'bg-danger/90'
        }`}
        style={{
          shadowColor: COLORS.danger,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        <Text className="text-white text-5xl font-bold">SOS</Text>
        <Text className="text-white/80 text-sm mt-1">
          {isHolding ? `${Math.round(progress * 100)}%` : 'Hold for 2s'}
        </Text>
      </Pressable>
    </View>
  );
}
```

### Home Screen (app/(tabs)/index.tsx)

```typescript
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SOSButton } from '../../components/home/SOSButton';
import { StatusCard } from '../../components/home/StatusCard';
import { QuickActions } from '../../components/home/QuickActions';
import { TripBanner } from '../../components/home/TripBanner';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { activeTrip } = useTripStore();

  return (
    <SafeAreaView className="flex-1 bg-dark-900">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <Text className="text-slate-400 text-sm">Welcome back,</Text>
          <Text className="text-white text-2xl font-bold">{user?.name}</Text>
        </View>

        {/* Active Trip Banner */}
        {activeTrip && <TripBanner trip={activeTrip} />}

        {/* Status Cards */}
        <View className="px-6 py-4">
          <StatusCard />
        </View>

        {/* SOS Button - Center */}
        <View className="flex-1 items-center justify-center py-8">
          <Text className="text-slate-400 mb-4">Emergency? Hold the button</Text>
          <SOSButton />
        </View>

        {/* Quick Actions */}
        <View className="px-6 pb-8">
          <QuickActions />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Map & Location Features

### Map View (app/(tabs)/map.tsx)

```typescript
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useZones } from '../../hooks/useZones';
import { useLocationStore } from '../../store/locationStore';
import { COLORS } from '../../constants/theme';

const ZONE_COLORS = {
  safe: { fill: 'rgba(34, 197, 94, 0.2)', stroke: '#22c55e' },
  danger: { fill: 'rgba(239, 68, 68, 0.2)', stroke: '#ef4444' },
  restricted: { fill: 'rgba(245, 158, 11, 0.2)', stroke: '#f59e0b' },
};

export default function MapScreen() {
  const { currentLocation } = useLocationStore();
  const { zones, anchors, isLoading } = useZones();
  const [region, setRegion] = useState({
    latitude: 27.1751,
    longitude: 78.0421,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    if (currentLocation) {
      setRegion({
        ...region,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
    }
  }, [currentLocation]);

  return (
    <View className="flex-1">
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        region={region}
        showsUserLocation
        showsMyLocationButton
        customMapStyle={darkMapStyle}
      >
        {/* Zone Polygons */}
        {zones.map((zone) => (
          <Polygon
            key={zone._id}
            coordinates={zone.boundary.coordinates[0].map(([lng, lat]) => ({
              latitude: lat,
              longitude: lng,
            }))}
            fillColor={ZONE_COLORS[zone.type]?.fill || ZONE_COLORS.safe.fill}
            strokeColor={ZONE_COLORS[zone.type]?.stroke || ZONE_COLORS.safe.stroke}
            strokeWidth={2}
          />
        ))}

        {/* Anchor Markers */}
        {anchors.map((anchor) => (
          <Marker
            key={anchor._id}
            coordinate={{
              latitude: anchor.gps_position.lat,
              longitude: anchor.gps_position.lng,
            }}
            title={anchor.name}
            description={anchor.is_master ? 'Master Node' : 'Relay Node'}
          >
            <View className="bg-purple-500 p-2 rounded-full">
              <Text className="text-white text-xs">📡</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Map Legend */}
      <View className="absolute bottom-4 left-4 bg-dark-800/90 rounded-lg p-3">
        <Text className="text-white font-medium mb-2">Legend</Text>
        {Object.entries(ZONE_COLORS).map(([type, colors]) => (
          <View key={type} className="flex-row items-center mb-1">
            <View 
              className="w-4 h-4 rounded mr-2"
              style={{ backgroundColor: colors.stroke }}
            />
            <Text className="text-slate-300 text-sm capitalize">{type} Zone</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Dark map style for Google Maps
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c4a6e' }] },
];
```

---

## Background Location Tracking

### Location Service (services/location/tracker.ts)

```typescript
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useLocationStore } from '../../store/locationStore';
import { locationApi } from '../api/location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_TASK_NAME = 'TOURIST_SAFETY_LOCATION_TASK';
const LOCATION_CACHE_KEY = 'CACHED_LOCATIONS';

// Define background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];

    if (location) {
      try {
        // Try to send to backend
        await locationApi.updateLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        });
      } catch (error) {
        // Cache for later if offline
        const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
        const cachedLocations = cached ? JSON.parse(cached) : [];
        cachedLocations.push({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
        });
        await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cachedLocations));
      }
    }
  }
});

export const LocationTracker = {
  async requestPermissions(): Promise<boolean> {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    return backgroundStatus === 'granted';
  },

  async startTracking(): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (isTracking) {
      return; // Already tracking
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      distanceInterval: 10, // Update every 10 meters
      timeInterval: 30000,  // Or every 30 seconds
      foregroundService: {
        notificationTitle: 'Tourist Safety Active',
        notificationBody: 'Your location is being tracked for your safety',
        notificationColor: '#06b6d4',
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    });
  },

  async stopTracking(): Promise<void> {
    const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (isTracking) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  },

  async getCurrentLocation(): Promise<Location.LocationObject> {
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
  },

  async syncCachedLocations(): Promise<void> {
    const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (cached) {
      const locations = JSON.parse(cached);
      if (locations.length > 0) {
        try {
          await locationApi.batchUpdateLocations(locations);
          await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
        } catch (error) {
          console.error('Failed to sync cached locations:', error);
        }
      }
    }
  },
};
```

---

## Push Notifications

### Notification Handler (services/notifications/handler.ts)

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { notificationApi } from '../api/notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationService = {
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Android-specific channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('sos', {
        name: 'SOS Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ef4444',
        sound: 'sos_alert.wav',
      });

      await Notifications.setNotificationChannelAsync('zones', {
        name: 'Zone Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 100, 100, 100],
      });
    }

    const token = await Notifications.getExpoPushTokenAsync();
    
    // Send token to backend
    try {
      await notificationApi.registerPushToken(token.data);
    } catch (error) {
      console.error('Failed to register push token:', error);
    }

    return token.data;
  },

  setupNotificationListeners(navigation: any) {
    // Handle notification received while app is foregrounded
    const foregroundSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Handle notification tap
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        
        // Navigate based on notification type
        if (data.type === 'zone_alert') {
          navigation.navigate('map');
        } else if (data.type === 'sos_update') {
          navigation.navigate('sos-active');
        }
      }
    );

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  },

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Immediate
    });
  },
};
```

---

## API Integration

### API Client (services/api/client.ts)

```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../../constants/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - logout
      await SecureStore.deleteItemAsync('authToken');
      // Navigate to login
    }
    return Promise.reject(error.response?.data || error);
  }
);

export { apiClient };
```

### SOS API (services/api/sos.ts)

```typescript
import { apiClient } from './client';
import * as Location from 'expo-location';

export const sosApi = {
  async trigger() {
    const location = await Location.getCurrentPositionAsync();
    
    return apiClient.post('/sos/trigger', {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: new Date().toISOString(),
    });
  },

  async cancel(sosId: string, reason?: string) {
    return apiClient.post(`/sos/${sosId}/cancel`, { reason });
  },

  async getActiveAlert() {
    return apiClient.get('/sos/active');
  },

  async getHistory() {
    return apiClient.get('/sos/history');
  },
};
```

---

## Build & Deployment

### EAS Build Setup

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS Build
eas build:configure
```

### eas.json

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Build Commands

```bash
# Development build (with dev client)
eas build --profile development --platform all

# Preview APK (for testing)
eas build --profile preview --platform android

# Production build
eas build --profile production --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## Testing Checklist

### Unit Tests
- [ ] Auth store actions
- [ ] SOS hook logic
- [ ] Location service
- [ ] API error handling

### Integration Tests
- [ ] Login flow (email + phone)
- [ ] SOS trigger → backend → dashboard
- [ ] Background location updates
- [ ] Push notification handling

### Device Tests
- [ ] SOS button hold-to-activate
- [ ] Map zone display
- [ ] Background tracking (app closed)
- [ ] Offline mode caching
- [ ] Battery impact measurement

### Platform-Specific
- [ ] iOS: Background modes
- [ ] iOS: Location always permission
- [ ] Android: Foreground service notification
- [ ] Android: Battery optimization exemption

---

## Timeline Summary

| Day | Phase | Deliverables |
|-----|-------|--------------|
| 1 | Setup | Project, deps, theme |
| 2 | Auth | Login, register, OTP |
| 3-4 | Home + SOS | SOS button, status cards |
| 5-6 | Maps | Zone display, anchors |
| 7 | Background | Location tracking |
| 8 | Notifications | Push, geofencing |
| 9-10 | Polish | Offline, testing, bugs |

---

## Quick Start Commands

```bash
# Create project
npx create-expo-app@latest tourist-safety-app -t expo-template-blank-typescript
cd tourist-safety-app

# Install all dependencies
npx expo install expo-router expo-linking expo-constants expo-status-bar react-native-maps expo-location expo-task-manager expo-notifications expo-device @react-native-async-storage/async-storage expo-secure-store
npm install zustand axios @tanstack/react-query react-hook-form zod @hookform/resolvers nativewind tailwindcss

# Configure TailwindCSS
npx tailwindcss init

# Start development
npx expo start
```

---

**Ready to build! 🚀**
