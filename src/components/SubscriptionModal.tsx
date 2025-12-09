import React, { useState } from 'react';
import { X, Check, Zap, Crown, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mockUpgradeToPro } from '../services/subscriptionService';
import { toast } from 'sonner';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
    const { user, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleUpgrade = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Simulate network delay for Stripe
            await new Promise(resolve => setTimeout(resolve, 1500));

            await mockUpgradeToPro(user.uid);
            await refreshProfile();

            toast.success("Welcome to Pro!", {
                description: "You now have unlimited access to Deep Strategy."
            });
            onClose();
        } catch (e) {
            toast.error("Upgrade failed. Please try again.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
            <div
                className="w-full max-w-lg bg-card border border-primary/20 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative background glow */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-primary/20">
                            <Crown size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Upgrade to Pro</h2>
                        <p className="text-muted-foreground">Unlock the full potential of your AI coach.</p>
                    </div>

                    <div className="bg-secondary/30 rounded-2xl p-6 border border-border/50 mb-8">
                        <div className="flex items-end justify-center gap-1 mb-6">
                            <span className="text-4xl font-bold">$9.99</span>
                            <span className="text-muted-foreground mb-1">/ month</span>
                        </div>

                        <div className="space-y-4">
                            <FeatureRow text="Unlimited Deep Strategy (Gemini 2.0 Pro)" />
                            <FeatureRow text="Unlimited Session History" />
                            <FeatureRow text="Export Transcripts & Insights" />
                            <FeatureRow text="Priority Support" />
                        </div>
                    </div>

                    <button
                        onClick={handleUpgrade}
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Unlock Pro Access <Zap size={20} className="fill-current" />
                            </>
                        )}
                    </button>
                    <p className="text-xs text-center text-muted-foreground mt-4">
                        Secure payment via Stripe (Mock). Cancel anytime.
                    </p>
                </div>
            </div>
        </div>
    );
};

const FeatureRow = ({ text }: { text: string }) => (
    <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Check size={12} className="text-primary" />
        </div>
        <span className="text-sm font-medium">{text}</span>
    </div>
);
