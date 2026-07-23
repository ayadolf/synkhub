import { useState, useRef, useEffect } from 'react';
import { synthesisAPI, riskAPI, pdfAPI } from '../api/boards';
import { useToast } from '../context/ToastContext';
import RiskMatrix from './RiskMatrix';
import RiskRegister from './RiskRegister';

const SynthesisPanel = ({ boardId, onClose, onSaveToNotes }) => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('synthesis');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [risks, setRisks] = useState([]);
    const [risksLoading, setRisksLoading] = useState(false);
    const [risksError, setRisksError] = useState(null);
    const [selectedRisk, setSelectedRisk] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (data && scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [data]);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await synthesisAPI.generate(boardId);
            setData(res.data);
        } catch (err) {
            let msg = 'Erreur lors de la génération';
            if (err.code === 'ECONNABORTED') {
                msg = "Timeout: la génération prend trop de temps. Réessayez.";
            } else if (err.response) {
                msg = err.response.data?.detail || `Erreur ${err.response.status}`;
            } else if (err.request) {
                msg = "Erreur réseau: serveur injoignable";
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyzeRisks = async () => {
        setRisksLoading(true);
        setRisksError(null);
        try {
            const res = await riskAPI.analyze(boardId);
            setRisks(prev => [...res.data.risques, ...prev]);
        } catch (err) {
            let msg = "Erreur lors de l'analyse des risques";
            if (err.code === 'ECONNABORTED') {
                msg = "Timeout: l'analyse prend trop de temps. Réessayez.";
            } else if (err.response) {
                msg = err.response.data?.detail || `Erreur ${err.response.status}`;
            } else if (err.request) {
                msg = "Erreur réseau: serveur injoignable";
            }
            setRisksError(msg);
        } finally {
            setRisksLoading(false);
        }
    };

    const handleLoadRisks = async () => {
        try {
            const res = await riskAPI.getAll(boardId);
            setRisks(res.data);
        } catch (err) {
            console.error('Erreur chargement risques:', err);
        }
    };

    useEffect(() => {
        if (activeTab === 'risks' && risks.length === 0) {
            handleLoadRisks();
        }
    }, [activeTab]);

    const handleSave = () => {
        if (!data) return;
        let t = `## Synthèse IA — ${data.postit_count} post-its\n\n`;
        t += `### Résumé\n${data.resume}\n\n`;
        if (data.plan_d_action?.length) {
            t += `### Plan d'action (${data.plan_d_action.length})\n`;
            data.plan_d_action.forEach((a, i) => {
                t += `${i + 1}. [${a.priorite}] ${a.action}`;
                if (a.responsable) t += ` → ${a.responsable}`;
                if (a.delai) t += ` (${a.delai})`;
                t += '\n';
            });
        }
        if (risks.length > 0) {
            t += `\n### Risques identifiés (${risks.length})\n`;
            risks.forEach((r, i) => {
                t += `${i + 1}. [${r.risk_level.toUpperCase()}] ${r.title} (P:${r.probability} × I:${r.impact})\n`;
                if (r.treatment_action) t += `   Traitement: ${r.treatment_action}\n`;
            });
        }
        onSaveToNotes(t);
    };

    const handleDownloadPDF = async () => {
        setPdfLoading(true);
        try {
            const res = await pdfAPI.generate(boardId);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `rapport_brainstorming_${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Erreur generation PDF:', err);
            let msg = 'Erreur lors de la génération du PDF';
            if (err.response) {
                msg = err.response.data?.detail || `Erreur ${err.response.status}`;
            }
            toast.error(msg);
        } finally {
            setPdfLoading(false);
        }
    };

    const priorityColor = (p) => {
        if (p === 'Haute') return 'bg-red-100 text-red-700 border-red-200';
        if (p === 'Basse') return 'bg-green-100 text-green-700 border-green-200';
        return 'bg-amber-100 text-amber-700 border-amber-200';
    };

    const renderResume = (text) => {
        if (!text || !text.trim()) return <p className="text-sm text-on-surface-variant italic">Pas de résumé disponible</p>;
        const paragraphs = text.split('\n').filter(p => p.trim());
        return paragraphs.map((p, i) => (
            <p key={i} className="text-sm text-on-surface leading-relaxed mb-2 last:mb-0">{p}</p>
        ));
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b border-primary/10 shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">smart_toy</span>
                        <span className="font-semibold text-sm text-on-surface">Analyse IA</span>
                    </div>
                    <button onClick={onClose} className="w-6 h-6 rounded hover:bg-red-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setActiveTab('synthesis')}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            activeTab === 'synthesis'
                                ? 'bg-primary text-white'
                                : 'text-on-surface-variant hover:bg-surface-container-low'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm align-middle mr-1">summarize</span>
                        Synthèse
                    </button>
                    <button
                        onClick={() => setActiveTab('risks')}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            activeTab === 'risks'
                                ? 'bg-primary text-white'
                                : 'text-on-surface-variant hover:bg-surface-container-low'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm align-middle mr-1">shield</span>
                        Risques {risks.length > 0 && `(${risks.length})`}
                    </button>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto">
                {activeTab === 'synthesis' && (
                    <>
                        {!data && !loading && (
                            <div className="flex items-center justify-center p-4 h-full">
                                <div className="text-center">
                                    <p className="text-xs text-on-surface-variant mb-3">
                                        Génère un résumé analytique et un plan d'action à partir des post-its du board.
                                    </p>
                                    <button
                                        onClick={handleGenerate}
                                        className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
                                    >
                                        <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                        Générer la synthèse
                                    </button>
                                </div>
                            </div>
                        )}

                        {loading && (
                            <div className="flex items-center justify-center p-6 h-full">
                                <div className="text-center">
                                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                    <p className="text-sm text-on-surface-variant">Analyse des post-its en cours...</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center justify-center p-4 h-full">
                                <div className="text-center">
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2 mb-2">
                                        <span className="material-symbols-outlined text-lg">error</span>
                                        {error}
                                    </div>
                                    <button onClick={handleGenerate} className="text-xs text-primary hover:underline">
                                        Réessayer
                                    </button>
                                </div>
                            </div>
                        )}

                        {data && (
                            <div className="p-4 space-y-4">
                                {(data.duration_ms > 0 || data.tokens_generated > 0) && (
                                    <div className="flex items-center gap-4 text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2">
                                        {data.duration_ms > 0 && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">timer</span>
                                                {(data.duration_ms / 1000).toFixed(1)}s
                                            </span>
                                        )}
                                        {data.tokens_generated > 0 && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">token</span>
                                                {data.tokens_generated} tokens
                                            </span>
                                        )}
                                        {data.tokens_per_second > 0 && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">speed</span>
                                                {data.tokens_per_second} tok/s
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">summarize</span>
                                        Résumé analytique
                                    </h4>
                                    <div className="bg-surface-container-low rounded-lg px-3 py-2">
                                        {renderResume(data.resume)}
                                    </div>
                                </div>

                                {data.plan_d_action?.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">task_alt</span>
                                            Plan d'action ({data.plan_d_action.length})
                                        </h4>
                                        <div className="space-y-1.5">
                                            {data.plan_d_action.map((a, i) => (
                                                <div key={i} className="flex items-start gap-2 text-sm bg-surface-container-low rounded-lg px-3 py-2">
                                                    <span className="font-mono text-xs text-on-surface-variant mt-0.5">{i + 1}.</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start gap-2 flex-wrap">
                                                            <span className={`text-xs px-1.5 py-0.5 rounded border font-medium shrink-0 ${priorityColor(a.priorite)}`}>
                                                                {a.priorite}
                                                            </span>
                                                            <span className="text-on-surface">{a.action}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant flex-wrap">
                                                            {a.responsable && (
                                                                <span className="flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-sm">person</span>
                                                                    {a.responsable}
                                                                </span>
                                                            )}
                                                            {a.delai && (
                                                                <span className="flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                                                    {a.delai}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {a.justification && (
                                                            <p className="mt-1 text-xs text-on-surface-variant/70 italic">
                                                                {a.justification}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2 border-t border-outline-variant/20">
                                    <button
                                        onClick={handleSave}
                                        className="flex-1 px-3 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-lg">save</span>
                                        Enregistrer dans mes notes
                                    </button>
                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={pdfLoading}
                                        className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                                    >
                                        {pdfLoading ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                                        )}
                                        PDF
                                    </button>
                                    <button
                                        onClick={handleGenerate}
                                        className="px-3 py-2 border border-outline-variant rounded-xl text-sm hover:bg-surface-container-low transition-colors flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-lg">refresh</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'risks' && (
                    <div className="p-4 space-y-4">
                        <div className="flex gap-2">
                            <button
                                onClick={handleAnalyzeRisks}
                                disabled={risksLoading}
                                className="flex-1 px-3 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {risksLoading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                )}
                                {risksLoading ? 'Analyse en cours...' : 'Analyser les risques'}
                            </button>
                        </div>

                        {risksError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                                <span className="material-symbols-outlined text-lg">error</span>
                                {risksError}
                            </div>
                        )}

                        {risks.length > 0 && (
                            <>
                                <RiskMatrix risks={risks} onSelectRisk={setSelectedRisk} />
                                <RiskRegister risks={risks} />
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={pdfLoading}
                                        className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {pdfLoading ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                                        )}
                                        Telecharger le rapport PDF
                                    </button>
                                </div>
                            </>
                        )}

                        {risks.length === 0 && !risksLoading && !risksError && (
                            <div className="text-center py-8">
                                <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2 block">shield</span>
                                <p className="text-sm text-on-surface-variant">
                                    Aucun risque identifié pour ce board.
                                </p>
                                <p className="text-xs text-on-surface-variant/60 mt-1">
                                    Cliquez sur "Analyser les risques" pour que l'IA identifie les menaces implicites.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SynthesisPanel;
