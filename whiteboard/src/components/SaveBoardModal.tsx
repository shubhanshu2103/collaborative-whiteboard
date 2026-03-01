import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

interface SaveBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, isPublic: boolean) => Promise<void>;
    initialName?: string;
    initialIsPublic?: boolean;
}

export default function SaveBoardModal({ isOpen, onClose, onSave, initialName = '', initialIsPublic = false }: SaveBoardModalProps) {
    const [name, setName] = useState(initialName);
    const [isPublic, setIsPublic] = useState(initialIsPublic);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(name, isPublic);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Save size={20} className="text-primary-500" />
                        Save Board
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Board Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter board name..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-slate-700"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Visibility</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsPublic(false)}
                                className={`flex-1 py-2.5 px-3 border rounded-xl text-sm font-bold transition-all ${!isPublic ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                Private
                            </button>
                            <button
                                onClick={() => setIsPublic(true)}
                                className={`flex-1 py-2.5 px-3 border rounded-xl text-sm font-bold transition-all ${isPublic ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                Public
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 ml-1 leading-relaxed">
                            {isPublic ? "Any accepted friend in your network can view this board." : "Only you and specifically invited collaborators can view this board."}
                        </p>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !name.trim()}
                            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-primary-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
