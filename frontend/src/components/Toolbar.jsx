const Toolbar = ({ activeTool, onToolChange }) => {
    const tools = [
        { id: 'select', icon: 'near_me', label: 'Select' },
        { id: 'postit', icon: 'note_stack', label: 'Sticky Note' },
        { id: 'pen', icon: 'edit', label: 'Pen Tool' },
        { id: 'shapes', icon: 'pentagon', label: 'Shapes' },
        { id: 'text', icon: 'title', label: 'Text Tool' },
    ];

    return (
        <aside className="fixed left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 p-2 bg-white/80 backdrop-blur-md shadow-md rounded-xl border border-outline-variant/30">
            {tools.map((tool, index) => (
                <div key={tool.id}>
                    {index === tools.length - 1 && (
                        <div className="w-8 h-[1px] bg-outline-variant mx-auto my-1"></div>
                    )}
                    <button
                        onClick={() => onToolChange(tool.id)}
                        className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors group relative ${
                            activeTool === tool.id
                                ? 'bg-primary-container text-on-primary-container'
                                : 'text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                        title={tool.label}
                    >
                        <span className="material-symbols-outlined">{tool.icon}</span>
                    </button>
                </div>
            ))}
        </aside>
    );
};

export default Toolbar;
