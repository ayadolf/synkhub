import { useState } from 'react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');

const Avatar = ({ avatar_url, username, size = 'w-10 h-10', className = '' }) => {
    const [imgError, setImgError] = useState(false);

    const getUrl = () => {
        if (!avatar_url) return null;
        if (avatar_url.startsWith('http')) return avatar_url;
        return `${API_URL}${avatar_url}`;
    };

    const url = getUrl();
    const initial = username?.charAt(0)?.toUpperCase() || '?';

    if (url && !imgError) {
        return (
            <img
                src={url}
                alt={username}
                className={`${size} rounded-xl object-cover border border-outline-variant/30 flex-shrink-0 ${className}`}
                onError={() => setImgError(true)}
            />
        );
    }

    return (
        <div className={`${size} rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container font-bold flex-shrink-0 ${className}`}>
            {initial}
        </div>
    );
};

export default Avatar;
