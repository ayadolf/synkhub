import { useState, useRef, useCallback, useEffect } from 'react';
import { useBoard } from '../context/BoardContext';
import { useAuth } from '../context/AuthContext';

const COLORS = {
    yellow: '#fef08a',
    pink: '#fbcfe8',
    blue: '#bfdbfe',
    green: '#bbf7d0',
    purple: '#e9d5ff',
    orange: '#fed7aa',
    ocp_green: '#b8e6c8',
    ocp_gold: '#fff3b0',
    ocp_dark: '#163E2C',
    ocp_light: '#aecc53',
    ocp_accent: '#e27954',
};

const Postit = ({ postit, onDragEnd, sendWsEvent }) => {
    const { updatePostit, deletePostit, votePostit, selectedPostit, setSelectedPostit, getComments, addComment, updateComment, deleteComment } = useBoard();
    const { user } = useAuth();
    const isOwner = user?.id === postit.author_id;
    const [isEditing, setIsEditing] = useState(!postit.content && isOwner);
    const [content, setContent] = useState(postit.content);
    const [isDragging, setIsDragging] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentContent, setEditingCommentContent] = useState('');
    const dragRef = useRef(null);
    const textareaRef = useRef(null);
    const commentInputRef = useRef(null);
    const saveTimeoutRef = useRef(null);
    const isSelected = selectedPostit?.id === postit.id;

    useEffect(() => {
        setContent(postit.content);
    }, [postit.content]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [isEditing]);

    useEffect(() => {
        if (showComments && postit.id) {
            loadComments();
        }
    }, [showComments, postit.id]);

    const loadComments = async () => {
        setLoadingComments(true);
        try {
            const data = await getComments(postit.id);
            setComments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erreur:', error);
            setComments([]);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const text = newComment.trim();
        if (!text) return;
        try {
            const comment = await addComment(postit.id, text);
            if (comment) {
                setComments(prev => [...prev, comment]);
                setNewComment('');
                if (sendWsEvent) {
                    sendWsEvent('comment:added', {
                        postit_id: postit.id,
                        comment: comment,
                        postit: { ...postit, comment_count: (postit.comment_count || 0) + 1 },
                        author_name: comment.author_name
                    });
                }
            }
        } catch (error) {
            console.error('Erreur commentaire:', error);
        }
    };

    const handleEditComment = async (commentId) => {
        const text = editingCommentContent.trim();
        if (!text) return;
        try {
            const updated = await updateComment(commentId, text);
            if (updated) {
                setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: updated.content } : c));
                setEditingCommentId(null);
                setEditingCommentContent('');
            }
        } catch (error) {
            console.error('Erreur modification commentaire:', error);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await deleteComment(commentId, postit.id);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (error) {
            console.error('Erreur suppression commentaire:', error);
        }
    };

    const handleContentChange = (e) => {
        const newContent = e.target.value;
        setContent(newContent);

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            if (newContent !== postit.content) {
                updatePostit(postit.id, { content: newContent }).then(updated => {
                    if (updated && sendWsEvent) {
                        sendWsEvent('postit:updated', updated);
                    }
                });
            }
        }, 800);
    };

    const handleMouseDown = useCallback((e) => {
        if (isEditing) return;
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

        e.preventDefault();
        e.stopPropagation();

        const rect = dragRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        setIsDragging(true);

        const handleMouseMove = (e) => {
            const canvasEl = dragRef.current.parentElement;
            if (!canvasEl) return;

            const canvasRect = canvasEl.getBoundingClientRect();
            const newX = (e.clientX - canvasRect.left - offsetX) / (canvasEl.parentElement?.style?.transform ? parseFloat(canvasEl.parentElement.style.transform.match(/scale\(([^)]+)\)/)?.[1] || 1) : 1);
            const newY = (e.clientY - canvasRect.top - offsetY) / (canvasEl.parentElement?.style?.transform ? parseFloat(canvasEl.parentElement.style.transform.match(/scale\(([^)]+)\)/)?.[1] || 1) : 1);

            if (dragRef.current) {
                dragRef.current.style.left = `${newX}px`;
                dragRef.current.style.top = `${newY}px`;
                dragRef.current.style.zIndex = '1000';
            }
        };

        const handleMouseUp = (e) => {
            setIsDragging(false);
            if (dragRef.current) {
                dragRef.current.style.zIndex = postit.z_index;
                const newX = parseFloat(dragRef.current.style.left);
                const newY = parseFloat(dragRef.current.style.top);
                if (onDragEnd) {
                    onDragEnd(postit.id, newX, newY);
                }
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [postit, isEditing, onDragEnd]);

    const handleBlur = () => {
        setIsEditing(false);
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        if (content !== postit.content) {
            updatePostit(postit.id, { content }).then(updated => {
                if (updated && sendWsEvent) {
                    sendWsEvent('postit:updated', updated);
                }
            });
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setIsEditing(false);
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            if (content !== postit.content) {
                updatePostit(postit.id, { content }).then(updated => {
                    if (updated && sendWsEvent) {
                        sendWsEvent('postit:updated', updated);
                    }
                });
            }
        }
    };

    const handleVote = (e) => {
        e.stopPropagation();
        votePostit(postit.id).then(updated => {
            if (updated && sendWsEvent) {
                sendWsEvent('vote:toggled', { ...updated, username: user.username });
            }
        });
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        deletePostit(postit.id).then(() => {
            if (sendWsEvent) {
                sendWsEvent('postit:deleted', { postit_id: postit.id });
            }
        });
    };

    const handleCommentClick = (e) => {
        e.stopPropagation();
        setShowComments(!showComments);
    };

    const color = COLORS[postit.color] || COLORS.yellow;
    const rotation = ((postit.x_pos + postit.y_pos) % 6) - 3;

    return (
        <div
            ref={dragRef}
            className="absolute flex flex-col shadow-sm rounded-sm cursor-grab active:cursor-grabbing select-none group"
            style={{
                left: `${postit.x_pos}px`,
                top: `${postit.y_pos}px`,
                width: `${postit.width}px`,
                height: showComments ? `${postit.height + 250}px` : `${postit.height}px`,
                backgroundColor: color,
                zIndex: isDragging ? 1000 : postit.z_index,
                transform: `rotate(${rotation}deg) ${isDragging ? 'scale(1.05)' : isSelected ? 'scale(1.02)' : ''}`,
                transition: isDragging ? 'box-shadow 0.2s ease' : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, height 0.2s ease',
                boxShadow: isDragging
                    ? '0px 20px 40px rgba(0,0,0,0.2)'
                    : isSelected
                    ? '0px 12px 24px rgba(19, 165, 56, 0.25)'
                    : '0px 4px 8px rgba(0,0,0,0.1)',
                border: isSelected ? '2px solid #13a538' : 'none',
            }}
            onMouseDown={handleMouseDown}
            onClick={(e) => { e.stopPropagation(); setSelectedPostit(postit); }}
            onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        >
            {/* Content Area */}
            <div className="p-3 flex-1 overflow-hidden">
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        className="bg-transparent border-none focus:ring-0 w-full h-full resize-none text-sm text-on-surface placeholder:text-black/30 outline-none"
                        value={content}
                        onChange={handleContentChange}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                ) : (
                    <p className="text-sm text-on-surface leading-relaxed cursor-text break-words">
                        {content || 'Double-cliquez pour editer...'}
                    </p>
                )}
            </div>

            {/* Action Bar */}
            <div className="p-3 pt-0 flex justify-between items-center">
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleVote}
                        className="flex items-center gap-1 px-2 py-1 hover:bg-black/5 rounded text-on-surface-variant transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: postit.user_has_voted ? "'FILL' 1" : "'FILL' 0" }}>
                            thumb_up
                        </span>
                        <span className="text-xs font-bold">{postit.vote_count || 0}</span>
                    </button>
                    <button
                        onClick={handleCommentClick}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${showComments ? 'bg-primary/20 text-primary' : 'hover:bg-black/5 text-on-surface-variant'}`}
                    >
                        <span className="material-symbols-outlined text-sm">chat_bubble</span>
                        <span className="text-xs font-bold">{postit.comment_count || 0}</span>
                    </button>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleDelete}
                        className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/10 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                    <div className="w-6 h-6 rounded-full bg-primary/30 border-2 border-white"></div>
                </div>
            </div>

            {/* Comment Panel */}
            {showComments && (
                <div
                    className="border-t border-black/10 bg-white/80 backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {/* Comments List */}
                    <div className="max-h-[150px] overflow-y-auto px-3 py-2 space-y-2">
                        {loadingComments ? (
                            <p className="text-xs text-on-surface-variant text-center py-2">Loading...</p>
                        ) : comments.length > 0 ? (
                            comments.map((c, idx) => (
                                <div key={c.id || idx} className="flex gap-2 group/comment">
                                    <div className="w-5 h-5 rounded-full bg-primary-container flex items-center justify-center text-[8px] font-bold text-on-primary-container flex-shrink-0 mt-0.5">
                                        {(c.author_name || c.author_id || '?').toString().charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-on-surface">{c.author_name || (c.author_id || 'User').toString().substring(0, 8)}</p>
                                        {editingCommentId === c.id ? (
                                            <form onSubmit={(e) => { e.preventDefault(); handleEditComment(c.id); }} className="flex items-center gap-1 mt-0.5">
                                                <input
                                                    type="text"
                                                    value={editingCommentContent}
                                                    onChange={(e) => setEditingCommentContent(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Escape') setEditingCommentId(null); }}
                                                    className="flex-1 text-xs bg-surface-container-low rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary"
                                                    autoFocus
                                                />
                                                <button type="submit" className="text-[10px] text-primary font-bold">OK</button>
                                            </form>
                                        ) : (
                                            <p className="text-xs text-on-surface-variant break-words">{c.content}</p>
                                        )}
                                    </div>
                                    {c.author_id === user?.id && editingCommentId !== c.id && (
                                        <div className="flex items-start gap-0.5 opacity-0 group-hover/comment:opacity-100 transition-opacity flex-shrink-0">
                                            <button
                                                onClick={() => { setEditingCommentId(c.id); setEditingCommentContent(c.content); }}
                                                className="w-4 h-4 rounded flex items-center justify-center hover:bg-black/5 text-on-surface-variant"
                                                title="Modifier"
                                            >
                                                <span className="material-symbols-outlined text-[10px]">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteComment(c.id)}
                                                className="w-4 h-4 rounded flex items-center justify-center hover:bg-error/10 text-error"
                                                title="Supprimer"
                                            >
                                                <span className="material-symbols-outlined text-[10px]">delete</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-on-surface-variant text-center py-2">No comments yet</p>
                        )}
                    </div>

                    {/* Add Comment Input */}
                    <form onSubmit={handleAddComment} className="flex items-center gap-2 px-3 py-2 border-t border-black/5">
                        <input
                            ref={commentInputRef}
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 bg-surface-container-low rounded-full px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary outline-none"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-xs">send</span>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export { COLORS };
export default Postit;
