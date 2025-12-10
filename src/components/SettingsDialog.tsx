import React from 'react';
import { X, Moon, Sun, Headphones, VolumeX, Smartphone } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
          <h2 className="text-lg font-semibold">Preferences</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
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
      </div>
    </div>
  );
};