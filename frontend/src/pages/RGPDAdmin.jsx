import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { auditAPI } from '../api/boards';
import Sidebar from '../components/Sidebar';

const RGPDAdmin = () => {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [processings, setProcessings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        name: '',
        purpose: '',
        legal_basis: '',
        data_categories: '',
        retention_period: '',
        recipients: '',
    });
    const [error, setError] = useState('');

    useEffect(() => {
        loadProcessings();
    }, []);

    const loadProcessings = async () => {
        try {
            const response = await auditAPI.getProcessings();
            setProcessings(response.data);
        } catch (err) {
            setError('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({ name: '', purpose: '', legal_basis: '', data_categories: '', retention_period: '', recipients: '' });
        setEditingId(null);
        setShowForm(false);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await auditAPI.updateProcessing(editingId, form);
            } else {
                await auditAPI.createProcessing(form);
            }
            resetForm();
            loadProcessings();
        } catch (err) {
            setError(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
        }
    };

    const handleEdit = (p) => {
        setForm({
            name: p.name,
            purpose: p.purpose,
            legal_basis: p.legal_basis,
            data_categories: p.data_categories,
            retention_period: p.retention_period,
            recipients: p.recipients || '',
        });
        setEditingId(p.id);
        setShowForm(true);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Supprimer le traitement "${name}" ?`)) return;
        try {
            await auditAPI.deleteProcessing(id);
            loadProcessings();
        } catch (err) {
            setError('Erreur lors de la suppression');
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-surface'}`}>
                <Sidebar />
                <main className="pt-20 md:pl-72 min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4 block">lock</span>
                        <h2 className="text-xl font-bold text-on-surface">Accès réservé aux administrateurs</h2>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-surface'}`}>
            <Sidebar />

            <header className={`fixed top-0 w-full z-30 flex justify-between items-center px-10 py-4 backdrop-blur-xl border-b md:pl-[312px] ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-outline-variant/20'}`}>
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-on-surface">Registre RGPD</h1>
                    <div className="h-6 w-[1px] bg-outline-variant"></div>
                    <span className="text-sm text-on-surface-variant">Article 30 - Traitements de données</span>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:brightness-110 transition-all"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Ajouter
                </button>
            </header>

            <main className="pt-24 md:pl-72 min-h-screen p-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined">error</span>
                        {error}
                    </div>
                )}

                {/* Formulaire */}
                {showForm && (
                    <div className="mb-8 bg-white border border-outline-variant/30 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-on-surface mb-4">
                            {editingId ? 'Modifier le traitement' : 'Nouveau traitement'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1">Nom du traitement *</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface text-on-surface focus:outline-none focus:border-primary"
                                        placeholder="Ex: Authentification utilisateur"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1">Base légale *</label>
                                    <input
                                        type="text"
                                        value={form.legal_basis}
                                        onChange={(e) => setForm({ ...form, legal_basis: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface text-on-surface focus:outline-none focus:border-primary"
                                        placeholder="Ex: Art. 6(1)(b) RGPD"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-on-surface mb-1">Finalité *</label>
                                <input
                                    type="text"
                                    value={form.purpose}
                                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface text-on-surface focus:outline-none focus:border-primary"
                                    placeholder="Ex: Permettre l'accès sécurisé à la plateforme"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-on-surface mb-1">Catégories de données *</label>
                                <input
                                    type="text"
                                    value={form.data_categories}
                                    onChange={(e) => setForm({ ...form, data_categories: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface text-on-surface focus:outline-none focus:border-primary"
                                    placeholder="Ex: Email, mot de passe hashé, IP"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1">Durée de rétention *</label>
                                    <input
                                        type="text"
                                        value={form.retention_period}
                                        onChange={(e) => setForm({ ...form, retention_period: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface text-on-surface focus:outline-none focus:border-primary"
                                        placeholder="Ex: 12 mois glissants"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1">Destinataires</label>
                                    <input
                                        type="text"
                                        value={form.recipients}
                                        onChange={(e) => setForm({ ...form, recipients: e.target.value })}
                                        className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface text-on-surface focus:outline-none focus:border-primary"
                                        placeholder="Ex: DSI uniquement"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="bg-primary text-on-primary px-6 py-2 rounded-xl text-sm font-medium hover:brightness-110 transition-all">
                                    {editingId ? 'Modifier' : 'Créer'}
                                </button>
                                <button type="button" onClick={resetForm} className="px-6 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-all">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Liste */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : processings.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4 block">shield</span>
                        <p className="text-on-surface-variant">Aucun traitement enregistré</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {processings.map((p) => (
                            <div key={p.id} className="bg-white border border-outline-variant/30 rounded-2xl p-6 hover:shadow-md transition-all">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary">shield</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-on-surface">{p.name}</h3>
                                            <p className="text-xs text-on-surface-variant">{p.legal_basis}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(p)}
                                            className="p-2 rounded-lg hover:bg-surface-container-low transition-all"
                                        >
                                            <span className="material-symbols-outlined text-sm text-on-surface-variant">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p.id, p.name)}
                                            className="p-2 rounded-lg hover:bg-red-50 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-sm text-red-500">delete</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-on-surface-variant text-xs font-medium">Finalité</span>
                                        <p className="text-on-surface mt-1">{p.purpose}</p>
                                    </div>
                                    <div>
                                        <span className="text-on-surface-variant text-xs font-medium">Données collectées</span>
                                        <p className="text-on-surface mt-1">{p.data_categories}</p>
                                    </div>
                                    <div>
                                        <span className="text-on-surface-variant text-xs font-medium">Rétention</span>
                                        <p className="text-on-surface mt-1">{p.retention_period}</p>
                                    </div>
                                </div>
                                {p.recipients && (
                                    <div className="mt-3 text-sm">
                                        <span className="text-on-surface-variant text-xs font-medium">Destinataires : </span>
                                        <span className="text-on-surface">{p.recipients}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default RGPDAdmin;
