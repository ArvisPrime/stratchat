import React, { useEffect, useRef, useState } from 'react';
import { TranscriptEntry } from '../types';
import { Check, Copy, WifiOff, CheckCircle2 } from 'lucide-react';

interface TranscriptViewProps {
  entries: TranscriptEntry[];
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({ entries }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length, entries[entries.length - 1]?.text]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const chatEntries = entries.filter(e => e.speaker !== 'ai');

  if (chatEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center m-4">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <span className="text-2xl opacity-50">💬</span>
        </div>
        <p className="font-medium text-foreground">Waiting for conversation...</p>
        <p className="text-xs opacity-60 mt-1">Transcript will appear here in real-time</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
       <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 md:pb-4 custom-scrollbar">
          {chatEntries.map((entry, idx) => {
             const isStreaming = entry.isFinal === false;
             const timeSinceUpdate = entry.lastUpdated ? now - entry.lastUpdated.getTime() : 0;
             const isLagging = isStreaming && timeSinceUpdate > 2500;
             const isUser = entry.speaker === 'user';
             
             return (
               <div key={entry.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  
                  {/* Speaker Label */}
                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 px-1 ${isUser ? 'text-primary/70' : 'text-muted-foreground'}`}>
                      {isUser ? 'You' : 'Partner'}
                  </div>

                  {/* Bubble */}
                  <div className={`relative max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm transition-colors ${
                      isStreaming 
                        ? 'bg-muted/80 border border-indigo-500/30 text-foreground' 
                        : isUser 
                           ? 'bg-primary text-primary-foreground rounded-tr-sm'
                           : 'bg-card border border-border text-foreground rounded-tl-sm'
                  }`}>
                      <p className="whitespace-pre-wrap break-words">
                        {entry.text}
                        {isStreaming && !isLagging && (
                           <span className="inline-block w-1.5 h-3 ml-1 bg-indigo-500 animate-pulse rounded-full align-middle"/>
                        )}
                      </p>
                  </div>

                  {/* Metadata Line */}
                  <div className="flex items-center gap-2 mt-1.5 px-1 opacity-70">
                     <span className="text-[10px] text-muted-foreground">
                        {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                     </span>
                     
                     {isLagging && (
                        <span className="flex items-center gap-1 text-amber-500 text-[10px] font-medium animate-pulse">
                            <WifiOff size={10} /> Syncing
                        </span>
                     )}
                     
                     {entry.isRefined && (
                        <div className="flex items-center gap-0.5 text-emerald-500" title="Audio Verified">
                           <CheckCircle2 size={10} /> 
                           <span className="text-[9px] font-medium">Verified</span>
                        </div>
                     )}
                     
                     {!isStreaming && (
                       <button 
                         onClick={() => handleCopy(entry.text, entry.id)}
                         className="text-muted-foreground hover:text-foreground transition-colors ml-1 p-1 hover:bg-muted rounded"
                         title="Copy text"
                       >
                         {copiedId === entry.id ? <Check size={10} /> : <Copy size={10} />}
                       </button>
                     )}
                  </div>
               </div>
             );
          })}
          <div ref={bottomRef} className="h-4" />
       </div>
    </div>
  );
};