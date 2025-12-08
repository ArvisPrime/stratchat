import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Download, Zap, Brain, LayoutDashboard, MessageSquareText, Settings } from 'lucide-react';
import { getQuickSummary, getDeepAnalysis, generateStrategicQuestion } from './services/geminiStatic';
import { TranscriptView } from './components/TranscriptView';
import { CoachView } from './components/CoachView';
import { AnalysisPanel } from './components/AnalysisPanel';
import { SettingsDialog } from './components/SettingsDialog';
import { AnalysisResult } from './types';
import { useWakeLock } from './hooks/useWakeLock';
import { useTTS } from './hooks/useTTS';
import { useGeminiSession } from './hooks/useGeminiSession';

type Tab = 'strategy' | 'transcript' | 'analysis';
type Theme = 'light' | 'dark';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('strategy');

  // Theme & Settings State
  const [theme, setTheme] = useState<Theme>('dark');
  const [showSettings, setShowSettings] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(false);

  // Analysis State
  const [quickAnalysis, setQuickAnalysis] = useState<AnalysisResult | null>(null);
  const [deepAnalysis, setDeepAnalysis] = useState<string | null>(null);

  // Loading States
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

  // Custom Hooks
  useWakeLock();
  const { speakText } = useTTS();
  const {
    status,
    transcript,
    suggestions,
    addSuggestion,
    toggleRecording,
    isConnected
  } = useGeminiSession({ ttsEnabled, speakText });

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const handleDownload = () => {
    const text = transcript
      .map(t => `[${t.timestamp.toISOString()}] ${t.speaker}: ${t.text} ${t.isRefined ? '(Verified)' : ''}`)
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stratchat-transcript-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateQuestion = async () => {
    if (transcript.length === 0) return;
    setIsGeneratingQuestion(true);
    try {
      const recentText = transcript.slice(-10).map(t => t.text).join('\n');
      const question = await generateStrategicQuestion(recentText);
      addSuggestion(question, 'manual');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const handleQuickAnalysis = async () => {
    if (transcript.length === 0) return;
    setIsSummarizing(true);
    try {
      const fullText = transcript.map(t => t.text).join('\n');
      const result = await getQuickSummary(fullText);
      setQuickAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDeepAnalysis = async () => {
    if (transcript.length === 0) return;
    setIsThinking(true);
    try {
      const fullText = transcript.map(t => t.text).join('\n');
      const result = await getDeepAnalysis(fullText);
      setDeepAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground font-sans overflow-hidden relative transition-colors duration-300">

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        theme={theme}
        setTheme={setTheme}
        ttsEnabled={ttsEnabled}
        setTtsEnabled={setTtsEnabled}
      />

      {/* Top Header */}
      <header className="flex-none h-14 flex items-center justify-between px-4 border-b border-border bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg tracking-tight">StratChat</span>
        </div>

        {/* Desktop Tab Switcher */}
        <div className="hidden md:flex bg-secondary/50 p-1 rounded-lg border border-border/50">
          <button
            onClick={() => setActiveTab('strategy')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'strategy' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Strategy
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'transcript' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Transcript
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative w-full max-w-6xl mx-auto flex flex-col md:flex-row">

        {/* Desktop Sidebar (Analysis) */}
        <aside className="hidden md:flex flex-col w-80 border-r border-border bg-card/30 h-full p-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
            <div className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Actions</div>
            <div className="space-y-3">
              <button
                onClick={handleQuickAnalysis}
                disabled={transcript.length === 0 || isSummarizing}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border transition-all disabled:opacity-50 text-left group"
              >
                <div className="p-2 rounded-md bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500/20 transition-colors">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">Quick Summary</div>
                  <div className="text-[10px] text-muted-foreground">Snapshot & Mood</div>
                </div>
              </button>

              <button
                onClick={handleDeepAnalysis}
                disabled={transcript.length === 0 || isThinking}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border transition-all disabled:opacity-50 text-left group"
              >
                <div className="p-2 rounded-md bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20 transition-colors">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">Deep Strategy</div>
                  <div className="text-[10px] text-muted-foreground">Gemini 3 Pro</div>
                </div>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <AnalysisPanel
              quickAnalysis={quickAnalysis}
              deepAnalysis={deepAnalysis}
              isSummarizing={isSummarizing}
              isThinking={isThinking}
            />
          </div>

          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 p-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg bg-card hover:bg-accent"
          >
            <Download size={16} /> Export Session
          </button>
        </aside>

        {/* Dynamic Content */}
        <div className="flex-1 flex flex-col relative h-full overflow-hidden">

          {/* Mobile Analysis View Overlay */}
          <div className={`md:hidden absolute inset-0 bg-background z-30 overflow-y-auto p-4 transition-transform duration-300 ${activeTab === 'analysis' ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="space-y-4 pb-20">
              <h2 className="text-xl font-bold mb-4">Live Analysis</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleQuickAnalysis}
                  disabled={transcript.length === 0 || isSummarizing}
                  className="flex flex-col items-center justify-center p-4 bg-secondary rounded-xl gap-2 active:scale-95 transition-transform border border-border"
                >
                  <Zap className="text-yellow-500" />
                  <span className="text-sm font-medium">Quick Summary</span>
                </button>
                <button
                  onClick={handleDeepAnalysis}
                  disabled={transcript.length === 0 || isThinking}
                  className="flex flex-col items-center justify-center p-4 bg-secondary rounded-xl gap-2 active:scale-95 transition-transform border border-border"
                >
                  <Brain className="text-purple-500" />
                  <span className="text-sm font-medium">Deep Strategy</span>
                </button>
              </div>
              <AnalysisPanel
                quickAnalysis={quickAnalysis}
                deepAnalysis={deepAnalysis}
                isSummarizing={isSummarizing}
                isThinking={isThinking}
              />
            </div>
          </div>

          {/* Main View Area */}
          <div className="flex-1 relative overflow-hidden">

            {/* Strategy View */}
            <div
              className={`absolute inset-0 p-4 pb-24 md:pb-4 overflow-y-auto no-scrollbar transition-opacity duration-300 ${activeTab === 'strategy' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}
            >
              <CoachView
                suggestions={suggestions}
                onGenerateQuestion={handleGenerateQuestion}
                isGenerating={isGeneratingQuestion}
                isConnected={isConnected}
                onPlayAudio={speakText}
              />
            </div>

            {/* Transcript View */}
            <div
              className={`absolute inset-0 p-0 md:p-4 pb-24 md:pb-4 overflow-hidden transition-opacity duration-300 ${activeTab === 'transcript' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}
            >
              <TranscriptView entries={transcript} />
            </div>

          </div>
        </div>

      </main>

      {/* Floating Action Button (Recording) */}
      <div className="absolute bottom-20 md:bottom-8 right-6 z-40">
        <button
          onClick={toggleRecording}
          className={`h-14 w-14 md:h-16 md:w-16 rounded-full flex items-center justify-center shadow-xl shadow-primary/20 transition-all duration-300 ${isConnected
              ? 'bg-destructive text-destructive-foreground animate-pulse ring-4 ring-destructive/20'
              : 'bg-primary text-primary-foreground hover:scale-105 active:scale-95 hover:shadow-primary/30'
            }`}
        >
          {isConnected ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden flex-none h-16 bg-background/80 backdrop-blur-lg border-t border-border flex items-center justify-around px-2 pb-safe z-40">
        <button
          onClick={() => setActiveTab('strategy')}
          className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${activeTab === 'strategy' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <LayoutDashboard size={20} className={activeTab === 'strategy' ? 'fill-current' : ''} />
          <span className="text-[10px] font-medium">Coach</span>
        </button>
        <button
          onClick={() => setActiveTab('transcript')}
          className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${activeTab === 'transcript' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <MessageSquareText size={20} className={activeTab === 'transcript' ? 'fill-current' : ''} />
          <span className="text-[10px] font-medium">Transcript</span>
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${activeTab === 'analysis' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Zap size={20} className={activeTab === 'analysis' ? 'fill-current' : ''} />
          <span className="text-[10px] font-medium">Insights</span>
        </button>
      </nav>

    </div>
  );
}