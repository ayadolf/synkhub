import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { workspaceAPI, postitAPI } from '../api/boards';
import Sidebar from '../components/Sidebar';
import Avatar from '../components/Avatar';

const DecisionHub = () => {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [workspaces, setWorkspaces] = useState([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
    const [postits, setPostits] = useState([]);
    const [selectedPostit, setSelectedPostit] = useState(null);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentContent, setEditingCommentContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWorkspaces();
    }, []);

    useEffect(() => {
        if (selectedWorkspace) {
            setSelectedPostit(null);
            setComments([]);
            loadPostits(selectedWorkspace.id);
        }
    }, [selectedWorkspace]);

    useEffect(() => {
        if (selectedPostit) {
            loadComments(selectedPostit.id);
        }
    }, [selectedPostit]);

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

    const loadPostits = async (workspaceId) => {
        try {
            const response = await postitAPI.getAllInWorkspace(workspaceId);
            setPostits(response.data);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const loadComments = async (postitId) => {
        try {
            const response = await postitAPI.getComments(postitId);
            setComments(response.data);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const handleVote = async (postitId) => {
        try {
            const response = await postitAPI.vote(postitId);
            setPostits(prev => prev.map(p => p.id === postitId ? response.data : p));
            if (selectedPostit?.id === postitId) {
                setSelectedPostit(response.data);
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim() || !selectedPostit) return;
        try {
            const response = await postitAPI.addComment(selectedPostit.id, { content: comment });
            setComments(prev => [...prev, response.data]);
            setComment('');
            setPostits(prev => prev.map(p =>
                p.id === selectedPostit.id ? { ...p, comment_count: p.comment_count + 1 } : p
            ));
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const handleEditComment = async (commentId) => {
        const text = editingCommentContent.trim();
        if (!text) return;
        try {
            const response = await postitAPI.updateComment(commentId, { content: text });
            setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: response.data.content } : c));
            setEditingCommentId(null);
            setEditingCommentContent('');
        } catch (error) {
            console.error('Erreur modification commentaire:', error);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await postitAPI.deleteComment(commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
            setPostits(prev => prev.map(p =>
                p.id === selectedPostit?.id ? { ...p, comment_count: Math.max(0, (p.comment_count || 1) - 1) } : p
            ));
        } catch (error) {
            console.error('Erreur suppression commentaire:', error);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'text-primary';
            case 'Medium': return 'text-secondary';
            case 'Low': return 'text-on-surface-variant';
            default: return 'text-on-surface-variant';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-primary/15 text-primary';
            case 'In Review': return 'bg-blue-100 text-blue-700';
            case 'Pending': return 'bg-yellow-100 text-yellow-700';
            case 'Rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
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
                    <h1 className="text-xl font-bold text-on-surface">Decision Hub</h1>
                    <div className="h-6 w-[1px] bg-outline-variant"></div>
                    <span className="text-sm text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">folder</span>
                        {selectedWorkspace?.name || 'Workspace'}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <Avatar avatar_url={user?.avatar_url} username={user?.username} size="w-10 h-10" />
                </div>
            </header>

            <main className="pt-20 md:pl-72 min-h-screen">
                <div className="h-[calc(100vh-80px)] grid grid-cols-12 gap-6 p-6">
                    {/* Workspace Tabs */}
                    <div className="col-span-12 flex items-center gap-4 overflow-x-auto pb-2">
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

                    {/* Post-its List */}
                    <section className="col-span-3 bg-white border border-outline-variant/30 rounded-2xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-primary">Post-its</h2>
                            <span className="bg-surface-container-highest px-3 py-1 rounded-full text-xs text-on-surface-variant">{postits.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {postits.map((postit) => (
                                <div
                                    key={postit.id}
                                    onClick={() => setSelectedPostit(postit)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all border-l-4 ${
                                        selectedPostit?.id === postit.id
                                            ? 'bg-primary/5 border-primary'
                                            : 'bg-surface border-transparent hover:bg-surface-container-high'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`font-bold text-[10px] tracking-widest uppercase ${getPriorityColor(postit.priority)}`}>
                                            {postit.priority}
                                        </span>
                                        <div className="flex items-center gap-1 text-on-surface-variant">
                                            <span className="material-symbols-outlined text-sm">thumb_up</span>
                                            <span className="text-xs">{postit.vote_count}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-bold text-on-surface leading-tight">{postit.content}</h3>
                                </div>
                            ))}
                            {postits.length === 0 && (
                                <div className="p-8 text-center text-on-surface-variant">
                                    <span className="material-symbols-outlined text-5xl mb-2 block">lightbulb</span>
                                    <p className="text-sm">No post-its yet</p>
                                    <p className="text-xs mt-1">Create post-its on boards to see them here</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Post-it Detail */}
                    <section className="col-span-6 bg-white border border-outline-variant/30 rounded-2xl flex flex-col overflow-hidden">
                        {selectedPostit ? (
                            <>
                                <div className="p-6 border-b border-outline-variant/20">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(selectedPostit.status)}`}>
                                            {selectedPostit.status}
                                        </span>
                                        <button
                                            onClick={() => handleVote(selectedPostit.id)}
                                            className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-surface-container-low text-on-surface-variant hover:bg-primary/10 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-sm">thumb_up</span>
                                            {selectedPostit.vote_count}
                                        </button>
                                    </div>
                                    <h2 className="text-2xl font-bold text-on-surface mb-4">{selectedPostit.content}</h2>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-on-surface font-bold flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">forum</span>
                                            Discussion ({comments.length})
                                        </h4>
                                        {comments.map((c) => (
                                            <div key={c.id} className="flex gap-3 group/comment">
                                                <Avatar avatar_url={c.author_avatar_url} username={c.author_name} size="w-10 h-10" />
                                                <div className="flex-1 bg-surface-container p-4 rounded-xl rounded-tl-none">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-on-surface text-sm">{c.author_name || 'User'}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-on-surface-variant text-xs">{new Date(c.created_at).toLocaleString()}</span>
                                                            {c.author_id === user?.id && editingCommentId !== c.id && (
                                                                <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => { setEditingCommentId(c.id); setEditingCommentContent(c.content); }}
                                                                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-black/5 text-on-surface-variant"
                                                                    >
                                                                        <span className="material-symbols-outlined text-xs">edit</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteComment(c.id)}
                                                                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-error/10 text-error"
                                                                    >
                                                                        <span className="material-symbols-outlined text-xs">delete</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {editingCommentId === c.id ? (
                                                        <form onSubmit={(e) => { e.preventDefault(); handleEditComment(c.id); }} className="flex items-center gap-2 mt-2">
                                                            <input
                                                                type="text"
                                                                value={editingCommentContent}
                                                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                                                onKeyDown={(e) => { if (e.key === 'Escape') setEditingCommentId(null); }}
                                                                className="flex-1 text-sm bg-white border border-outline-variant rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary"
                                                                autoFocus
                                                            />
                                                            <button type="submit" className="text-xs text-primary font-bold px-2 py-1">OK</button>
                                                        </form>
                                                    ) : (
                                                        <p className="text-on-surface-variant text-sm">{c.content}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {comments.length === 0 && (
                                            <p className="text-sm text-on-surface-variant">No comments yet. Start the discussion!</p>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 border-t border-outline-variant/20">
                                    <form onSubmit={handleAddComment} className="flex items-center gap-3 bg-surface-container rounded-full px-4 py-2">
                                        <input
                                            type="text"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Add a comment..."
                                            className="bg-transparent border-none focus:ring-0 flex-1 text-on-surface placeholder:text-on-surface-variant/50 text-sm"
                                        />
                                        <button type="submit" className="bg-primary text-on-primary w-8 h-8 rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                                            <span className="material-symbols-outlined text-lg">send</span>
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-on-surface-variant">
                                <p>Select a post-it to view details</p>
                            </div>
                        )}
                    </section>

                    {/* Right Sidebar */}
                    <aside className="col-span-3 flex flex-col gap-6 overflow-hidden">
                        <section className="flex-1 bg-white border border-outline-variant/30 rounded-2xl flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface">Top Voted</h3>
                                <span className="material-symbols-outlined text-primary">trending_up</span>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto">
                                <ul className="space-y-3">
                                    {[...postits].sort((a, b) => b.vote_count - a.vote_count).slice(0, 5).map((postit) => (
                                        <li key={postit.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container-low cursor-pointer" onClick={() => setSelectedPostit(postit)}>
                                            <span className="material-symbols-outlined text-primary text-lg">thumb_up</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-on-surface truncate">{postit.content}</p>
                                                <p className="text-[10px] text-on-surface-variant">{postit.vote_count} votes</p>
                                            </div>
                                        </li>
                                    ))}
                                    {postits.length === 0 && (
                                        <p className="text-sm text-on-surface-variant text-center py-4">No post-its yet</p>
                                    )}
                                </ul>
                            </div>
                        </section>

                        <section className="flex-1 bg-white border border-outline-variant/30 rounded-2xl flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-outline-variant/20">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface">Stats</h3>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-on-surface-variant">Total Post-its</span>
                                    <span className="font-bold text-on-surface">{postits.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-on-surface-variant">Total Votes</span>
                                    <span className="font-bold text-on-surface">{postits.reduce((sum, p) => sum + p.vote_count, 0)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-on-surface-variant">Total Comments</span>
                                    <span className="font-bold text-on-surface">{postits.reduce((sum, p) => sum + p.comment_count, 0)}</span>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default DecisionHub;
