/**
 * GUIDE D'INTÉGRATION WEBSOCKET - Sprint 3
 * 
 * Exemple d'utilisation du WebSocket dans les composants React
 */

import { useWebSocket } from '../hooks/useWebSocket';
import { useEffect, useState } from 'react';

/**
 * Exemple 1: Synchroniser les mouvements de post-its
 */
export const usePostitSync = () => {
  const { emit, on, off } = useWebSocket();
  const [localPostits, setLocalPostits] = useState([]);

  // Écouter les mouvements d'autres utilisateurs
  useEffect(() => {
    on('postit:moved', (data) => {
      setLocalPostits(prev => 
        prev.map(p => 
          p.id === data.data.postit_id 
            ? { ...p, x: data.data.x, y: data.data.y, z_index: data.data.z_index }
            : p
        )
      );
    });

    return () => {
      off('postit:moved');
    };
  }, [on, off]);

  // Émettre quand l'utilisateur déplace un post-it
  const handleMovePostit = (postitId, x, y, zIndex) => {
    emit('postit:move', { 
      postit_id: postitId, 
      x, 
      y, 
      z_index: zIndex 
    });
  };

  return { handleMovePostit, localPostits, setLocalPostits };
};


/**
 * Exemple 2: Synchroniser les votes en temps réel
 */
export const useVoteSync = () => {
  const { emit, on, off } = useWebSocket();
  const [votes, setVotes] = useState({});

  useEffect(() => {
    on('vote:added', (data) => {
      setVotes(prev => ({
        ...prev,
        [data.data.postit_id]: data.data.vote_count
      }));
    });

    on('vote:removed', (data) => {
      setVotes(prev => ({
        ...prev,
        [data.data.postit_id]: data.data.vote_count
      }));
    });

    return () => {
      off('vote:added');
      off('vote:removed');
    };
  }, [on, off]);

  const handleToggleVote = (postitId, userId) => {
    emit('vote:toggle', {
      postit_id: postitId,
      user_id: userId
    });
  };

  return { handleToggleVote, votes };
};


/**
 * Exemple 3: Synchroniser les commentaires en temps réel
 */
export const useCommentSync = () => {
  const { emit, on, off } = useWebSocket();
  const [comments, setComments] = useState({});

  useEffect(() => {
    on('comment:added', (data) => {
      const postitId = data.data.postit_id;
      setComments(prev => ({
        ...prev,
        [postitId]: [
          ...(prev[postitId] || []),
          {
            id: data.data.comment_id,
            author_id: data.data.author_id,
            author_name: data.data.author_name,
            content: data.data.content,
            created_at: data.data.created_at
          }
        ]
      }));
    });

    return () => {
      off('comment:added');
    };
  }, [on, off]);

  const handleAddComment = (postitId, userId, content) => {
    emit('comment:add', {
      postit_id: postitId,
      user_id: userId,
      content
    });
  };

  return { handleAddComment, comments };
};


/**
 * Exemple 4: Obtenir le nombre d'utilisateurs connectés
 */
export const useConnectedUsers = () => {
  const { connectedUsers } = useWebSocket();
  return connectedUsers;
};


/**
 * EXEMPLE COMPLET dans un composant Board:
 * 
 * function BoardComponent() {
 *   const { emit, on, off, isConnected, connectedUsers } = useWebSocket();
 *   const [postits, setPostits] = useState([]);
 * 
 *   useEffect(() => {
 *     // Écouter les mouvements d'autres utilisateurs
 *     on('postit:moved', (data) => {
 *       setPostits(prev => prev.map(p =>
 *         p.id === data.data.postit_id
 *           ? { ...p, x: data.data.x, y: data.data.y }
 *           : p
 *       ));
 *     });
 * 
 *     // Écouter les votes
 *     on('vote:added', (data) => {
 *       setPostits(prev => prev.map(p =>
 *         p.id === data.data.postit_id
 *           ? { ...p, votes: data.data.vote_count }
 *           : p
 *       ));
 *     });
 * 
 *     // Écouter les commentaires
 *     on('comment:added', (data) => {
 *       setPostits(prev => prev.map(p =>
 *         p.id === data.data.postit_id
 *           ? { ...p, comments: [...(p.comments || []), data.data] }
 *           : p
 *       ));
 *     });
 * 
 *     return () => {
 *       off('postit:moved');
 *       off('vote:added');
 *       off('comment:added');
 *     };
 *   }, [on, off]);
 * 
 *   const handleMovePostit = (postitId, x, y) => {
 *     emit('postit:move', { postit_id: postitId, x, y });
 *   };
 * 
 *   return (
 *     <div>
 *       <p>Utilisateurs connectés: {connectedUsers}</p>
 *       <p>Statut: {isConnected ? 'Connecté' : 'Déconnecté'}</p>
 *       {/* Afficher les postits */}
 *     </div>
 *   );
 * }
 */
