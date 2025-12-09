import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Brain, LogIn } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const { signInWithGoogle, loading } = useAuth();
    const [error, setError] = React.useState('');

    const handleLogin = async () => {
        try {
            setError('');
            await signInWithGoogle();
        } catch (e: any) {
            setError('Failed to sign in. Please check your connection and try again.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-foreground">
            <div className="w-full max-w-md space-y-8 text-center">

                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
                        <Brain className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">StratChat</h1>
                    <p className="text-muted-foreground text-lg">Your AI-Powered Communication Strategist</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-8 shadow-xl space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Welcome Back</h2>
                        <p className="text-sm text-muted-foreground">Sign in to access your sessions and history</p>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleLogin}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-foreground text-background font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                        <LogIn size={20} />
                        Sign in with Google
                    </button>
                </div>
            </div>
        </div>
    );
};
