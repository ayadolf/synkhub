import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

/**
 * EXEMPLE D'UTILISATION DU WEBSOCKET DANS UN COMPOSANT
 * 
 * Ce fichier montre comment:
 * 1. Utiliser le hook useWebSocket
 * 2. Écouter les événements du serveur
 * 3. Envoyer des événements au serveur
 */

const WebSocketExample = ({ postitId, boardId, userId }) => {
  const { emit, on, isConnected, connectedUsers } = useWebSocket();
  const [notification, setNotification] = useState('');

  useEffect(() => {
    if (!isConnected) {
      console.log('Attente de connexion WebSocket...');
      return;
    }

    console.log('✓ Connecté au board:', boardId);

    // === EXEMPLE 1: Écouter les mouvements de post-it ===
    const unsubscribeMove = on('postit:move', (message) => {
      console.log('Post-it déplacé:', message.data);
      // Mettre à jour la position du post-it dans l'UI
      // ex: setPostitPosition({ x: message.data.x, y: message.data.y })
    });

    // === EXEMPLE 2: Écouter les votes ===
    const unsubscribeVote = on('vote:toggle', (message) => {
      console.log('Vote reçu:', message.data);
      setNotification(`${message.user_id} a voté!`);
    });

    // === EXEMPLE 3: Écouter les utilisateurs qui rejoignent ===
    const unsubscribeJoin = on('user:joined', (message) => {
      console.log(`Utilisateur connecté. Total: ${message.data.connected_count}`);
      setNotification(`${message.data.connected_count} utilisateur(s) connecté(s)`);
    });

    // === EXEMPLE 4: Écouter les utilisateurs qui partent ===
    const unsubscribeLeave = on('user:left', (message) => {
      console.log(`Utilisateur déconnecté. Total: ${message.data.connected_count}`);
    });

    // Nettoyage: se désabonner à la fermeture du composant
    return () => {
      unsubscribeMove?.();
      unsubscribeVote?.();
      unsubscribeJoin?.();
      unsubscribeLeave?.();
    };
  }, [isConnected, on]);

  // === ENVOYER DES ÉVÉNEMENTS ===

  const handleMovePostit = (x, y) => {
    emit('postit:move', {
      postit_id: postitId,
      x: x,
      y: y,
    });
  };

  const handleResizePostit = (width, height) => {
    emit('postit:resize', {
      postit_id: postitId,
      width: width,
      height: height,
    });
  };

  const handleUpdatePostit = (content, color) => {
    emit('postit:update', {
      postit_id: postitId,
      content: content,
      color: color,
    });
  };

  const handleVotePostit = () => {
    emit('vote:toggle', {
      postit_id: postitId,
      user_id: userId,
    });
  };

  const handleAddComment = (commentText) => {
    emit('comment:add', {
      postit_id: postitId,
      user_id: userId,
      content: commentText,
    });
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <h3>État WebSocket</h3>
      <p>
        Connecté: <strong>{isConnected ? '✓ OUI' : '❌ NON'}</strong>
      </p>
      <p>
        Utilisateurs connectés: <strong>{connectedUsers}</strong>
      </p>
      {notification && <p style={{ color: '#27ae60' }}>📢 {notification}</p>}

      <h4>Exemples d'actions</h4>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => handleMovePostit(100, 200)}>
          Déplacer post-it
        </button>
        <button onClick={() => handleResizePostit(300, 200)}>
          Redimensionner
        </button>
        <button onClick={() => handleUpdatePostit('Nouveau contenu', '#ff6b6b')}>
          Mettre à jour
        </button>
        <button onClick={handleVotePostit}>
          Voter
        </button>
        <button onClick={() => handleAddComment('Super idée!')}>
          Ajouter commentaire
        </button>
      </div>
    </div>
  );
};

export default WebSocketExample;


// ============================================
// GUIDE D'INTÉGRATION DANS BOARD.JSX
// ============================================

/**
 * 1. Importer le WebSocketProvider:
 * 
 *    import { WebSocketProvider } from '../context/WebSocketContext';
 * 
 * 2. Envelopper le board avec le provider:
 * 
 *    <WebSocketProvider boardId={boardId} userId={userId}>
 *      <YourBoardContent />
 *    </WebSocketProvider>
 * 
 * 3. Dans vos composants enfants, utiliser le hook:
 * 
 *    import { useWebSocket } from '../hooks/useWebSocket';
 *    
 *    const { emit, on, isConnected } = useWebSocket();
 *    
 *    // Écouter les événements
 *    useEffect(() => {
 *      const unsubscribe = on('postit:move', (message) => {
 *        console.log('Mouvement reçu:', message);
 *      });
 *      return unsubscribe;
 *    }, []);
 *    
 *    // Envoyer des événements
 *    const handleDrag = (x, y) => {
 *      emit('postit:move', { postit_id, x, y });
 *    };
 */
