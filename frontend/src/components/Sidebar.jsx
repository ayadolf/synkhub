import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { isDark } = useTheme();
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', icon: 'grid_view', label: 'Dashboard' },
        { path: '/boards', icon: 'layers', label: 'Boards' },
        { path: '/decision-hub', icon: 'how_to_vote', label: 'Decision Hub' },
        { path: '/teams', icon: 'group', label: 'Teams' },
    ];

    const bottomItems = [
        { path: '/settings', icon: 'settings', label: 'Settings' },
    ];

    const adminItems = [
        { path: '/rgpd', icon: 'shield', label: 'Registre RGPD' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <aside className={`fixed left-0 top-0 h-full flex flex-col p-6 z-40 border-r w-72 md:flex hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-outline-variant/30'}`}>
            <div className="flex items-center gap-4 mb-8 px-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined">dashboard</span>
                </div>
                <div>
                    <h1 className="text-lg font-bold text-primary">SynkHub</h1>
                    <p className="text-xs text-on-surface-variant">Workspace</p>
                </div>
            </div>

            <Link
                to="/dashboard"
                className="w-full bg-primary text-on-primary font-medium py-4 px-6 rounded-xl mb-8 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-primary/10"
            >
                <span className="material-symbols-outlined">add_circle</span>
                New Board
            </Link>

            <nav className="flex-1 space-y-2 px-2">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                            isActive(item.path)
                                ? 'text-primary bg-primary-container/10 font-bold border border-primary/10'
                                : 'text-on-surface-variant hover:bg-surface-container-low group'
                        }`}
                    >
                        <span className={`material-symbols-outlined ${!isActive(item.path) ? 'group-hover:text-primary transition-colors' : ''}`}>
                            {item.icon}
                        </span>
                        <span className="text-sm">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="mt-auto space-y-2 px-2 pt-6 border-t border-outline-variant/30">
                {user?.role === 'admin' && adminItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                            isActive(item.path)
                                ? 'text-primary bg-primary-container/10 font-bold'
                                : 'text-on-surface-variant hover:bg-surface-container-low group'
                        }`}
                    >
                        <span className={`material-symbols-outlined ${!isActive(item.path) ? 'group-hover:text-primary transition-colors' : ''}`}>
                            {item.icon}
                        </span>
                        <span className="text-sm">{item.label}</span>
                    </Link>
                ))}
                {bottomItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                            isActive(item.path)
                                ? 'text-primary bg-primary-container/10 font-bold'
                                : 'text-on-surface-variant hover:bg-surface-container-low group'
                        }`}
                    >
                        <span className={`material-symbols-outlined ${!isActive(item.path) ? 'group-hover:text-primary transition-colors' : ''}`}>
                            {item.icon}
                        </span>
                        <span className="text-sm">{item.label}</span>
                    </Link>
                ))}
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-4 p-4 text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-all group"
                >
                    <span className="material-symbols-outlined group-hover:text-primary transition-colors">logout</span>
                    <span className="text-sm">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
