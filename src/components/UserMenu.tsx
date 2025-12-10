import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';
import { LogOut, User, Sparkles, Moon, Sun, Settings, CreditCard } from 'lucide-react';

interface UserMenuProps {
    user: any; // Firebase User
    profile: UserProfile | null;
    onOpenProfile: () => void;
    onOpenSubscription: () => void;
    theme: 'light' | 'dark';
    setTheme: (t: 'light' | 'dark') => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
    user,
    profile,
    onOpenProfile,
    onOpenSubscription,
    theme,
    setTheme
}) => {
    const { signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        return name.substring(0, 1).toUpperCase();
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative outline-none rounded-full"
            >
                <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all ring-2 ring-offset-2 ring-offset-background ${profile?.subscriptionTier === 'pro'
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 ring-indigo-500/30'
                        : 'bg-secondary text-foreground ring-border'
                    }`}>
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <span className="text-white drop-shadow-md">{getInitials(profile?.displayName || user.email)}</span>
                    )}
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">

                    {/* Header */}
                    <div className="p-4 border-b border-border bg-secondary/30">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${profile?.subscriptionTier === 'pro'
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                {getInitials(profile?.displayName || user.email)}
                            </div>
                            <div className="overflow-hidden">
                                <div className="font-medium truncate">{profile?.displayName || 'User'}</div>
                                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-2 space-y-1">
                        <button
                            onClick={() => {
                                onOpenProfile();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                        >
                            <User size={16} className="text-muted-foreground" />
                            <span>Manage Account</span>
                        </button>

                        <button
                            onClick={() => {
                                onOpenSubscription();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                        >
                            <CreditCard size={16} className="text-muted-foreground" />
                            <div className="flex-1 flex items-center justify-between">
                                <span>Subscription</span>
                                {profile?.subscriptionTier === 'pro' && (
                                    <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded font-bold border border-indigo-500/20">PRO</span>
                                )}
                            </div>
                        </button>
                    </div>

                    <div className="h-px bg-border mx-2 my-1" />

                    {/* Theme Toggle in Menu */}
                    <div className="p-2">
                        <div className="flex bg-muted/50 p-1 rounded-lg">
                            <button
                                onClick={() => setTheme('light')}
                                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Sun size={14} /> Light
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Moon size={14} /> Dark
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-border mx-2 my-1" />

                    <div className="p-2">
                        <button
                            onClick={() => {
                                signOut();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-red-500/10 text-red-600 hover:text-red-700 transition-colors text-left"
                        >
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </button>
                    </div>

                    <div className="px-4 py-2 bg-secondary/30 border-t border-border text-[10px] text-center text-muted-foreground">
                        <a href="#" className="hover:underline">Privacy Policy</a> • <a href="#" className="hover:underline">Terms of Service</a>
                    </div>

                </div>
            )}
        </div>
    );
};
