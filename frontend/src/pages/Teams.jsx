import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOnline } from '../context/OnlineContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { workspaceAPI, teamAPI } from '../api/boards';
import Sidebar from '../components/Sidebar';
import Avatar from '../components/Avatar';

const Teams = () => {
    const { user } = useAuth();
    const { onlineUsers, isOnline } = useOnline();
    const { isDark } = useTheme();
    const toast = useToast();
    const [workspaces, setWorkspaces] = useState([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadWorkspaces();
    }, []);

    useEffect(() => {
        if (selectedWorkspace) {
            loadMembers(selectedWorkspace.id);
        }
    }, [selectedWorkspace]);

    const loadWorkspaces = async () => {
        try {
            const response = await workspaceAPI.getAll();
            setWorkspaces(response.data);
            if (response.data.length > 0) {
                setSelectedWorkspace(response.data[0]);
            }
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMembers = async (workspaceId) => {
        try {
            const response = await teamAPI.getMembers(workspaceId);
            setMembers(response.data);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim() || !selectedWorkspace) return;
        try {
            await teamAPI.invite(selectedWorkspace.id, inviteEmail);
            toast.success(`Invitation envoyee a ${inviteEmail}`);
            setInviteEmail('');
            setShowInviteModal(false);
        } catch (error) {
            toast.error(error.response?.data?.detail || "Erreur lors de l'envoi de l'invitation");
        }
    };

    const handleRoleChange = async (memberId, newRole) => {
        try {
            await teamAPI.updateRole(memberId, newRole);
            setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Erreur lors du changement de role');
        }
    };

    const handleRemove = async (memberId) => {
        if (!confirm('Remove this member?')) return;
        try {
            await teamAPI.removeMember(memberId);
            setMembers(prev => prev.filter(m => m.id !== memberId));
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Erreur lors de la suppression du membre');
        }
    };

    const filteredMembers = members.filter(m =>
        m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const onlineCount = members.filter(m => isOnline(m.user_id)).length;
    const adminCount = members.filter(m => m.role === 'admin').length;

    const getMemberColor = (index) => {
        const colors = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-primary-fixed-dim', 'bg-secondary-container', 'bg-tertiary-container'];
        return colors[index % colors.length];
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-surface'}`}>
            <Sidebar />

            <header className={`fixed top-0 w-full z-30 flex justify-between items-center px-10 py-4 backdrop-blur-xl border-b md:pl-[312px] ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-outline-variant/20'}`}>
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-on-surface">Teams</h1>
                    <span className="px-3 py-1 bg-primary/15 text-primary rounded-full text-xs font-bold">{onlineCount} online</span>
                </div>
                <div className="flex items-center gap-4">
                    <Avatar avatar_url={user?.avatar_url} username={user?.username} size="w-10 h-10" />
                </div>
            </header>

            <main className="pt-20 md:pl-72 min-h-screen">
                <div className="px-4 md:px-10 py-6 max-w-[1200px] mx-auto space-y-6">
                    <div className="flex items-center gap-4 overflow-x-auto pb-2">
                        {workspaces.map((workspace) => (
                            <button
                                key={workspace.id}
                                onClick={() => setSelectedWorkspace(workspace)}
                                className={`px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                    selectedWorkspace?.id === workspace.id
                                        ? 'bg-primary text-on-primary shadow-md'
                                        : 'bg-white border border-outline-variant text-on-surface-variant hover:border-primary/50'
                                }`}
                            >
                                {workspace.name}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">group</span>
                            </div>
                            <div>
                                <p className="text-xs text-on-surface-variant">Total Members</p>
                                <p className="text-2xl font-bold text-on-surface">{members.length}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">circle</span>
                            </div>
                            <div>
                                <p className="text-xs text-on-surface-variant">Online Now</p>
                                <p className="text-2xl font-bold text-on-surface">{onlineCount}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                                <span className="material-symbols-outlined">admin_panel_settings</span>
                            </div>
                            <div>
                                <p className="text-xs text-on-surface-variant">Admins</p>
                                <p className="text-2xl font-bold text-on-surface">{adminCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-outline-variant/30 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-bold text-on-surface">Team Members</h2>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search members..."
                                        className="pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:brightness-110 transition-all"
                            >
                                <span className="material-symbols-outlined text-lg">person_add</span>
                                Invite
                            </button>
                        </div>

                        <div className="divide-y divide-outline-variant/20">
                            {filteredMembers.map((member, index) => {
                                const memberOnline = isOnline(member.user_id);
                                return (
                                    <div key={member.id} className="px-6 py-4 flex items-center gap-4 hover:bg-surface-container-low/50 transition-colors">
                                        <div className="relative">
                                            <Avatar
                                                avatar_url={member.avatar_url}
                                                username={member.username}
                                                size="w-12 h-12"
                                            />
                                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${memberOnline ? 'bg-primary' : 'bg-gray-400'}`}></div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-on-surface text-sm">{member.username}</p>
                                            <p className="text-xs text-on-surface-variant">{member.email}</p>
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${memberOnline ? 'bg-primary/15 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                                            {memberOnline ? 'Online' : 'Offline'}
                                        </span>
                                        <span className="text-xs text-on-surface-variant">
                                            Joined {new Date(member.joined_at).toLocaleDateString()}
                                        </span>
                                        <select
                                            value={member.role}
                                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                            className="px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="member">Member</option>
                                            <option value="viewer">Viewer</option>
                                        </select>
                                        <button
                                            onClick={() => handleRemove(member.id)}
                                            className="p-2 rounded-lg hover:bg-error-container text-on-surface-variant hover:text-error transition-colors"
                                        >
                                            <span className="material-symbols-outlined">person_remove</span>
                                        </button>
                                    </div>
                                );
                            })}
                            {filteredMembers.length === 0 && (
                                <div className="p-12 text-center text-on-surface-variant">
                                    <span className="material-symbols-outlined text-6xl mb-4 block">group</span>
                                    <p className="text-lg font-medium mb-2">No members found</p>
                                    <p className="text-sm">Invite team members to get started</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInviteModal(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">email</span>
                            </div>
                            <h3 className="text-lg font-bold text-on-surface">Invite by Email</h3>
                        </div>
                        <p className="text-sm text-on-surface-variant mb-4">An invitation email will be sent with a link to join the workspace.</p>
                        <form onSubmit={handleInvite}>
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="email@company.com"
                                className="w-full p-3 border border-outline-variant rounded-xl mb-4 focus:ring-2 focus:ring-primary focus:border-primary"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 py-3 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors text-sm font-medium">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-3 bg-primary text-on-primary rounded-xl hover:brightness-110 transition-all text-sm font-medium flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-lg">send</span>
                                    Send Invitation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Teams;
