import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Brain, MessageSquare, Briefcase, FileText, Settings, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MeetingType, getMeetingTypes, createMeetingType, updateMeetingType, deleteMeetingType, DEFAULT_MEETING_TYPE } from '../services/meetingTypeService';
import { toast } from 'sonner';

interface MeetingTypeDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectType: (type: MeetingType) => void;
    currentTypeId: string;
}

export const MeetingTypeDashboard: React.FC<MeetingTypeDashboardProps> = ({ isOpen, onClose, onSelectType, currentTypeId }) => {
    const { user } = useAuth();
    const [types, setTypes] = useState<MeetingType[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingType, setEditingType] = useState<MeetingType | null>(null); // Null means list view, object means edit mode (empty ID for new)

    const [formData, setFormData] = useState<Partial<MeetingType>>({});

    useEffect(() => {
        if (user && isOpen) {
            loadTypes();
        }
    }, [user, isOpen]);

    const loadTypes = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const fetched = await getMeetingTypes(user.uid);
            setTypes(fetched);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load meeting types");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (type?: MeetingType) => {
        if (type) {
            setEditingType(type);
            setFormData(type);
        } else {
            setEditingType({ id: '', name: '', description: '', systemInstruction: '' } as MeetingType);
            setFormData({
                name: '',
                description: '',
                systemInstruction: DEFAULT_MEETING_TYPE.systemInstruction,
                icon: 'MessageSquare'
            });
        }
    };

    const handleSave = async () => {
        if (!user || !editingType) return;
        if (!formData.name) return toast.error("Name is required");

        try {
            if (editingType.id) {
                // Update
                await updateMeetingType(user.uid, editingType.id, formData);
                toast.success("Meeting type updated");
            } else {
                // Create
                await createMeetingType(user.uid, formData);
                toast.success("New meeting type created");
            }
            setEditingType(null);
            loadTypes();
        } catch (e) {
            console.error(e);
            toast.error("Failed to save meeting type");
        }
    };

    const handleDelete = async (e: React.MouseEvent, typeId: string) => {
        e.stopPropagation();
        if (!window.confirm("Delete this meeting type?")) return;
        if (!user) return;

        try {
            await deleteMeetingType(user.uid, typeId);
            toast.success("Meeting type deleted");
            loadTypes();
            if (currentTypeId === typeId) {
                onSelectType(DEFAULT_MEETING_TYPE);
            }
        } catch (e: any) {
            toast.error("Failed to delete", { description: e.message });
        }
    };

    const getIcon = (name: string | undefined) => {
        switch (name) {
            case 'Brain': return <Brain size={20} />;
            case 'Briefcase': return <Briefcase size={20} />;
            case 'FileText': return <FileText size={20} />;
            case 'Sparkles': return <Sparkles size={20} />;
            default: return <MessageSquare size={20} />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-card/50">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Brain className="text-primary" />
                            {editingType ? (editingType.id ? 'Edit Meeting Type' : 'New Meeting Type') : 'Meeting Types'}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {editingType ? 'Configure AI behavior for this specific context.' : 'Select or create a context for your strategy session.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {editingType ? (
                        <div className="space-y-6 max-w-2xl mx-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Name</label>
                                    <input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-2 rounded-lg bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="e.g. Sales Pitch"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Icon</label>
                                    <select
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        className="w-full p-2 rounded-lg bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                                    >
                                        <option value="MessageSquare">Default</option>
                                        <option value="Briefcase">Business</option>
                                        <option value="Brain">Strategy</option>
                                        <option value="Sparkles">Creative</option>
                                        <option value="FileText">Formal</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
                                <input
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-2 rounded-lg bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                                    placeholder="Short description for the dashboard"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">System Instructions (Prompt)</label>
                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">AI Behavior</span>
                                </div>
                                <textarea
                                    value={formData.systemInstruction}
                                    onChange={(e) => setFormData({ ...formData, systemInstruction: e.target.value })}
                                    className="w-full h-64 p-4 rounded-lg bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none font-mono text-sm leading-relaxed resize-none"
                                    placeholder="You are a helpful assistant..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    Define exactly how the AI should behave, what it should listen for, and its personality.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                                <button
                                    onClick={() => setEditingType(null)}
                                    className="px-4 py-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                                >
                                    Save Configuration
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Create New Card */}
                            <button
                                onClick={() => handleEdit()}
                                className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-secondary/50 transition-all group gap-3 min-h-[200px]"
                            >
                                <div className="p-3 rounded-full bg-secondary group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Plus size={24} />
                                </div>
                                <span className="font-medium text-muted-foreground group-hover:text-foreground">Create New Type</span>
                            </button>

                            {types.map(type => (
                                <div
                                    key={type.id}
                                    onClick={() => {
                                        onSelectType(type);
                                        onClose();
                                    }}
                                    className={`relative p-6 rounded-xl border transition-all cursor-pointer flex flex-col gap-4 group hover:shadow-lg ${currentTypeId === type.id
                                            ? 'bg-primary/5 border-primary shadow-sm'
                                            : 'bg-card border-border hover:border-primary/30'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className={`p-3 rounded-lg ${currentTypeId === type.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                                            {getIcon(type.icon)}
                                        </div>
                                        {type.id !== DEFAULT_MEETING_TYPE.id && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(type); }}
                                                    className="p-2 hover:bg-secondary rounded-full"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(e, type.id)}
                                                    className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-lg mb-1">{type.name}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{type.description}</p>
                                    </div>

                                    <div className="mt-auto pt-4 flex items-center gap-2 text-xs text-muted-foreground">
                                        <Settings size={12} />
                                        <span>{type.systemInstruction.length} chars</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
