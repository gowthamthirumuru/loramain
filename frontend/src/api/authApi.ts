/**
 * Auth API
 * Handles authentication with the backend
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance for auth
const authClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============================================
// Types
// ============================================

export interface AuthUser {
    id: string;
    username: string;
    email: string;
    name: string;
    role: 'admin' | 'operator' | 'viewer';
    preferences?: {
        notifications: boolean;
        darkMode: boolean;
    };
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    name: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: AuthUser;
        token: string;
        refreshToken: string;
    };
}

// ============================================
// Token Management
// ============================================

export const tokenManager = {
    getToken: () => localStorage.getItem('auth_token'),
    getRefreshToken: () => localStorage.getItem('refresh_token'),

    setTokens: (token: string, refreshToken: string) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('refresh_token', refreshToken);
    },

    clearTokens: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    },

    getUser: (): AuthUser | null => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    setUser: (user: AuthUser) => {
        localStorage.setItem('user', JSON.stringify(user));
    },

    isAuthenticated: () => {
        const token = localStorage.getItem('auth_token');
        return !!token;
    }
};

// ============================================
// Auth API Functions
// ============================================

export const authApi = {
    /**
     * Login with email and password
     */
    login: async (credentials: LoginCredentials): Promise<AuthResponse['data']> => {
        const response = await authClient.post<AuthResponse>('/auth/login', credentials);
        const { user, token, refreshToken } = response.data.data;

        // Store tokens and user
        tokenManager.setTokens(token, refreshToken);
        tokenManager.setUser(user);

        return response.data.data;
    },

    /**
     * Register new user
     */
    register: async (data: RegisterData): Promise<AuthResponse['data']> => {
        const response = await authClient.post<AuthResponse>('/auth/register', data);
        const { user, token, refreshToken } = response.data.data;

        // Store tokens and user
        tokenManager.setTokens(token, refreshToken);
        tokenManager.setUser(user);

        return response.data.data;
    },

    /**
     * Logout
     */
    logout: async (): Promise<void> => {
        try {
            const token = tokenManager.getToken();
            if (token) {
                await authClient.post('/auth/logout', {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (error) {
            // Ignore errors, clear tokens anyway
        } finally {
            tokenManager.clearTokens();
        }
    },

    /**
     * Refresh access token
     */
    refreshToken: async (): Promise<{ token: string; refreshToken: string }> => {
        const refreshToken = tokenManager.getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await authClient.post<{ success: boolean; data: { token: string; refreshToken: string } }>(
            '/auth/refresh',
            { refreshToken }
        );

        const { token, refreshToken: newRefreshToken } = response.data.data;
        tokenManager.setTokens(token, newRefreshToken);

        return response.data.data;
    },

    /**
     * Get current user profile
     */
    getMe: async (): Promise<AuthUser> => {
        const token = tokenManager.getToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await authClient.get<{ success: boolean; data: AuthUser }>('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });

        tokenManager.setUser(response.data.data);
        return response.data.data;
    }
};

export default authApi;
