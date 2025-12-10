import React, { useState, useEffect } from 'react';
import { X, User, Shield, CreditCard, Save, Briefcase, Building2, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../services/userService';
import { toast } from 'sonner';

interface ProfileDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'general' | 'security' | 'billing';
}

export const ProfileDashboard: React.FC<ProfileDashboardProps> = ({ isOpen, onClose, initialTab = 'general' }) => {
    const { user, profile, refreshProfile, deleteAccount } = useAuth();
    const [activeTab, setActiveTab] = useState<'general' | 'security' | 'billing'>(initialTab);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        displayName: '',
        jobTitle: '',
        industry: '',
        focusArea: ''
    });

    useEffect(() => {
        if (isOpen && initialTab) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    useEffect(() => {
        if (profile) {
            setFormData({
                displayName: profile.displayName || '',
                jobTitle: profile.jobTitle || '',
                industry: profile.industry || '',
                focusArea: profile.focusArea || ''
            });
        }
    }, [profile, isOpen]);

    const handleSaveProfile = async () => {
        if (!profile) return;
        setIsSaving(true);
        try {
            await updateUserProfile(profile.uid, formData);
            await refreshProfile();
            toast.success('Profile updated successfully');
        } catch (e) {
            toast.error('Failed to update profile');
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className="w-full max-w-4xl h-[80vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground md:hidden z-10"
                >
                    <X size={20} />
                </button>

                {/* Sidebar */}
                <div className="w-full md:w-64 bg-secondary/30 border-b md:border-b-0 md:border-r border-border p-4 flex flex-col gap-2">
                    <div className="p-4 mb-4 hidden md:block">
                        <h2 className="text-xl font-bold tracking-tight">Account</h2>
                        <p className="text-xs text-muted-foreground">Manage your identity & plan</p>
                    </div>

                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'general' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        <User size={18} /> General
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'security' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        <Shield size={18} /> Security
                    </button>
                    <button
                        onClick={() => setActiveTab('billing')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'billing' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        <CreditCard size={18} /> Billing
                    </button>

                    <div className="flex-1" />
                    <div className="text-[10px] text-muted-foreground p-4 hidden md:block opacity-50">
                        User ID: {user?.uid.substring(0, 8)}...
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 md:p-10 overflow-y-auto relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground hidden md:block"
                    >
                        <X size={24} />
                    </button>

                    {activeTab === 'general' && (
                        <div className="max-w-xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-2xl font-bold mb-1">Profile Information</h3>
                                <p className="text-muted-foreground">Update your personal details and professional context.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Display Name</label>
                                    <input
                                        value={formData.displayName}
                                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <input
                                        value={user?.email || ''}
                                        disabled
                                        className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm opacity-50 cursor-not-allowed"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium flex items-center gap-1"><Briefcase size={14} /> Job Title</label>
                                        <input
                                            value={formData.jobTitle}
                                            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            placeholder="e.g. Manager"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium flex items-center gap-1"><Building2 size={14} /> Industry</label>
                                        <input
                                            value={formData.industry}
                                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            placeholder="e.g. Finance"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm font-medium flex items-center gap-1"><Target size={14} /> Primary Focus</label>
                                    <select
                                        value={formData.focusArea}
                                        onChange={(e) => setFormData({ ...formData, focusArea: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="">Select a focus area...</option>
                                        <option value="Negotiation">Negotiation</option>
                                        <option value="Leadership">Leadership</option>
                                        <option value="Sales">Sales Strategy</option>
                                        <option value="Conflict Resolution">Conflict Resolution</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="max-w-xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-2xl font-bold mb-1">Security Settings</h3>
                                <p className="text-muted-foreground">Manage your password and account access.</p>
                            </div>

                            <div className="border border-red-200 bg-red-50 dark:bg-red-950/10 rounded-xl p-6 space-y-4">
                                <div>
                                    <h4 className="font-semibold text-red-600 dark:text-red-400 mb-1">Danger Zone</h4>
                                    <p className="text-sm text-red-600/80 dark:text-red-400/80">
                                        Once you delete your account, there is no going back. Please be certain.
                                    </p>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (window.confirm("Are you sure? This will permanently delete your account and all data.")) {
                                            try {
                                                await deleteAccount();
                                                onClose();
                                                toast.success("Account deleted.");
                                            } catch (e: any) {
                                                toast.error("Failed to delete account", { description: e.message });
                                            }
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors border border-red-200"
                                >
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="max-w-xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-2xl font-bold mb-1">Subscription Plan</h3>
                                <p className="text-muted-foreground">Manage your billing and plan limits.</p>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Plan</div>
                                        <div className="text-3xl font-bold text-foreground">
                                            {profile?.subscriptionTier === 'pro' ? 'Pro Plan' : 'Free Plan'}
                                        </div>
                                    </div>
                                    {profile?.subscriptionTier === 'pro' && (
                                        <div className="bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Active</div>
                                    )}
                                </div>

                                {profile?.subscriptionTier !== 'pro' && (
                                    <p className="text-sm text-muted-foreground mb-6">
                                        Upgrade to Pro to unlock unlimited Deep Strategy sessions and advanced meeting types.
                                    </p>
                                )}

                                {/* Usage Stats Mockup */}
                                <div className="space-y-3 mb-6">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span>Deep Strategy (This Month)</span>
                                            <span>{profile?.usage?.deep_strategy || 0} / {profile?.subscriptionTier === 'pro' ? '∞' : '3'}</span>
                                        </div>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full"
                                                style={{ width: `${Math.min(((profile?.usage?.deep_strategy || 0) / (profile?.subscriptionTier === 'pro' ? 100 : 3)) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {profile?.subscriptionTier !== 'pro' ? (
                                    <button className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg hover:shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                        Upgrade to Pro
                                    </button>
                                ) : (
                                    <button className="text-sm text-muted-foreground hover:text-foreground underline">
                                        Manage Subscription in Stripe
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
