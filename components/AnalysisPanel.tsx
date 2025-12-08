
import React from 'react';
import { Bolt, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AnalysisResult } from '../types';

interface AnalysisPanelProps {
  quickAnalysis: AnalysisResult | null;
  deepAnalysis: string | null;
  isThinking: boolean;
  isSummarizing: boolean;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ 
  quickAnalysis, 
  deepAnalysis,
  isThinking,
  isSummarizing
}) => {
  if (!quickAnalysis && !deepAnalysis && !isThinking && !isSummarizing) {
      return (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center p-4 border border-dashed border-border rounded-xl bg-card/30">
              <p className="text-sm">Run analysis to see insights here.</p>
          </div>
      );
  }

  const getSentimentStyles = (sentiment: string) => {
    switch(sentiment) {
      case 'Positive': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Negative': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'Tense': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'Constructive': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-4">
      {(quickAnalysis || isSummarizing) && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2 text-yellow-500">
               <Bolt size={16} fill="currentColor" />
               <h3 className="font-semibold text-xs uppercase tracking-wider text-foreground">Live Snapshot</h3>
             </div>
             {quickAnalysis && (
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${getSentimentStyles(quickAnalysis.sentiment)}`}>
                   <span>{quickAnalysis.emoji}</span>
                   <span>{quickAnalysis.sentiment}</span>
                </div>
             )}
          </div>

          {isSummarizing ? (
            <div className="space-y-2">
               <div className="animate-pulse h-3 w-3/4 bg-muted rounded"></div>
               <div className="animate-pulse h-6 w-full bg-muted rounded mt-2"></div>
            </div>
          ) : (
            <div>
               <p className="text-sm leading-relaxed text-muted-foreground">{quickAnalysis?.summary}</p>
            </div>
          )}
        </div>
      )}

      {(deepAnalysis || isThinking) && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2 mb-3 text-purple-500">
            <BrainCircuit size={16} />
            <h3 className="font-semibold text-xs uppercase tracking-wider text-foreground">Deep Strategy</h3>
          </div>
          {isThinking ? (
            <div className="space-y-2">
              <div className="animate-pulse h-3 w-full bg-muted rounded"></div>
              <div className="animate-pulse h-3 w-5/6 bg-muted rounded"></div>
              <div className="animate-pulse h-3 w-4/6 bg-muted rounded"></div>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground text-sm">
              <ReactMarkdown>{deepAnalysis || ''}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
