import { createContext, useState, useContext, useCallback } from 'react';
import { postitAPI } from '../api/boards';

const BoardContext = createContext(null);

export const BoardProvider = ({ children }) => {
    const [postits, setPostits] = useState([]);
    const [selectedPostit, setSelectedPostit] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadPostits = useCallback(async (boardId) => {
        setLoading(true);
        try {
            const response = await postitAPI.getAll(boardId);
            setPostits(response.data);
        } catch (error) {
            console.error('Erreur chargement post-its:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const addPostit = useCallback(async (boardId, data) => {
        try {
            const response = await postitAPI.create(boardId, data);
            setPostits(prev => [...prev, response.data]);
            return response.data;
        } catch (error) {
            console.error('Erreur création post-it:', error);
            throw error;
        }
    }, []);

    const updatePostit = useCallback(async (id, data) => {
        try {
            const response = await postitAPI.update(id, data);
            setPostits(prev => prev.map(p => p.id === id ? response.data : p));
            return response.data;
        } catch (error) {
            console.error('Erreur mise à jour post-it:', error);
            throw error;
        }
    }, []);

    const movePostit = useCallback(async (id, x_pos, y_pos) => {
        try {
            const response = await postitAPI.move(id, { x_pos, y_pos });
            setPostits(prev => prev.map(p => p.id === id ? response.data : p));
        } catch (error) {
            console.error('Erreur déplacement post-it:', error);
        }
    }, []);

    const deletePostit = useCallback(async (id) => {
        try {
            await postitAPI.delete(id);
            setPostits(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error('Erreur suppression post-it:', error);
        }
    }, []);

    const votePostit = useCallback(async (id) => {
        try {
            const response = await postitAPI.vote(id);
            setPostits(prev => prev.map(p => p.id === id ? response.data : p));
            return response.data;
        } catch (error) {
            console.error('Erreur vote:', error);
        }
    }, []);

    const getComments = useCallback(async (postitId) => {
        try {
            const response = await postitAPI.getComments(postitId);
            return response.data;
        } catch (error) {
            console.error('Erreur chargement commentaires:', error);
            return [];
        }
    }, []);

    const addComment = useCallback(async (postitId, content) => {
        try {
            const response = await postitAPI.addComment(postitId, { content });
            setPostits(prev => prev.map(p =>
                p.id === postitId ? { ...p, comment_count: p.comment_count + 1 } : p
            ));
            return response.data;
        } catch (error) {
            console.error('Erreur ajout commentaire:', error);
            throw error;
        }
    }, []);

    const updateComment = useCallback(async (commentId, content) => {
        try {
            const response = await postitAPI.updateComment(commentId, { content });
            return response.data;
        } catch (error) {
            console.error('Erreur modification commentaire:', error);
            throw error;
        }
    }, []);

    const deleteComment = useCallback(async (commentId, postitId) => {
        try {
            await postitAPI.deleteComment(commentId);
            setPostits(prev => prev.map(p =>
                p.id === postitId ? { ...p, comment_count: Math.max(0, (p.comment_count || 1) - 1) } : p
            ));
        } catch (error) {
            console.error('Erreur suppression commentaire:', error);
            throw error;
        }
    }, []);

    return (
        <BoardContext.Provider value={{
            postits,
            setPostits,
            selectedPostit,
            setSelectedPostit,
            loading,
            loadPostits,
            addPostit,
            updatePostit,
            movePostit,
            deletePostit,
            votePostit,
            getComments,
            addComment,
            updateComment,
            deleteComment,
        }}>
            {children}
        </BoardContext.Provider>
    );
};

export const useBoard = () => {
    const context = useContext(BoardContext);
    if (!context) {
        throw new Error('useBoard must be used within a BoardProvider');
    }
    return context;
};
