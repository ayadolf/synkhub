const RiskMatrix = ({ risks, onSelectRisk }) => {
    const cellColor = (prob, impact) => {
        const score = prob * impact;
        if (score >= 15) return 'bg-red-500 text-white';
        if (score >= 8) return 'bg-orange-400 text-white';
        if (score >= 4) return 'bg-amber-300 text-amber-900';
        return 'bg-green-400 text-green-900';
    };

    const getRisksForCell = (prob, impact) =>
        risks.filter(r => r.probability === prob && r.impact === impact);

    return (
        <div className="bg-surface-container-low rounded-xl p-4">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">grid_on</span>
                Matrice des risques (Probabilité × Impact)
            </h4>
            <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr>
                            <th className="p-1 text-on-surface-variant font-medium text-center" rowSpan="2">
                                <span className="rotate-[-90deg] inline-block">Probabilité</span>
                            </th>
                            <th colSpan="5" className="p-1 text-on-surface-variant font-medium text-center border-b border-outline-variant/30">
                                Impact →
                            </th>
                        </tr>
                        <tr>
                            {[1, 2, 3, 4, 5].map(i => (
                                <th key={i} className="p-1 text-on-surface-variant font-medium text-center w-16">
                                    {i}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[5, 4, 3, 2, 1].map(prob => (
                            <tr key={prob}>
                                <td className="p-1 text-on-surface-variant font-medium text-center">{prob}</td>
                                {[1, 2, 3, 4, 5].map(impact => {
                                    const cellRisks = getRisksForCell(prob, impact);
                                    return (
                                        <td
                                            key={impact}
                                            className={`p-1 border border-outline-variant/20 rounded text-center min-h-[40px] ${cellColor(prob, impact)} ${cellRisks.length ? 'cursor-pointer hover:opacity-80' : 'opacity-40'}`}
                                            onClick={() => cellRisks.length > 0 && onSelectRisk(cellRisks[0])}
                                        >
                                            {cellRisks.length > 0 ? (
                                                <span className="font-bold">{cellRisks.length}</span>
                                            ) : (
                                                <span className="opacity-30">·</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="flex items-center justify-center gap-4 mt-3 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block"></span> Faible</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-300 inline-block"></span> Moyen</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400 inline-block"></span> Élevé</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block"></span> Critique</span>
                </div>
            </div>
        </div>
    );
};

export default RiskMatrix;
