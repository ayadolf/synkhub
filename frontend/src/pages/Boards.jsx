import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { workspaceAPI, boardAPI } from '../api/boards';
import Sidebar from '../components/Sidebar';
import Avatar from '../components/Avatar';

const Boards = () => {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [workspaces, setWorkspaces] = useState([]);
    const [boards, setBoards] = useState([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
    const [loading, setLoading] = useState(true);

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
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBoards = async (workspaceId) => {
        try {
            const response = await boardAPI.getAll(workspaceId);
            setBoards(response.data);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const handleDeleteBoard = async (boardId) => {
        if (!confirm('Supprimer ce board ?')) return;
        try {
            await boardAPI.delete(boardId);
            setBoards(prev => prev.filter(b => b.id !== boardId));
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const getBoardIcon = (index) => {
        const icons = ['campaign', 'architecture', 'lightbulb', 'rocket_launch', 'psychology', 'star', 'explore', 'science'];
        return icons[index % icons.length];
    };

    const getBoardColor = (index) => {
        const colors = ['#13a538', '#aecc53', '#e27954', '#163E2C', '#004129', '#9db0bf'];
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
                <div className="flex items-center flex-1 max-w-xl">
                    <div className="relative w-full group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">search</span>
                        <input className={`w-full border-none rounded-xl pl-12 pr-4 py-4 text-base focus:ring-2 focus:ring-primary/20 transition-all ${isDark ? 'bg-gray-700 text-white' : 'bg-surface-container-low'}`} placeholder="Search boards..." type="text" />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Avatar avatar_url={user?.avatar_url} username={user?.username} size="w-10 h-10" />
                </div>
            </header>

            <main className="pt-20 md:pl-72 min-h-screen">
                <div className="px-4 md:px-10 py-6 max-w-[1600px] mx-auto space-y-6">
                    {/* Workspace Tabs */}
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

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-on-surface">All Boards</h1>
                            <p className="text-sm text-on-surface-variant">{boards.length} board{boards.length !== 1 ? 's' : ''} in {selectedWorkspace?.name || 'workspace'}</p>
                        </div>
                    </div>

                    {/* Boards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {boards.map((board, index) => (
                            <Link
                                key={board.id}
                                to={`/boards/${board.id}`}
                                className="bg-white border border-outline-variant/30 rounded-2xl p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${getBoardColor(index)}15`, color: getBoardColor(index) }}>
                                        <span className="material-symbols-outlined">{getBoardIcon(index)}</span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.preventDefault(); handleDeleteBoard(board.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-error-container text-on-surface-variant hover:text-error transition-all"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                                <h3 className="text-lg font-semibold text-on-surface mb-2">{board.title}</h3>
                                <p className="text-sm text-on-surface-variant mb-6">Collaborative brainstorming board</p>
                                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
                                    <div className="flex -space-x-2">
                                        <Avatar avatar_url={board.author_avatar_url} username={board.author_name} size="w-8 h-8" />
                                    </div>
                                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                        {new Date(board.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </Link>
                        ))}

                        {boards.length === 0 && (
                            <div className="col-span-full p-16 text-center text-on-surface-variant border-2 border-dashed border-outline-variant rounded-2xl">
                                <span className="material-symbols-outlined text-7xl mb-4 block">note_add</span>
                                <p className="text-xl font-medium mb-2">No boards yet</p>
                                <p className="text-sm">Create your first board to start brainstorming</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Boards;
