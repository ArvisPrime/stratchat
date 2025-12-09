import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, MessageSquare, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserSessions } from '../services/sessionService';
import { SessionData } from '../types';
import { format } from 'date-fns'; // Requires date-fns, but let's use standard JS date for now to check if pkg exists. Checking App.tsx imports... no date-fns.

interface SessionsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSession: (session: SessionData) => void;
}

export const SessionsDialog: React.FC<SessionsDialogProps> = ({ isOpen, onClose, onSelectSession }) => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            loadSessions();
        }
    }, [isOpen, user]);

    const loadSessions = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getUserSessions(user.uid);
            setSessions(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" /> Session History
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-0 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Loading history...</span>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
                            <MessageSquare className="w-10 h-10 opacity-20" />
                            <p>No recorded sessions yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    onClick={() => onSelectSession(session)}
                                    className="p-4 hover:bg-secondary/30 transition-colors cursor-pointer group flex items-start justify-between"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-primary font-medium">
                                            <Calendar size={14} />
                                            <span className="text-sm">
                                                {session.startTime.toLocaleDateString()} at {session.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-foreground">
                                            {session.summary || "No summary available"}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                                            <span>{session.transcript.length} turns</span>
                                            <span>•</span>
                                            <span>{session.suggestions.length} insights</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
