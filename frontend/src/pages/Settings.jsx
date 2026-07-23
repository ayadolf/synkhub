import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { avatarAPI, profileAPI, auditAPI } from '../api/boards';
import Sidebar from '../components/Sidebar';
import Avatar from '../components/Avatar';

const Settings = () => {
    const { user, refreshUser, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('profile');

    const [username, setUsername] = useState(user?.username || '');
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState(null);

    const [uploading, setUploading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const fileInputRef = useRef(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState(null);

    const [deleting, setDeleting] = useState(false);

    const [processings, setProcessings] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditStats, setAuditStats] = useState(null);

    useEffect(() => {
        setUsername(user?.username || '');
    }, [user]);

    useEffect(() => {
        if (activeTab === 'privacy' && user?.role === 'admin') {
            auditAPI.getProcessings().then(r => setProcessings(r.data)).catch(() => {});
            auditAPI.getStats().then(r => setAuditStats(r.data)).catch(() => {});
            auditAPI.getLogs({ limit: 20 }).then(r => setAuditLogs(r.data.logs || [])).catch(() => {});
        }
    }, [activeTab, user]);

    const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');

    const getAvatarUrl = () => {
        if (avatarPreview) return avatarPreview;
        if (user?.avatar_url) return `${API_URL}${user.avatar_url}`;
        return null;
    };

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { toast.warning('Fichier trop volumineux. Maximum 2 Mo.'); return; }
        if (!file.type.startsWith('image/')) { toast.warning('Format non supporte. Utilisez JPG, PNG ou GIF.'); return; }
        setAvatarPreview(URL.createObjectURL(file));
        setUploading(true);
        try {
            await avatarAPI.upload(file);
            await refreshUser();
            setAvatarPreview(null);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Erreur lors de l\'upload de l\'avatar');
            setAvatarPreview(null);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!confirm('Supprimer l\'avatar ?')) return;
        try { await avatarAPI.delete(); await refreshUser(); } catch {}
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;
        setSavingProfile(true);
        setProfileMsg(null);
        try {
            await profileAPI.update({ username: username.trim() });
            await refreshUser();
            setProfileMsg({ type: 'success', text: 'Profil mis à jour' });
        } catch (err) {
            setProfileMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur' });
        } finally {
            setSavingProfile(false);
            setTimeout(() => setProfileMsg(null), 3000);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!currentPassword || !newPassword) return;
        if (newPassword !== confirmPassword) {
            setPasswordMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
            return;
        }
        if (newPassword.length < 8) {
            setPasswordMsg({ type: 'error', text: 'Minimum 8 caractères' });
            return;
        }
        setChangingPassword(true);
        setPasswordMsg(null);
        try {
            await profileAPI.changePassword({ current_password: currentPassword, new_password: newPassword });
            setPasswordMsg({ type: 'success', text: 'Mot de passe modifié' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPasswordMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur' });
        } finally {
            setChangingPassword(false);
            setTimeout(() => setPasswordMsg(null), 3000);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Êtes-vous sûr ? Cette action est irréversible.')) return;
        if (!confirm('Toutes vos données seront supprimées. Confirmer ?')) return;
        setDeleting(true);
        try {
            await profileAPI.deleteAccount();
            logout();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Erreur lors de la suppression du compte');
            setDeleting(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profil', icon: 'person' },
        { id: 'appearance', label: 'Apparence', icon: 'palette' },
        { id: 'security', label: 'Sécurité', icon: 'security' },
        { id: 'privacy', label: 'Confidentialité', icon: 'shield', adminOnly: true },
    ];

    const visibleTabs = tabs.filter(t => !t.adminOnly || user?.role === 'admin');

    const inputClass = `w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-outline-variant'}`;
    const labelClass = `block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-on-surface'}`;

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-surface'}`}>
            <Sidebar />

            <header className={`fixed top-0 w-full z-30 flex justify-between items-center px-10 py-4 backdrop-blur-xl border-b md:pl-[312px] ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-outline-variant/20'}`}>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-on-surface'}`}>Paramètres</h1>
                <div className="flex items-center gap-4">
                    <Avatar avatar_url={user?.avatar_url} username={user?.username} size="w-10 h-10" />
                </div>
            </header>

            <main className="pt-20 md:pl-72 min-h-screen">
                <div className="px-4 md:px-10 py-6 max-w-[1000px] mx-auto">
                    <div className={`border rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-outline-variant/30'}`}>
                        <div className={`border-b flex ${isDark ? 'border-gray-700' : 'border-outline-variant/20'}`}>
                            {visibleTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                                        activeTab === tab.id
                                            ? 'text-primary border-primary bg-primary/5'
                                            : `${isDark ? 'text-gray-400 border-transparent hover:bg-gray-700' : 'text-on-surface-variant border-transparent hover:bg-surface-container-low'}`
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-8">
                            {activeTab === 'profile' && (
                                <form onSubmit={handleSaveProfile} className="space-y-6 max-w-lg">
                                    <div className="flex items-center gap-6 mb-8">
                                        <div
                                            className="relative w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-2xl cursor-pointer hover:opacity-80 transition-opacity overflow-hidden group"
                                            onClick={handleAvatarClick}
                                        >
                                            {getAvatarUrl() ? (
                                                <img src={getAvatarUrl()} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                user?.username?.charAt(0).toUpperCase()
                                            )}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                                            </div>
                                            {uploading && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                        <div>
                                            <button type="button" onClick={handleAvatarClick} disabled={uploading} className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors disabled:opacity-50">
                                                {uploading ? 'Envoi...' : 'Changer l\'avatar'}
                                            </button>
                                            {user?.avatar_url && (
                                                <button type="button" onClick={handleRemoveAvatar} className="ml-2 px-4 py-2 text-error text-sm font-medium hover:underline">Supprimer</button>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Nom d'utilisateur</label>
                                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} />
                                    </div>

                                    <div>
                                        <label className={labelClass}>Email</label>
                                        <input type="email" value={user?.email || ''} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
                                        <p className="text-xs text-on-surface-variant mt-1">L'email ne peut pas être modifié</p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <button type="submit" disabled={savingProfile || username === user?.username} className="px-6 py-3 bg-primary text-on-primary rounded-xl font-medium hover:brightness-110 transition-all disabled:opacity-50">
                                            {savingProfile ? 'Enregistrement...' : 'Enregistrer'}
                                        </button>
                                        {profileMsg && (
                                            <span className={`text-sm font-medium flex items-center gap-1 ${profileMsg.type === 'success' ? 'text-green-600' : 'text-error'}`}>
                                                <span className="material-symbols-outlined text-lg">{profileMsg.type === 'success' ? 'check_circle' : 'error'}</span>
                                                {profileMsg.text}
                                            </span>
                                        )}
                                    </div>
                                </form>
                            )}

                            {activeTab === 'appearance' && (
                                <div className="space-y-6 max-w-lg">
                                    <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-surface-container-low'}`}>
                                        <div>
                                            <p className={`font-medium ${isDark ? 'text-white' : 'text-on-surface'}`}>Mode sombre</p>
                                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-on-surface-variant'}`}>Basculer entre les thèmes clair et sombre</p>
                                        </div>
                                        <button onClick={toggleTheme} className={`w-12 h-6 rounded-full transition-colors ${isDark ? 'bg-primary' : 'bg-outline-variant'}`}>
                                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-6 max-w-lg">
                                    <form onSubmit={handleChangePassword} className={`p-4 rounded-xl space-y-3 ${isDark ? 'bg-gray-700' : 'bg-surface-container-low'}`}>
                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-on-surface'}`}>Changer le mot de passe</p>
                                        <input type="password" placeholder="Mot de passe actuel" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
                                        <input type="password" placeholder="Nouveau mot de passe" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
                                        <input type="password" placeholder="Confirmer le nouveau mot de passe" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
                                        <div className="flex items-center gap-4">
                                            <button type="submit" disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword} className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50">
                                                {changingPassword ? 'Modification...' : 'Modifier'}
                                            </button>
                                            {passwordMsg && (
                                                <span className={`text-sm font-medium ${passwordMsg.type === 'success' ? 'text-green-600' : 'text-error'}`}>
                                                    {passwordMsg.text}
                                                </span>
                                            )}
                                        </div>
                                    </form>

                                    <div className="p-4 bg-error-container/50 rounded-xl border border-error/20">
                                        <p className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-on-surface'}`}>Zone dangereuse</p>
                                        <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-on-surface-variant'}`}>Supprimer définitivement votre compte et toutes vos données</p>
                                        <button onClick={handleDeleteAccount} disabled={deleting} className="px-4 py-2 bg-error text-on-error rounded-xl text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50">
                                            {deleting ? 'Suppression...' : 'Supprimer le compte'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'privacy' && (
                                <div className="space-y-8">
                                    <div>
                                        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-on-surface'}`}>Registre des traitements (RGPD)</h3>
                                        <div className="space-y-3">
                                            {processings.map((p) => (
                                                <div key={p.id} className={`p-4 rounded-xl border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-surface-container-low border-outline-variant/30'}`}>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-on-surface'}`}>{p.name}</p>
                                                        <span className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">{p.legal_basis}</span>
                                                    </div>
                                                    <p className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-on-surface-variant'}`}>{p.purpose}</p>
                                                    <div className={`text-xs space-y-1 ${isDark ? 'text-gray-400' : 'text-on-surface-variant'}`}>
                                                        <p><span className="font-medium">Données :</span> {p.data_categories}</p>
                                                        <p><span className="font-medium">Rétention :</span> {p.retention_period}</p>
                                                        <p><span className="font-medium">Destinataires :</span> {p.recipients}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {auditStats && (
                                        <div>
                                            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-on-surface'}`}>Statistiques d'activité</h3>
                                            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-surface-container-low'}`}>
                                                <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-on-surface-variant'}`}>Actions enregistrées : <span className="font-bold text-primary">{auditStats.total_logs}</span></p>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {Object.entries(auditStats.by_action).map(([action, count]) => (
                                                        <div key={action} className={`p-3 rounded-lg text-center ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
                                                            <p className="text-lg font-bold text-primary">{count}</p>
                                                            <p className="text-[10px] text-on-surface-variant">{action}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-on-surface'}`}>Journal d'activité récent</h3>
                                        <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-gray-600' : 'border-outline-variant/30'}`}>
                                            {auditLogs.length === 0 && (
                                                <p className={`p-4 text-sm ${isDark ? 'text-gray-400' : 'text-on-surface-variant'}`}>Aucune activité enregistrée.</p>
                                            )}
                                            {auditLogs.map((log) => (
                                                <div key={log.id} className={`flex items-center gap-3 px-4 py-3 border-b last:border-0 ${isDark ? 'border-gray-600' : 'border-outline-variant/20'}`}>
                                                    <span className="material-symbols-outlined text-sm text-primary">info</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-on-surface'}`}>{log.action}</p>
                                                        {log.details && (
                                                            <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-on-surface-variant'}`}>
                                                                {JSON.stringify(log.details)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-on-surface-variant whitespace-nowrap">
                                                        {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Settings;
