import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

const OnlineContext = createContext(null);

export const OnlineProvider = ({ children }) => {
    const { user } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState([]);
    const wsRef = useRef(null);
    const reconnectRef = useRef(null);

    const connectGlobal = useCallback(() => {
        if (!user) return;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

        const wsBase = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8000`;
        const token = localStorage.getItem('token');
        const ws = new WebSocket(`${wsBase}/ws/global?token=${token}&user_id=${user.id}&username=${encodeURIComponent(user.username)}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'users:list') {
                setOnlineUsers(msg.data.users || []);
            } else if (msg.type === 'user:online') {
                setOnlineUsers(prev => {
                    if (prev.find(u => u.user_id === msg.data.user_id)) return prev;
                    return [...prev, { user_id: msg.data.user_id, username: msg.data.username }];
                });
            } else if (msg.type === 'user:offline') {
                setOnlineUsers(prev => prev.filter(u => u.user_id !== msg.data.user_id));
            }
        };

        ws.onclose = () => {
            reconnectRef.current = setTimeout(connectGlobal, 3000);
        };

        ws.onerror = () => {};

        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);

        ws._pingInterval = pingInterval;
    }, [user]);

    useEffect(() => {
        connectGlobal();
        return () => {
            if (wsRef.current) {
                if (wsRef.current._pingInterval) clearInterval(wsRef.current._pingInterval);
                wsRef.current.close();
            }
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
        };
    }, [connectGlobal]);

    const isOnline = useCallback((userId) => {
        return onlineUsers.some(u => u.user_id === userId);
    }, [onlineUsers]);

    return (
        <OnlineContext.Provider value={{ onlineUsers, isOnline }}>
            {children}
        </OnlineContext.Provider>
    );
};

export const useOnline = () => useContext(OnlineContext);
