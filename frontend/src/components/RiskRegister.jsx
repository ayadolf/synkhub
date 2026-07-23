import { useState } from 'react';

const RISK_LEVELS = {
    critique: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: 'Critique' },
    élevé: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', label: 'Élevé' },
    moyen: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', label: 'Moyen' },
    faible: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', label: 'Faible' },
};

const CATEGORIES = {
    sécurité: { icon: 'shield', color: 'text-red-500' },
    disponibilité: { icon: 'power', color: 'text-blue-500' },
    conformité: { icon: 'gavel', color: 'text-purple-500' },
    données: { icon: 'storage', color: 'text-amber-500' },
    infrastructure: { icon: 'dns', color: 'text-cyan-500' },
    RH: { icon: 'group', color: 'text-green-500' },
    autre: { icon: 'help', color: 'text-gray-500' },
};

const STATUSES = {
    identifié: { icon: 'new_releases', color: 'text-blue-500' },
    en_cours: { icon: 'pending', color: 'text-amber-500' },
    traité: { icon: 'check_circle', color: 'text-green-500' },
    clos: { icon: 'archive', color: 'text-gray-500' },
};

const RiskRegister = ({ risks, onRiskUpdated, onRiskDeleted }) => {
    const [selectedRisk, setSelectedRisk] = useState(null);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterLevel, setFilterLevel] = useState('all');

    const filtered = risks.filter(r => {
        if (filterCategory !== 'all' && r.category !== filterCategory) return false;
        if (filterLevel !== 'all' && r.risk_level !== filterLevel) return false;
        return true;
    });

    const sorted = [...filtered].sort((a, b) => (b.probability * b.impact) - (a.probability * a.impact));

    const stats = {
        total: risks.length,
        critique: risks.filter(r => r.risk_level === 'critique').length,
        élevé: risks.filter(r => r.risk_level === 'élevé').length,
        moyen: risks.filter(r => r.risk_level === 'moyen').length,
        faible: risks.filter(r => r.risk_level === 'faible').length,
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(stats).map(([key, count]) => (
                    key !== 'total' && count > 0 && (
                        <span key={key} className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_LEVELS[key]?.bg} ${RISK_LEVELS[key]?.text}`}>
                            {count} {RISK_LEVELS[key]?.label}
                        </span>
                    )
                ))}
                <span className="text-xs text-on-surface-variant ml-auto">{stats.total} risques</span>
            </div>

            <div className="flex gap-2">
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface"
                >
                    <option value="all">Toutes catégories</option>
                    {Object.keys(CATEGORIES).map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface"
                >
                    <option value="all">Tous niveaux</option>
                    {Object.keys(RISK_LEVELS).map(l => (
                        <option key={l} value={l}>{RISK_LEVELS[l].label}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {sorted.length === 0 && (
                    <p className="text-xs text-on-surface-variant text-center py-4 italic">
                        Aucun risque identifié. Lancez l'analyse IA pour en créer.
                    </p>
                )}
                {sorted.map((risk) => {
                    const level = RISK_LEVELS[risk.risk_level] || RISK_LEVELS.moyen;
                    const cat = CATEGORIES[risk.category] || CATEGORIES.autre;
                    const status = STATUSES[risk.status] || STATUSES.identifié;
                    return (
                        <div
                            key={risk.id}
                            className={`p-3 rounded-xl border ${level.border} ${level.bg}/30 cursor-pointer hover:opacity-90 transition-opacity`}
                            onClick={() => setSelectedRisk(selectedRisk?.id === risk.id ? null : risk)}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`material-symbols-outlined text-sm ${cat.color}`}>{cat.icon}</span>
                                        <span className="font-medium text-sm text-on-surface truncate">{risk.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${level.bg} ${level.text}`}>
                                            {level.label}
                                        </span>
                                        <span className="text-xs text-on-surface-variant">
                                            P:{risk.probability} × I:{risk.impact} = {risk.probability * risk.impact}
                                        </span>
                                        <span className="flex items-center gap-0.5 text-xs text-on-surface-variant">
                                            <span className={`material-symbols-outlined text-xs ${status.color}`}>{status.icon}</span>
                                            {risk.status}
                                        </span>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-sm text-on-surface-variant">
                                    {selectedRisk?.id === risk.id ? 'expand_less' : 'expand_more'}
                                </span>
                            </div>

                            {selectedRisk?.id === risk.id && (
                                <div className="mt-3 pt-3 border-t border-outline-variant/30 space-y-2 text-xs text-on-surface">
                                    {risk.description && (
                                        <p className="text-on-surface-variant">{risk.description}</p>
                                    )}
                                    <div className="grid grid-cols-2 gap-2">
                                        {risk.treatment && (
                                            <div>
                                                <span className="text-on-surface-variant font-medium">Traitement: </span>
                                                {risk.treatment}
                                            </div>
                                        )}
                                        {risk.owner && (
                                            <div>
                                                <span className="text-on-surface-variant font-medium">Responsable: </span>
                                                {risk.owner}
                                            </div>
                                        )}
                                    </div>
                                    {risk.treatment_action && (
                                        <div>
                                            <span className="text-on-surface-variant font-medium">Action: </span>
                                            {risk.treatment_action}
                                        </div>
                                    )}
                                    {risk.source_postits?.length > 0 && risk.source_postits[0] && (
                                        <div className="bg-surface-container-low rounded-lg px-2 py-1 text-on-surface-variant italic">
                                            Source: "{risk.source_postits[0]}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RiskRegister;
