import { useState, useEffect, useRef } from 'react';
import { noteAPI } from '../api/boards';
import SynthesisPanel from './SynthesisPanel';

const NotesSidebar = ({ boardId, isOpen, onClose }) => {
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [showSynthesis, setShowSynthesis] = useState(false);
    const timerRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (isOpen && boardId) {
            loadNote();
            setShowSynthesis(false);
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [isOpen, boardId]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const loadNote = async () => {
        try {
            const res = await noteAPI.get(boardId);
            setContent(res.data.content || '');
            if (res.data.updated_at) {
                setLastSaved(new Date(res.data.updated_at));
            }
        } catch (err) {
            console.error('Erreur chargement note:', err);
        }
    };

    const saveNote = async (text) => {
        setSaving(true);
        try {
            await noteAPI.update(boardId, text);
            setLastSaved(new Date());
        } catch (err) {
            console.error('Erreur sauvegarde note:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const value = e.target.value;
        setContent(value);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => saveNote(value), 800);
    };

    const handleBlur = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        saveNote(content);
    };

    const handleSaveSynthesis = (synthesisText) => {
        const separator = content.trim() ? '\n\n---\n\n' : '';
        const newContent = content + separator + synthesisText;
        setContent(newContent);
        saveNote(newContent);
        setShowSynthesis(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-outline-variant/30 flex flex-col z-50 shadow-2xl">
            <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">description</span>
                    <h3 className="font-bold text-on-surface">My Notes</h3>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg hover:bg-red-100 flex items-center justify-center transition-colors"
                >
                    <span className="material-symbols-outlined text-on-surface-variant text-xl">close</span>
                </button>
            </div>

            <div className="flex-1 p-4 flex flex-col overflow-hidden">
                <button
                    onClick={() => setShowSynthesis(!showSynthesis)}
                    className="shrink-0 w-full px-3 py-2 bg-primary/10 border border-primary/20 rounded-xl text-sm font-medium text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 mb-3"
                >
                    <span className="material-symbols-outlined text-lg">smart_toy</span>
                    {showSynthesis ? 'Masquer la synthèse' : 'Générer la synthèse IA'}
                </button>

                {showSynthesis ? (
                    <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-primary/20">
                        <SynthesisPanel
                            boardId={boardId}
                            onClose={() => setShowSynthesis(false)}
                            onSaveToNotes={handleSaveSynthesis}
                        />
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 flex flex-col">
                        {content.length === 0 && (
                            <div className="mb-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                                <p className="text-xs text-on-surface-variant flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-primary">info</span>
                                    Your notes are saved automatically per board. Each board has its own private note.
                                </p>
                            </div>
                        )}
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Start writing your notes here..."
                            className="flex-1 w-full resize-none bg-surface-container-low border border-outline-variant rounded-xl p-4 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all leading-relaxed"
                            style={{ minHeight: '200px' }}
                        />
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-outline-variant/20 flex items-center justify-between bg-surface-container-low/50">
                <div className="flex items-center gap-2">
                    {saving ? (
                        <>
                            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-on-surface-variant">Saving...</span>
                        </>
                    ) : lastSaved ? (
                        <>
                            <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                            <span className="text-xs text-on-surface-variant">Saved {lastSaved.toLocaleTimeString()}</span>
                        </>
                    ) : (
                        <span className="text-xs text-on-surface-variant/50">Type to start saving</span>
                    )}
                </div>
                <span className="text-xs text-on-surface-variant/50">{content.length} chars</span>
            </div>
        </div>
    );
};

export default NotesSidebar;
