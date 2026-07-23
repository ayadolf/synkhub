import React, { createContext, useEffect, useRef, useState, useCallback } from 'react';

export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children, boardId, userId, token }) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const listenersRef = useRef({});

  useEffect(() => {
    if (!boardId || !userId) return;

    // Créer la connexion WebSocket native
    const wsBase = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8000`;
    const token = localStorage.getItem('token');
    const wsUrl = `${wsBase}/ws/${boardId}?token=${token}&user_id=${userId}`;
    
    try {
      const socket = new WebSocket(wsUrl);

      // Événement: connexion établie
      socket.onopen = () => {
        console.log('✓ WebSocket connecté au board:', boardId);
        setIsConnected(true);
      };

      // Événement: réception de données
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const eventType = message.type;

          // Mettre à jour le nombre d'utilisateurs connectés
          if (eventType === 'user:joined' || eventType === 'user:left') {
            setConnectedUsers(message.data.connected_count);
          }

          // Appeler les callbacks abonnés à cet événement
          if (listenersRef.current[eventType]) {
            listenersRef.current[eventType].forEach(callback => {
              callback(message);
            });
          }
        } catch (err) {
          console.error('Erreur parse message WebSocket:', err);
        }
      };

      // Événement: erreur
      socket.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
        setIsConnected(false);
      };

      // Événement: déconnexion
      socket.onclose = () => {
        console.log('❌ WebSocket déconnecté');
        setIsConnected(false);
      };

      socketRef.current = socket;

      const pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);

      return () => {
        clearInterval(pingInterval);
        if (socketRef.current) {
          socketRef.current.close();
        }
      };
    } catch (err) {
      console.error('Erreur création WebSocket:', err);
      setIsConnected(false);
    }
  }, [boardId, userId]);

  // Émettre un événement vers le serveur
  const emit = useCallback((event, data) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: event,
        data: data,
        timestamp: new Date().toISOString(),
      };
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket non connecté, impossible d\'envoyer:', event);
    }
  }, []);

  // S'abonner à un événement
  const on = useCallback((event, callback) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }
    listenersRef.current[event].push(callback);

    // Retourner une fonction pour se désabonner
    return () => {
      const index = listenersRef.current[event].indexOf(callback);
      if (index > -1) {
        listenersRef.current[event].splice(index, 1);
      }
    };
  }, []);

  // Se désabonner d'un événement
  const off = useCallback((event) => {
    if (listenersRef.current[event]) {
      delete listenersRef.current[event];
    }
  }, []);

  const value = {
    emit,
    on,
    off,
    isConnected,
    connectedUsers,
    socket: socketRef.current,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

