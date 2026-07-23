import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { BoardProvider, useBoard } from '../context/BoardContext';
import { boardAPI, teamAPI } from '../api/boards';
import Postit, { COLORS } from '../components/Postit';
import Toolbar from '../components/Toolbar';
import NotesSidebar from '../components/NotesSidebar';
import Avatar from '../components/Avatar';

const BOARD_COLORS = Object.keys(COLORS);

const UserCursor = ({ x, y, username, color }) => (
    <div
        className="absolute pointer-events-none transition-all duration-100 ease-out"
        style={{ left: `${x}px`, top: `${y}px`, zIndex: 9999 }}
    >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
            <path d="M5.65 5.65L12 20L14.35 13.35L21 11L5.65 5.65Z" fill={color} stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
        <div
            className="absolute top-5 left-4 px-2 py-0.5 rounded-full text-[10px] font-bold text-white whitespace-nowrap shadow-md"
            style={{ backgroundColor: color }}
        >
            {username}
        </div>
    </div>
);

    const COLORS_LIST = ['#13a538', '#aecc53', '#163E2C', '#e27954', '#004129', '#9db0bf', '#b8e6c8', '#fff3b0'];

const BoardContent = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const toast = useToast();
    const navigate = useNavigate();
    const { postits, setPostits, loadPostits, addPostit, movePostit, deletePostit, updatePostit, loading } = useBoard();
    const [board, setBoard] = useState(null);
    const [activeTool, setActiveTool] = useState('select');
    const [zoom, setZoom] = useState(85);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, text: 'Board created', time: 'Just now', icon: 'dashboard' },
    ]);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const canvasRef = useRef(null);
    const canvasInnerRef = useRef(null);
    const [drawingPoints, setDrawingPoints] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [shapes, setShapes] = useState([]);
    const [shapeStart, setShapeStart] = useState(null);
    const [textItems, setTextItems] = useState([]);
    const [showTextInput, setShowTextInput] = useState(false);
    const [textInputPos, setTextInputPos] = useState({ x: 0, y: 0 });
    const [textInputValue, setTextInputValue] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteSent, setInviteSent] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [remoteCursors, setRemoteCursors] = useState({});
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState('');
    const wsRef = useRef(null);
    const cursorThrottle = useRef(0);

    useEffect(() => {
        loadBoard();
        loadPostits(id);
        loadParticipants();
    }, [id]);

    useEffect(() => {
        if (postits.length > 0) {
            setHistory(prev => [...prev.slice(0, historyIndex + 1), { postits: [...postits], shapes: [...shapes], textItems: [...textItems] }]);
            setHistoryIndex(prev => prev + 1);
        }
    }, [postits.length]);

    useEffect(() => {
        if (!id || !user) return;
        connectWebSocket();
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [id, user]);

    const connectWebSocket = () => {
        const wsBase = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8000`;
        const token = localStorage.getItem('token');
        const wsUrl = `${wsBase}/ws/${id}?token=${token}&user_id=${user.id}&username=${encodeURIComponent(user.username)}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            
            if (msg.type === 'cursor:moved' && msg.data.user_id !== user.id) {
                setRemoteCursors(prev => ({
                    ...prev,
                    [msg.data.user_id]: {
                        x: msg.data.x,
                        y: msg.data.y,
                        username: msg.data.username
                    }
                }));
            } else if (msg.type === 'users:current') {
                setConnectedUsers(msg.data.users.filter(u => u.user_id !== user.id));
            } else if (msg.type === 'user:joined') {
                setConnectedUsers(prev => {
                    if (prev.find(u => u.user_id === msg.data.user_id)) return prev;
                    return [...prev, { user_id: msg.data.user_id, username: msg.data.username }];
                });
            } else if (msg.type === 'user:left') {
                setConnectedUsers(prev => prev.filter(u => u.user_id !== msg.data.user_id));
                setRemoteCursors(prev => {
                    const next = { ...prev };
                    delete next[msg.data.user_id];
                    return next;
                });
            } else if (msg.type === 'postit:moved' && msg.user_id !== user.id) {
                setPostits(prev => prev.map(p => p.id === msg.data.id ? { ...p, x_pos: msg.data.x_pos, y_pos: msg.data.y_pos } : p));
            } else if (msg.type === 'postit:created' && msg.user_id !== user.id) {
                setPostits(prev => {
                    if (prev.find(p => p.id === msg.data.id)) return prev;
                    return [...prev, msg.data];
                });
            } else if (msg.type === 'postit:updated' && msg.user_id !== user.id) {
                setPostits(prev => prev.map(p => p.id === msg.data.id ? { ...p, content: msg.data.content, color: msg.data.color, priority: msg.data.priority, status: msg.data.status } : p));
            } else if (msg.type === 'postit:deleted' && msg.user_id !== user.id) {
                setPostits(prev => prev.filter(p => p.id !== msg.data.postit_id));
            } else if (msg.type === 'vote:toggled' && msg.user_id !== user.id) {
                const targetPostit = postits.find(p => p.id === msg.data.id);
                if (targetPostit && targetPostit.author_id === user.id) {
                    setNotifications(prev => [{ id: Date.now(), text: `${msg.data.username || 'Someone'} liked your idea`, time: 'Just now', icon: 'thumb_up' }, ...prev]);
                }
                setPostits(prev => prev.map(p => p.id === msg.data.id ? { ...p, vote_count: msg.data.vote_count } : p));
            } else if (msg.type === 'comment:added' && msg.user_id !== user.id) {
                if (msg.data && msg.data.postit) {
                    const targetPostit = postits.find(p => p.id === msg.data.postit.id);
                    if (targetPostit && targetPostit.author_id === user.id) {
                        const name = msg.data.author_name || msg.data.comment?.author_name || 'Someone';
                        setNotifications(prev => [{ id: Date.now(), text: `${name} commented on your idea`, time: 'Just now', icon: 'chat_bubble' }, ...prev]);
                    }
                    setPostits(prev => prev.map(p => p.id === msg.data.postit.id ? { ...p, comment_count: msg.data.postit.comment_count } : p));
                }
            }
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected, reconnecting...');
            setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
        };
    };

    const sendCursorPosition = useCallback((x, y) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'cursor:move',
                data: { x, y }
            }));
        }
    }, []);

    const sendWsEvent = useCallback((type, data) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, data }));
        }
    }, []);

    const loadBoard = async () => {
        try {
            const response = await boardAPI.getOne(id);
            setBoard(response.data);
        } catch (error) {
            console.error('Erreur chargement board:', error);
            navigate('/dashboard');
        }
    };

    const loadParticipants = async () => {
        try {
            if (!board?.workspace_id) return;
            const response = await teamAPI.getMembers(board.workspace_id);
            setParticipants(response.data);
        } catch (error) {
            console.error('Erreur chargement participants:', error);
        }
    };

    useEffect(() => {
        if (board?.workspace_id) {
            loadParticipants();
        }
    }, [board?.workspace_id]);

    const handleCanvasClick = useCallback((e) => {
        if (e.target !== canvasRef.current && e.target !== canvasInnerRef.current) return;

        const innerEl = canvasInnerRef.current;
        if (!innerEl) return;

        const rect = innerEl.getBoundingClientRect();
        const scale = zoom / 100;
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        if (activeTool === 'postit') {
            const randomColor = BOARD_COLORS[Math.floor(Math.random() * BOARD_COLORS.length)];
            addPostit(id, {
                content: 'Nouveau post-it',
                color: randomColor,
                x_pos: Math.max(0, x - 100),
                y_pos: Math.max(0, y - 75),
            }).then(newPostit => {
                if (newPostit) {
                    sendWsEvent('postit:created', newPostit);
                }
            });
        } else if (activeTool === 'text') {
            setTextInputPos({ x: Math.max(0, x), y: Math.max(0, y) });
            setShowTextInput(true);
            setTextInputValue('');
        } else if (activeTool === 'shapes') {
            setShapeStart({ x, y });
        }
    }, [activeTool, zoom, id, addPostit]);

    const handleCanvasMouseDown = useCallback((e) => {
        if (activeTool !== 'pen') return;
        if (e.target !== canvasRef.current && e.target !== canvasInnerRef.current) return;

        const innerEl = canvasInnerRef.current;
        if (!innerEl) return;

        const rect = innerEl.getBoundingClientRect();
        const scale = zoom / 100;
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        setIsDrawing(true);
        setDrawingPoints([{ x, y }]);
    }, [activeTool, zoom]);

    const handleCanvasMouseMove = useCallback((e) => {
        const innerEl = canvasInnerRef.current;
        if (!innerEl) return;

        const rect = innerEl.getBoundingClientRect();
        const scale = zoom / 100;
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        const now = Date.now();
        if (now - cursorThrottle.current > 30) {
            cursorThrottle.current = now;
            sendCursorPosition(x, y);
        }

        if (isDrawing && activeTool === 'pen') {
            setDrawingPoints(prev => [...prev, { x, y }]);
        }
    }, [isDrawing, activeTool, zoom, sendCursorPosition]);

    const handleCanvasMouseUp = useCallback((e) => {
        if (activeTool === 'pen' && isDrawing && drawingPoints.length > 1) {
            setShapes(prev => [...prev, { type: 'pen', points: drawingPoints, id: Date.now() }]);
            setDrawingPoints([]);
            setIsDrawing(false);
        } else if (activeTool === 'shapes' && shapeStart) {
            const innerEl = canvasInnerRef.current;
            if (!innerEl) return;
            const rect = innerEl.getBoundingClientRect();
            const scale = zoom / 100;
            const x = (e.clientX - rect.left) / scale;
            const y = (e.clientY - rect.top) / scale;
            const newShape = {
                type: 'rect',
                x: Math.min(shapeStart.x, x),
                y: Math.min(shapeStart.y, y),
                width: Math.abs(x - shapeStart.x),
                height: Math.abs(y - shapeStart.y),
                id: Date.now(),
            };
            setShapes(prev => [...prev, newShape]);
            setShapeStart(null);
        }
    }, [activeTool, isDrawing, drawingPoints, shapeStart, zoom]);

    const handleTextSubmit = (e) => {
        e.preventDefault();
        if (textInputValue.trim()) {
            setTextItems(prev => [...prev, { id: Date.now(), x: textInputPos.x, y: textInputPos.y, content: textInputValue }]);
        }
        setShowTextInput(false);
        setTextInputValue('');
    };

    const handleDragEnd = useCallback((postId, newX, newY) => {
        movePostit(postId, Math.max(0, newX), Math.max(0, newY)).then(() => {
            sendWsEvent('postit:moved', { id: postId, x_pos: Math.max(0, newX), y_pos: Math.max(0, newY) });
        });
    }, [movePostit, sendWsEvent]);

    const handleTitleSave = async () => {
        if (!titleValue.trim() || titleValue === board.title) {
            setEditingTitle(false);
            return;
        }
        try {
            const response = await boardAPI.update(id, { title: titleValue.trim() });
            setBoard(response.data);
            setEditingTitle(false);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Erreur lors de la modification du titre');
            setTitleValue(board.title);
            setEditingTitle(false);
        }
    };

    const handleZoomIn = () => setZoom(prev => Math.min(150, prev + 10));
    const handleZoomOut = () => setZoom(prev => Math.max(30, prev - 10));

    const handleInviteByEmail = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim() || !board?.workspace_id) return;
        try {
            await teamAPI.invite(board.workspace_id, inviteEmail);
            setInviteSent(true);
            setInviteEmail('');
            setTimeout(() => setInviteSent(false), 3000);
        } catch (error) {
            toast.error(error.response?.data?.detail || "Erreur lors de l'envoi de l'invitation");
        }
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const prev = history[historyIndex - 1];
            setHistoryIndex(historyIndex - 1);
            if (prev.postits) {
                prev.postits.forEach(p => updatePostit(p.id, { content: p.content }));
            }
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const next = history[historyIndex + 1];
            setHistoryIndex(historyIndex + 1);
            if (next.postits) {
                next.postits.forEach(p => updatePostit(p.id, { content: p.content }));
            }
        }
    };

    const getPointsPath = (points) => {
        if (points.length < 2) return '';
        return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    };

    const getMemberColor = (index) => COLORS_LIST[index % COLORS_LIST.length];

    if (!board) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-on-surface-variant">Loading board...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen overflow-hidden bg-surface select-none">
            <header className={`fixed top-0 w-full z-50 flex justify-between items-center px-10 py-3 backdrop-blur-md shadow-sm ${isDark ? 'bg-gray-800/80' : 'bg-white/80'}`}>
                <div className="flex items-center gap-6">
                    <Link to="/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-on-primary">
                            <span className="material-symbols-outlined">lightbulb</span>
                        </div>
                        <h1 className="text-lg font-bold text-primary">SynkHub</h1>
                    </Link>
                    <div className="h-6 w-[1px] bg-outline-variant"></div>
                    <div className="flex flex-col">
                        {editingTitle && user?.role === 'admin' ? (
                            <form onSubmit={(e) => { e.preventDefault(); handleTitleSave(); }} className="flex items-center gap-1">
                                <input
                                    type="text"
                                    value={titleValue}
                                    onChange={(e) => setTitleValue(e.target.value)}
                                    onBlur={handleTitleSave}
                                    onKeyDown={(e) => { if (e.key === 'Escape') { setEditingTitle(false); setTitleValue(board.title); } }}
                                    className="text-sm font-bold text-on-surface bg-surface-container rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-primary"
                                    autoFocus
                                />
                            </form>
                        ) : (
                            <span
                                className={`text-sm font-bold text-on-surface ${user?.role === 'admin' ? 'cursor-pointer hover:text-primary' : ''}`}
                                onClick={() => { if (user?.role === 'admin') { setTitleValue(board.title); setEditingTitle(true); } }}
                                title={user?.role === 'admin' ? 'Cliquer pour modifier le nom' : ''}
                            >
                                {board.title}
                            </span>
                        )}
                        <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Live Brainstorming</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2 mr-2">
                        {participants.slice(0, 5).map((p, i) => {
                            const isOnline = p.user_id === user?.id || connectedUsers.some(u => u.user_id === p.user_id);
                            return (
                                <div
                                    key={p.user_id}
                                    className="relative"
                                    style={{ zIndex: 10 - i }}
                                    title={`${p.username}${isOnline ? ' (online)' : ''}`}
                                >
                                    <Avatar avatar_url={p.avatar_url} username={p.username} size="w-8 h-8" />
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? 'bg-primary' : 'bg-gray-400'}`}></div>
                                </div>
                            );
                        })}
                        {participants.length > 5 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-container flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                                +{participants.length - 5}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setShowShareModal(true)}
                        className="bg-primary text-on-primary px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined">share</span>
                        Share
                    </button>

                    <button
                        onClick={() => setShowNotes(!showNotes)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${showNotes ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                        title="My Notes"
                    >
                        <span className="material-symbols-outlined">description</span>
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
                        >
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-error rounded-full text-[8px] text-white flex items-center justify-center font-bold">{notifications.length}</span>
                        )}
                    </div>
                </div>
            </header>

            {showNotifications && (
                <div className="fixed top-16 right-10 z-50 w-72 bg-white rounded-xl shadow-xl border border-outline-variant/30 overflow-hidden">
                    <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
                        <h3 className="font-bold text-sm">Notifications</h3>
                        <button onClick={() => setNotifications([])} className="text-xs text-primary hover:underline">Clear all</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length > 0 ? notifications.map(n => (
                            <div key={n.id} className="p-3 hover:bg-surface-container-low flex items-center gap-3 border-b border-outline-variant/10">
                                <span className="material-symbols-outlined text-primary text-lg">{n.icon}</span>
                                <div className="flex-1">
                                    <p className="text-sm">{n.text}</p>
                                    <p className="text-[10px] text-on-surface-variant">{n.time}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-on-surface-variant text-sm">No notifications</div>
                        )}
                    </div>
                </div>
            )}

            <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />

            <main
                ref={canvasRef}
                className={`w-full h-full overflow-hidden relative transition-all duration-300 ${showNotes ? 'mr-80' : ''}`}
                style={{
                    cursor: activeTool === 'postit' ? 'crosshair' : activeTool === 'pen' ? 'crosshair' : activeTool === 'shapes' ? 'crosshair' : activeTool === 'text' ? 'text' : 'default',
                }}
                onClick={handleCanvasClick}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
            >
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: isDark ? 'radial-gradient(#3a4a5c 1px, transparent 1px)' : 'radial-gradient(#ccc3d8 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                ></div>

                <div
                    ref={canvasInnerRef}
                    className="absolute inset-0 p-40"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
                >
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                        {shapes.map(shape => {
                            if (shape.type === 'pen') {
                                return <path key={shape.id} d={getPointsPath(shape.points)} stroke="#13a538" strokeWidth="2" fill="none" />;
                            } else if (shape.type === 'rect') {
                                return <rect key={shape.id} x={shape.x} y={shape.y} width={shape.width} height={shape.height} stroke="#13a538" strokeWidth="2" fill="none" rx="4" />;
                            }
                            return null;
                        })}
                        {drawingPoints.length > 1 && (
                            <path d={getPointsPath(drawingPoints)} stroke="#13a538" strokeWidth="2" fill="none" opacity="0.7" />
                        )}
                    </svg>

                    {textItems.map(item => (
                        <div
                            key={item.id}
                            className="absolute text-sm font-bold text-on-surface bg-white/80 px-2 py-1 rounded shadow-sm pointer-events-none"
                            style={{ left: `${item.x}px`, top: `${item.y}px`, zIndex: 1 }}
                        >
                            {item.content}
                        </div>
                    ))}

                    {postits.map((postit) => (
                        <Postit
                            key={postit.id}
                            postit={postit}
                            onDragEnd={handleDragEnd}
                            sendWsEvent={sendWsEvent}
                        />
                    ))}

                    {postits.length === 0 && !loading && shapes.length === 0 && textItems.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant/50 pointer-events-none">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-8xl mb-4 block">note_add</span>
                                <p className="text-xl font-medium mb-2">Click to add a sticky note</p>
                                <p className="text-sm">Select the sticky note tool and click on the canvas</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                    {Object.entries(remoteCursors).map(([uid, cursor]) => (
                        <UserCursor
                            key={uid}
                            x={cursor.x}
                            y={cursor.y}
                            username={cursor.username}
                            color={COLORS_LIST[uid.charCodeAt(0) % COLORS_LIST.length]}
                        />
                    ))}
                </div>
            </main>

            {showShareModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary">group</span>
                                </div>
                                <h3 className="text-lg font-bold text-on-surface">Share Board</h3>
                            </div>
                            <button onClick={() => setShowShareModal(false)} className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center">
                                <span className="material-symbols-outlined text-on-surface-variant">close</span>
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm font-medium text-on-surface mb-2">Participants ({participants.length})</p>
                            <div className="flex flex-wrap gap-2">
                                {participants.map((p, i) => (
                                    <div key={p.id} className="flex items-center gap-2 bg-surface-container-low rounded-full px-3 py-1.5">
                                        <div
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                            style={{ backgroundColor: getMemberColor(i) }}
                                        >
                                            {p.username?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <span className="text-xs font-medium text-on-surface">{p.username}</span>
                                        <span className="text-[10px] text-on-surface-variant">({p.role})</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-outline-variant/20 pt-4">
                            <p className="text-sm font-medium text-on-surface mb-2">Invite by email</p>
                            <p className="text-xs text-on-surface-variant mb-3">Send an invitation to join this board via Gmail</p>
                            <form onSubmit={handleInviteByEmail} className="flex gap-2">
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="email@company.com"
                                    className="flex-1 p-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-3 bg-primary text-on-primary rounded-xl hover:brightness-110 transition-all text-sm font-medium flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">send</span>
                                </button>
                            </form>
                            {inviteSent && (
                                <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                    Invitation sent!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showTextInput && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowTextInput(false)}>
                    <div className="bg-white rounded-xl p-4 shadow-xl" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleTextSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={textInputValue}
                                onChange={(e) => setTextInputValue(e.target.value)}
                                placeholder="Enter text..."
                                className="px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                autoFocus
                            />
                            <button type="submit" className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium">Add</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-outline-variant/30">
                <button onClick={handleZoomOut} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors" title="Zoom Out">
                    <span className="material-symbols-outlined">zoom_out</span>
                </button>
                <span className="text-sm font-bold text-on-surface-variant min-w-[40px] text-center">{zoom}%</span>
                <button onClick={handleZoomIn} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors" title="Zoom In">
                    <span className="material-symbols-outlined">zoom_in</span>
                </button>
                <div className="h-6 w-[1px] bg-outline-variant"></div>
                <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors disabled:opacity-30"
                    title="Undo"
                >
                    <span className="material-symbols-outlined">undo</span>
                </button>
                <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors disabled:opacity-30"
                    title="Redo"
                >
                    <span className="material-symbols-outlined">redo</span>
                </button>
            </div>

            <div className="fixed bottom-6 right-6 z-40 w-32 h-20 bg-white/80 backdrop-blur-sm rounded-lg border border-outline-variant/30 shadow-sm overflow-hidden p-1">
                <div className="w-full h-full bg-surface-container-low rounded relative overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-primary/50 bg-primary/10 rounded-sm"></div>
                    {postits.slice(0, 10).map((postit) => (
                        <div
                            key={postit.id}
                            className="absolute w-3 h-3 rounded-sm opacity-60"
                            style={{
                                backgroundColor: COLORS[postit.color] || COLORS.yellow,
                                top: `${Math.min(85, Math.max(5, (postit.y_pos / 2000) * 100))}%`,
                                left: `${Math.min(85, Math.max(5, (postit.x_pos / 3000) * 100))}%`,
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className="fixed bottom-6 left-6 z-40 bg-white/80 backdrop-blur-sm rounded-lg border border-outline-variant/30 shadow-sm px-4 py-2">
                <span className="text-xs font-medium text-on-surface-variant">{postits.length} post-it{postits.length !== 1 ? 's' : ''} · {participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
            </div>

            <NotesSidebar boardId={id} isOpen={showNotes} onClose={() => setShowNotes(false)} />
        </div>
    );
};

const Board = () => {
    return (
        <BoardProvider>
            <BoardContent />
        </BoardProvider>
    );
};

export default Board;
