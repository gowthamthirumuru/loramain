import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ============================================
// Auth Types
// ============================================

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'supervisor' | 'officer';
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

// ============================================
// Demo Users
// ============================================

const DEMO_USERS: Record<string, { password: string; user: User }> = {
    'admin@tourism-safety.gov': {
        password: 'admin123',
        user: {
            id: 'USR-001',
            name: 'Command Officer',
            email: 'admin@tourism-safety.gov',
            role: 'admin',
            accessLevel: 5,
        }
    },
    'supervisor@tourism-safety.gov': {
        password: 'super123',
        user: {
            id: 'USR-002',
            name: 'Shift Supervisor',
            email: 'supervisor@tourism-safety.gov',
            role: 'supervisor',
            accessLevel: 4,
        }
    },
    'officer@tourism-safety.gov': {
        password: 'officer123',
        user: {
            id: 'USR-003',
            name: 'Field Officer',
            email: 'officer@tourism-safety.gov',
            role: 'officer',
            accessLevel: 3,
        }
    }
};

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
        const storedUser = localStorage.getItem('auth_user');
        const token = localStorage.getItem('auth_token');

        if (storedUser && token) {
            try {
                const user = JSON.parse(storedUser);
                setState({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } catch {
                localStorage.removeItem('auth_user');
                localStorage.removeItem('auth_token');
                setState({ user: null, isAuthenticated: false, isLoading: false });
            }
        } else {
            setState({ user: null, isAuthenticated: false, isLoading: false });
        }
    }, []);

    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        setState(prev => ({ ...prev, isLoading: true }));

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const userEntry = DEMO_USERS[email.toLowerCase()];

        if (userEntry && userEntry.password === password) {
            const token = `demo-token-${Date.now()}`;
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(userEntry.user));

            setState({
                user: userEntry.user,
                isAuthenticated: true,
                isLoading: false,
            });
            return true;
        }

        setState(prev => ({ ...prev, isLoading: false }));
        return false;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
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
            localStorage.setItem('auth_user', JSON.stringify(updatedUser));
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
