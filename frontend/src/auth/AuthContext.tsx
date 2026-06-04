import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi, tokenManager, type AuthUser } from '../api/authApi';
import { websocketService } from '../services/websocket';

// ============================================
// Auth Types
// ============================================

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'operator' | 'viewer';
    accessLevel: number;
    avatar?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Convert backend user to frontend user format
const convertUser = (backendUser: AuthUser): User => ({
    id: backendUser.id,
    name: backendUser.name,
    email: backendUser.email,
    role: backendUser.role === 'admin' ? 'admin' : backendUser.role === 'operator' ? 'operator' : 'viewer',
    accessLevel: backendUser.role === 'admin' ? 5 : backendUser.role === 'operator' ? 4 : 3,
});

// ============================================
// Auth Provider
// ============================================

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
    });

    // Check for existing session on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = tokenManager.getToken();
            const storedUser = tokenManager.getUser();

            if (token && storedUser) {
                try {
                    // Verify token is still valid by calling getMe
                    const user = await authApi.getMe();
                    setState({
                        user: convertUser(user),
                        isAuthenticated: true,
                        isLoading: false,
                    });
                    // Connect WebSocket after auth verified
                    websocketService.connect();
                } catch (error) {
                    // Token invalid, clear and show login
                    console.error('Auth token invalid:', error);
                    tokenManager.clearTokens();
                    setState({ user: null, isAuthenticated: false, isLoading: false });
                }
            } else {
                setState({ user: null, isAuthenticated: false, isLoading: false });
            }
        };

        checkAuth();
    }, []);

    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const result = await authApi.login({ email, password });
            const user = convertUser(result.user);

            setState({
                user,
                isAuthenticated: true,
                isLoading: false,
            });

            // Connect WebSocket after successful login
            websocketService.connect();

            return true;
        } catch (error: any) {
            console.error('Login failed:', error);
            setState(prev => ({ ...prev, isLoading: false }));
            return false;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }

        // Disconnect WebSocket
        websocketService.disconnect();

        setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
        });
    }, []);

    const updateProfile = useCallback((updates: Partial<User>) => {
        setState(prev => {
            if (!prev.user) return prev;
            const updatedUser = { ...prev.user, ...updates };
            // Update in localStorage too
            const storedUser = tokenManager.getUser();
            if (storedUser) {
                tokenManager.setUser({ ...storedUser, ...updates } as AuthUser);
            }
            return { ...prev, user: updatedUser };
        });
    }, []);

    return (
        <AuthContext.Provider value={{ ...state, login, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

// ============================================
// Hook to use Auth Context
// ============================================

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
