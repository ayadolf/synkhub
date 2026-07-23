import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOnline } from '../context/OnlineContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { workspaceAPI, boardAPI, postitAPI } from '../api/boards';
import Avatar from '../components/Avatar';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { onlineUsers, isOnline } = useOnline();
    const { isDark } = useTheme();
    const toast = useToast();
    const navigate = useNavigate();
    const [workspaces, setWorkspaces] = useState([]);
    const [boards, setBoards] = useState([]);
    const [postitsCount, setPostitsCount] = useState(0);
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
    const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
    const [showCreateBoard, setShowCreateBoard] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [showDeleteWorkspace, setShowDeleteWorkspace] = useState(null);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadWorkspaces();
    }, []);

    useEffect(() => {
        if (selectedWorkspace) {
            loadBoards(selectedWorkspace.id);
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
            console.error('Erreur chargement workspaces:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBoards = async (workspaceId) => {
        try {
            const response = await boardAPI.getAll(workspaceId);
            setBoards(response.data);
            loadPostitsCount(response.data);
        } catch (error) {
            console.error('Erreur chargement boards:', error);
        }
    };

    const loadPostitsCount = async (boardsList) => {
        let total = 0;
        for (const board of boardsList) {
            try {
                const res = await postitAPI.getAll(board.id);
                total += res.data.length;
            } catch (e) {}
        }
        setPostitsCount(total);
    };

    const filteredBoards = useMemo(() => {
        if (!searchQuery.trim()) return boards;
        const q = searchQuery.toLowerCase();
        return boards.filter(b => b.title.toLowerCase().includes(q));
    }, [boards, searchQuery]);

    const filteredWorkspaces = useMemo(() => {
        if (!searchQuery.trim()) return workspaces;
        const q = searchQuery.toLowerCase();
        return workspaces.filter(w => w.name.toLowerCase().includes(q));
    }, [workspaces, searchQuery]);

    const handleCreateWorkspace = async (e) => {
        e.preventDefault();
        if (!newWorkspaceName.trim()) return;
        try {
            const response = await workspaceAPI.create({ name: newWorkspaceName });
            setWorkspaces(prev => [...prev, response.data]);
            setSelectedWorkspace(response.data);
            setNewWorkspaceName('');
            setShowCreateWorkspace(false);
        } catch (error) {
            console.error('Erreur création workspace:', error);
        }
    };

    const handleCreateBoard = async (e) => {
        e.preventDefault();
        if (!newBoardTitle.trim() || !selectedWorkspace) return;
        try {
            const response = await boardAPI.create(selectedWorkspace.id, { title: newBoardTitle });
            setBoards(prev => [...prev, response.data]);
            setNewBoardTitle('');
            setShowCreateBoard(false);
        } catch (error) {
            console.error('Erreur création board:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleDeleteWorkspace = async () => {
        if (!showDeleteWorkspace) return;
        try {
            await workspaceAPI.delete(showDeleteWorkspace.id);
            setWorkspaces(prev => prev.filter(w => w.id !== showDeleteWorkspace.id));
            if (selectedWorkspace?.id === showDeleteWorkspace.id) setSelectedWorkspace(null);
            setShowDeleteWorkspace(null);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Erreur lors de la suppression');
        }
    };

    const getBoardIcon = (index) => {
        const icons = ['campaign', 'architecture', 'lightbulb', 'rocket_launch', 'psychology', 'star'];
        return icons[index % icons.length];
    };

    const getBoardColor = (index) => {
        const colors = ['#13a538', '#aecc53', '#e27954', '#163E2C'];
        return colors[index % colors.length];
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-on-surface-variant">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-surface'}`}>
            <aside className={`fixed left-0 top-0 h-full flex flex-col p-6 z-40 border-r w-72 md:flex hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-outline-variant/30'}`}>
                <div className="flex items-center gap-4 mb-8 px-2">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined">dashboard</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-primary">SynkHub</h1>
                        <p className="text-xs text-on-surface-variant">Workspace</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowCreateBoard(true)}
                    className="w-full bg-primary text-on-primary font-medium py-4 px-6 rounded-xl mb-8 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-primary/10"
                >
                    <span className="material-symbols-outlined">add_circle</span>
                    New Board
                </button>

                <nav className="flex-1 space-y-2 px-2">
                    <NavLink to="/dashboard" className={({isActive}) => `flex items-center gap-4 p-4 rounded-xl transition-all ${isActive ? 'text-primary bg-primary-container/10 font-bold border border-primary/10' : 'text-on-surface-variant hover:bg-surface-container-low group'}`}>
                        <span className="material-symbols-outlined">grid_view</span>
                        <span className="text-sm">Dashboard</span>
                    </NavLink>
                    <NavLink to="/boards" className={({isActive}) => `flex items-center gap-4 p-4 rounded-xl transition-all ${isActive ? 'text-primary bg-primary-container/10 font-bold border border-primary/10' : 'text-on-surface-variant hover:bg-surface-container-low group'}`}>
                        <span className="material-symbols-outlined">layers</span>
                        <span className="text-sm">Boards</span>
                    </NavLink>
                    <NavLink to="/decision-hub" className={({isActive}) => `flex items-center gap-4 p-4 rounded-xl transition-all ${isActive ? 'text-primary bg-primary-container/10 font-bold border border-primary/10' : 'text-on-surface-variant hover:bg-surface-container-low group'}`}>
                        <span className="material-symbols-outlined">how_to_vote</span>
                        <span className="text-sm">Decision Hub</span>
                    </NavLink>
                    <NavLink to="/teams" className={({isActive}) => `flex items-center gap-4 p-4 rounded-xl transition-all ${isActive ? 'text-primary bg-primary-container/10 font-bold border border-primary/10' : 'text-on-surface-variant hover:bg-surface-container-low group'}`}>
                        <span className="material-symbols-outlined">group</span>
                        <span className="text-sm">Teams</span>
                    </NavLink>
                </nav>

                <div className="mt-auto space-y-2 px-2 pt-6 border-t border-outline-variant/30">
                    <NavLink to="/settings" className={({isActive}) => `flex items-center gap-4 p-4 rounded-xl transition-all ${isActive ? 'text-primary bg-primary-container/10 font-bold' : 'text-on-surface-variant hover:bg-surface-container-low group'}`}>
                        <span className="material-symbols-outlined">settings</span>
                        <span className="text-sm">Settings</span>
                    </NavLink>
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-all group">
                        <span className="material-symbols-outlined group-hover:text-primary transition-colors">logout</span>
                        <span className="text-sm">Logout</span>
                    </button>
                </div>
            </aside>

            <header className={`fixed top-0 w-full z-30 flex justify-between items-center px-10 py-4 backdrop-blur-xl border-b md:pl-[312px] ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-outline-variant/20'}`}>
                <div className="flex items-center flex-1 max-w-xl">
                    <div className="relative w-full group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">search</span>
                        <input
                            className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-4 text-base focus:ring-2 focus:ring-primary/20 transition-all"
                            placeholder="Search boards, workspaces..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 pr-4 border-r border-outline-variant/30">
                        <button className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-xl transition-colors relative">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full ring-2 ring-white"></span>
                        </button>
                        <button className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-xl transition-colors">
                            <span className="material-symbols-outlined">forum</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-3 pl-2 cursor-pointer hover:opacity-80 transition-opacity">
                        <div className="text-right md:block hidden">
                            <p className="text-sm font-bold text-on-surface">{user?.username}</p>
                            <p className="text-xs text-on-surface-variant">{user?.email}</p>
                        </div>
                        <Avatar avatar_url={user?.avatar_url} username={user?.username} size="w-10 h-10" />
                    </div>
                </div>
            </header>

            <main className="pt-20 md:pl-72 min-h-screen">
                <div className="px-4 md:px-10 py-6 max-w-[1600px] mx-auto space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 flex items-center gap-6 hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">dashboard_customize</span>
                            </div>
                            <div>
                                <p className="text-xs text-on-surface-variant">Total Boards</p>
                                <p className="text-2xl font-semibold text-on-surface">{boards.length}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 flex items-center gap-6 hover:border-secondary hover:shadow-lg hover:shadow-secondary/10 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                                <span className="material-symbols-outlined">group</span>
                            </div>
                            <div>
                                <p className="text-xs text-on-surface-variant">Workspaces</p>
                                <p className="text-2xl font-semibold text-on-surface">{workspaces.length}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 flex items-center gap-6 hover:border-tertiary hover:shadow-lg hover:shadow-tertiary/10 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
                                <span className="material-symbols-outlined">edit_square</span>
                            </div>
                            <div>
                                <p className="text-xs text-on-surface-variant">Post-its</p>
                                <p className="text-2xl font-semibold text-on-surface">{postitsCount}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 flex items-center gap-6 hover:border-primary-fixed-dim hover:shadow-lg transition-all">
                            <div className="w-12 h-12 rounded-xl bg-primary-fixed-dim/30 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">trending_up</span>
                            </div>
                            <div>
                                <p className="text-xs text-on-surface-variant">Online Now</p>
                                <p className="text-2xl font-semibold text-on-surface">{onlineUsers.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <section className="lg:col-span-8 space-y-6">
                            <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 flex flex-col min-h-[600px]">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl font-semibold text-on-surface">Active Brainstorming</h2>
                                        <p className="text-sm text-on-surface-variant">Ongoing collaborative sessions</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowCreateBoard(true)}
                                            className="p-2 bg-primary text-on-primary rounded-xl hover:brightness-110 transition-all flex items-center gap-1 px-4"
                                        >
                                            <span className="material-symbols-outlined text-lg">add</span>
                                            <span className="text-sm">New</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2">
                                    {filteredBoards.map((board, index) => (
                                        <Link
                                            key={board.id}
                                            to={`/boards/${board.id}`}
                                            className="p-6 bg-white border border-dashed border-outline-variant rounded-2xl hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group"
                                        >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${getBoardColor(index)}15`, color: getBoardColor(index) }}>
                                                        <span className="material-symbols-outlined">{getBoardIcon(index)}</span>
                                                    </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-semibold text-on-surface mb-1">{board.title}</h3>
                                            <p className="text-sm text-on-surface-variant line-clamp-2 mb-6">Collaborative brainstorming board</p>
                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/20">
                                                <div className="flex -space-x-2">
                                                    <Avatar avatar_url={board.author_avatar_url} username={board.author_name} size="w-8 h-8" />
                                                </div>
                                                <span className="text-xs text-on-surface-variant flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                                    {board.created_at ? new Date(board.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}

                                    {filteredBoards.length === 0 && searchQuery && (
                                        <div className="md:col-span-2 p-12 text-center text-on-surface-variant">
                                            <span className="material-symbols-outlined text-6xl mb-4 block">search_off</span>
                                            <p className="text-lg font-medium mb-2">No results for "{searchQuery}"</p>
                                            <p className="text-sm">Try a different search term</p>
                                        </div>
                                    )}

                                    {filteredBoards.length === 0 && !searchQuery && (
                                        <div className="md:col-span-2 p-12 text-center text-on-surface-variant border-2 border-dashed border-outline-variant rounded-2xl">
                                            <span className="material-symbols-outlined text-6xl mb-4 block">note_add</span>
                                            <p className="text-lg font-medium mb-2">No boards yet</p>
                                            <p className="text-sm">Create your first board to start brainstorming</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        <aside className="lg:col-span-4 space-y-6">
                            <div className="bg-white border border-outline-variant/30 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">workspaces</span>
                                        Workspaces
                                    </h3>
                                    <button
                                        onClick={() => setShowCreateWorkspace(true)}
                                        className="text-primary font-bold text-xs hover:underline"
                                    >
                                        + New
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {filteredWorkspaces.map((workspace) => (
                                        <div
                                            key={workspace.id}
                                            className={`w-full p-3 rounded-xl text-left transition-all group flex items-center justify-between ${
                                                selectedWorkspace?.id === workspace.id
                                                    ? 'bg-primary/10 border border-primary/20 text-primary font-bold'
                                                    : 'bg-surface-container-low border border-transparent hover:border-outline-variant text-on-surface-variant'
                                            }`}
                                        >
                                            <button
                                                className="flex-1 text-left"
                                                onClick={() => setSelectedWorkspace(workspace)}
                                            >
                                                {workspace.name}
                                            </button>
                                            {workspace.owner_id === user?.id && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setShowDeleteWorkspace(workspace); }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-error/10 text-error/60 hover:text-error"
                                                    title="Supprimer le workspace"
                                                >
                                                    <span className="material-symbols-outlined text-base">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {filteredWorkspaces.length === 0 && searchQuery && (
                                        <p className="text-sm text-on-surface-variant text-center py-4">No workspaces found</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-primary text-on-primary rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-sm">Live Collaboration</h4>
                                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full uppercase tracking-widest font-bold">{onlineUsers.length} Online</span>
                                </div>
                                <div className="space-y-3 max-h-48 overflow-y-auto">
                                    {onlineUsers.map((u) => (
                                        <div key={u.user_id} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full border-2 border-primary bg-surface-container-high flex items-center justify-center text-xs font-bold">
                                                {u.username?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-xs truncate opacity-80">{u.username}</p>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                                        </div>
                                    ))}
                                    {onlineUsers.length === 0 && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full border-2 border-primary bg-surface-container-high flex items-center justify-center text-xs font-bold">
                                                {user?.username?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-xs truncate opacity-80">You are online</p>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            {showCreateWorkspace && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateWorkspace(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-on-surface mb-4">Create Workspace</h3>
                        <form onSubmit={handleCreateWorkspace}>
                            <input
                                type="text"
                                value={newWorkspaceName}
                                onChange={(e) => setNewWorkspaceName(e.target.value)}
                                placeholder="Workspace name"
                                className="w-full p-3 border border-outline-variant rounded-xl mb-4 focus:ring-2 focus:ring-primary focus:border-primary"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowCreateWorkspace(false)} className="flex-1 py-3 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-3 bg-primary text-on-primary rounded-xl hover:brightness-110 transition-all">
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCreateBoard && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateBoard(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-on-surface mb-4">Create Board</h3>
                        <form onSubmit={handleCreateBoard}>
                            <input
                                type="text"
                                value={newBoardTitle}
                                onChange={(e) => setNewBoardTitle(e.target.value)}
                                placeholder="Board title"
                                className="w-full p-3 border border-outline-variant rounded-xl mb-4 focus:ring-2 focus:ring-primary focus:border-primary"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowCreateBoard(false)} className="flex-1 py-3 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-3 bg-primary text-on-primary rounded-xl hover:brightness-110 transition-all">
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteWorkspace && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteWorkspace(null)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error">
                                <span className="material-symbols-outlined">delete_forever</span>
                            </div>
                            <h3 className="text-lg font-semibold text-on-surface">Supprimer le workspace</h3>
                        </div>
                        <p className="text-on-surface-variant mb-6">
                            Voulez-vous vraiment supprimer <strong>{showDeleteWorkspace.name}</strong> ? Tous les boards associes seront egalement supprimes. Cette action est irreversible.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteWorkspace(null)} className="flex-1 py-3 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors">
                                Annuler
                            </button>
                            <button onClick={handleDeleteWorkspace} className="flex-1 py-3 bg-error text-white rounded-xl hover:brightness-110 transition-all">
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
