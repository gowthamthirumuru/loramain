import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Shield, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login, isLoading } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        const success = await login(email, password);

        if (success) {
            toast.success('Login successful', {
                description: 'Welcome to the Command Center'
            });
        } else {
            setError('Invalid email or password');
            toast.error('Login failed', {
                description: 'Please check your credentials'
            });
        }
    };

    const handleDemoLogin = async (userType: 'admin' | 'supervisor' | 'officer') => {
        const credentials = {
            admin: { email: 'admin@tourism-safety.gov', password: 'admin123' },
            supervisor: { email: 'supervisor@tourism-safety.gov', password: 'super123' },
            officer: { email: 'officer@tourism-safety.gov', password: 'officer123' },
        };

        const cred = credentials[userType];
        setEmail(cred.email);
        setPassword(cred.password);

        const success = await login(cred.email, cred.password);
        if (success) {
            toast.success(`Logged in as ${userType}`, {
                description: 'Welcome to the Command Center'
            });
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #164e63 50%, #0f172a 100%)' }}
        >
            {/* Background Grid Pattern */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="relative w-full max-w-md">
                {/* Logo Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-600 shadow-lg shadow-cyan-500/30 mb-4">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-semibold text-white">Tourist Safety</h1>
                    <p className="text-cyan-200/70 text-sm mt-1">Command Center Portal</p>
                </div>

                {/* Login Card */}
                <Card className="backdrop-blur-xl shadow-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}>
                    <div className="p-8">
                        <div className="text-center mb-6">
                            <h2 className="text-lg font-medium text-white">Sign In</h2>
                            <p className="text-sm text-white/60 mt-1">Access your command dashboard</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="flex items-center space-x-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-red-400" />
                                    <span className="text-sm text-red-300">{error}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm text-white/80">Email</label>
                                <Input
                                    type="email"
                                    placeholder="officer@tourism-safety.gov"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="border-white/20 placeholder:text-gray-400 focus:border-cyan-400"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-white/80">Password</label>
                                <div className="relative" style={{ position: 'relative' }}>
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="border-white/20 placeholder:text-gray-400 focus:border-cyan-400"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', paddingRight: '40px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        className="text-white/60 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center space-x-2 text-white/60">
                                    <input type="checkbox" className="rounded border-white/30 bg-white/10" />
                                    <span>Remember me</span>
                                </label>
                                <button
                                    type="button"
                                    className="text-cyan-400 hover:text-cyan-300"
                                    onClick={() => toast.info('Password reset', { description: 'Contact your administrator' })}
                                >
                                    Forgot password?
                                </button>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white h-11 mt-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        {/* Demo Accounts */}
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <p className="text-xs text-white/50 text-center mb-4">Quick Demo Access</p>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDemoLogin('admin')}
                                    disabled={isLoading}
                                    className="bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:text-white text-xs"
                                >
                                    Admin
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDemoLogin('supervisor')}
                                    disabled={isLoading}
                                    className="bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:text-white text-xs"
                                >
                                    Supervisor
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDemoLogin('officer')}
                                    disabled={isLoading}
                                    className="bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:text-white text-xs"
                                >
                                    Officer
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-xs text-white/40">
                        © 2024 Tourism Safety Command Center. Authorized personnel only.
                    </p>
                    <div className="flex items-center justify-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
                            System Operational
                        </Badge>
                    </div>
                </div>
            </div>
        </div>
    );
}
