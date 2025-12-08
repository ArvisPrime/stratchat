
import React from 'react';
import { CoachSuggestion } from '../types';
import { Sparkles, Zap, Play, Clock, Volume2 } from 'lucide-react';

interface CoachViewProps {
  suggestions: CoachSuggestion[];
  onGenerateQuestion: () => void;
  isGenerating: boolean;
  isConnected: boolean;
  onPlayAudio: (text: string) => void;
}

export const CoachView: React.FC<CoachViewProps> = ({
  suggestions,
  onGenerateQuestion,
  isGenerating,
  isConnected,
  onPlayAudio
}) => {
  const latestSuggestion = suggestions[suggestions.length - 1];
  const history = suggestions.slice(0, suggestions.length - 1).reverse();

  return (
    <div className="flex flex-col h-full space-y-6 max-w-2xl mx-auto">

      {/* Reconnecting Banner */}
      {isConnected === false && (
        <div className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-500 px-4 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
          Connection lost. Attempting to reconnect...
        </div>
      )}

      {/* Hero Card */}
      <div className="w-full">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-900/40 to-background border border-indigo-500/20 shadow-2xl min-h-[260px] flex flex-col items-center justify-center p-6 text-center transition-all duration-500">

          {/* Decorative elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full pointer-events-none"></div>

          {latestSuggestion ? (
            <div className="relative z-10 w-full animate-in fade-in slide-in-from-bottom-2 duration-700">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-6">
                <Sparkles size={12} />
                {latestSuggestion.type === 'auto' ? 'Smart Insight' : 'Manual Strategy'}
              </div>

              <h2 className="text-2xl md:text-3xl font-medium leading-snug tracking-tight text-foreground mb-8">
                "{latestSuggestion.text}"
              </h2>

              <button
                onClick={() => onPlayAudio(latestSuggestion.text)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-indigo-500/10"
              >
                <Play size={16} fill="currentColor" /> Play Audio
              </button>
            </div>
          ) : (
            <div className="text-center text-muted-foreground relative z-10">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Sparkles className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-lg font-medium">Listening for context...</p>
              <p className="text-sm opacity-60 mt-1">AI insights will appear here automatically.</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex-none px-1">
        <button
          onClick={onGenerateQuestion}
          disabled={!isConnected || isGenerating}
          className="w-full h-14 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-medium text-base flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-border disabled:opacity-50"
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Zap className="text-yellow-500 w-5 h-5 fill-current" />
          )}
          {isGenerating ? 'Analyzing Context...' : 'Generate Strategic Question'}
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 min-h-0 pt-4">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">History</h3>
          <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-md text-muted-foreground">{history.length} items</span>
        </div>

        <div className="space-y-3 pb-20">
          {history.length === 0 && (
            <div className="text-center py-10 text-muted-foreground/40 text-sm">
              No history yet
            </div>
          )}
          {history.map((item) => (
            <div key={item.id} className="group bg-card border border-border/50 p-4 rounded-xl flex gap-3 transition-colors hover:border-border hover:bg-accent/5">
              <div className={`w-1 h-full rounded-full self-stretch ${item.type === 'manual' ? 'bg-yellow-500/50' : 'bg-indigo-500/50'}`} />
              <div className="flex-1">
                <p className="text-sm text-foreground/90 leading-relaxed font-medium">"{item.text}"</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                    <Clock size={10} /> {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button onClick={() => onPlayAudio(item.text)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                    <Volume2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
