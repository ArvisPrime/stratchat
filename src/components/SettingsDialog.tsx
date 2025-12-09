import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, Monitor, Headphones, VolumeX, Smartphone, User, Briefcase, Target, Building2, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../services/userService';
import { toast } from 'sonner';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  ttsEnabled: boolean;
  setTtsEnabled: (enabled: boolean) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  theme,
  setTheme,
  ttsEnabled,
  setTtsEnabled,
}) => {
  const { profile, refreshProfile, deleteAccount, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'profile'>('general');
  const [formData, setFormData] = useState({
    displayName: '',
    jobTitle: '',
    industry: '',
    focusArea: ''
  });
  const [isSaving, setIsSaving] = useState(false);

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
          <div className="flex bg-secondary/50 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'general' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'profile' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Profile
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">

          {activeTab === 'general' ? (
            <div className="space-y-6">
              {/* Appearance Section */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Appearance</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${theme === 'light'
                      ? 'bg-primary/5 border-primary text-primary'
                      : 'bg-card border-border hover:bg-muted'
                      }`}
                  >
                    <Sun size={18} />
                    <span className="text-sm font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${theme === 'dark'
                      ? 'bg-primary/5 border-primary text-primary'
                      : 'bg-card border-border hover:bg-muted'
                      }`}
                  >
                    <Moon size={18} />
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                </div>
              </div>

              {/* Features Section */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Features</label>

                <div
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${ttsEnabled ? 'bg-indigo-500/10 text-indigo-500' : 'bg-muted text-muted-foreground'}`}>
                      {ttsEnabled ? <Headphones size={20} /> : <VolumeX size={20} />}
                    </div>
                    <div>
                      <div className="font-medium">Ear Mode (TTS)</div>
                      <div className="text-xs text-muted-foreground">Read insights aloud</div>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full relative transition-colors ${ttsEnabled ? 'bg-primary' : 'bg-muted'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-background transition-all shadow-sm ${ttsEnabled ? 'left-6' : 'left-1'}`} />
                  </div>
                </div>
              </div>

              {/* About Section */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Smartphone size={12} />
                  <span>StratChat v1.2.0</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Profile Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <User size={12} /> Name
                  </label>
                  <input
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full p-2 rounded-lg bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Briefcase size={12} /> Job Title
                  </label>
                  <input
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full p-2 rounded-lg bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="e.g. Sales Director"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Building2 size={12} /> Industry
                  </label>
                  <input
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full p-2 rounded-lg bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="e.g. SaaS, Finance, Healthcare"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Target size={12} /> Coaching Focus
                  </label>
                  <select
                    value={formData.focusArea}
                    onChange={(e) => setFormData({ ...formData, focusArea: e.target.value })}
                    className="w-full p-2 rounded-lg bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Select a focus area...</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Leadership">Leadership</option>
                    <option value="Sales">Sales Strategy</option>
                    <option value="Conflict Resolution">Conflict Resolution</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSaving ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                  Save Profile
                </button>

                <button
                  onClick={() => {
                    signOut();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>

              <div className="pt-6 mt-6 border-t border-border">
                <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">Danger Zone</h3>
                <button
                  onClick={async () => {
                    if (window.confirm("Are you sure? This will permanently delete your account and all data. This action cannot be undone.")) {
                      try {
                        await deleteAccount();
                        onClose();
                        toast.success("Account deleted.");
                      } catch (e: any) {
                        toast.error("Failed to delete account", { description: e.message });
                      }
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                This information helps StratChat tailor advice to your specific context.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};