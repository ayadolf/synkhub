import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Erreur lors de la connexion');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col md:flex-row overflow-hidden">
            {/* Left Side: Visual/Brand */}
            <section className="relative w-full md:w-1/2 lg:w-[55%] h-[300px] md:h-auto flex flex-col justify-center items-center overflow-hidden bg-primary animate-gradient bg-gradient-to-br from-primary via-secondary to-tertiary px-8">
                {/* Background Decorative Elements */}
                <div className="absolute inset-0 pointer-events-none opacity-30">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-white/20 rounded-full blur-[80px]"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/30 rounded-full blur-[100px]"></div>
                </div>

                {/* Brand Identity */}
                <div className="relative z-10 text-center max-w-lg space-y-4">
                    <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-white text-6xl leading-none">hub</span>
                        <h1 className="font-display text-4xl md:text-5xl text-white tracking-tight font-bold">SynkHub</h1>
                    </div>
                    <p className="text-lg md:text-xl text-white/90 font-medium">
                        Bring your team's ideas to life.
                    </p>

                    {/* Decorative Card */}
                    <div className="mt-8 hidden md:block">
                        <div className="p-4 glass-panel rounded-xl shadow-xl transform rotate-1 transition-transform hover:rotate-0 duration-500">
                            <div className="rounded-lg w-full h-[200px] bg-gradient-to-br from-purple-400/30 to-blue-400/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white/60 text-6xl">lightbulb</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Right Side: Login Form */}
            <section className={`w-full md:w-1/2 lg:w-[45%] flex items-center justify-center p-6 md:p-8 lg:p-12 ${isDark ? 'bg-gray-900' : 'bg-surface-container-lowest'}`}>
                <div className="w-full max-w-md space-y-8">
                    {/* Header */}
                    <div className="space-y-2">
                        <h2 className={`text-3xl font-semibold ${isDark ? 'text-white' : 'text-on-surface'}`}>Welcome back</h2>
                        <p className={`text-base ${isDark ? 'text-gray-400' : 'text-on-surface-variant'}`}>Please enter your details to sign in.</p>
                    </div>

                    {/* Social Logins */}
                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-2 py-2 px-4 border border-outline-variant rounded-lg text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors duration-200">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span>Google</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 py-2 px-4 border border-outline-variant rounded-lg text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors duration-200">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <span>GitHub</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative flex items-center">
                        <div className="flex-grow border-t border-outline-variant"></div>
                        <span className="flex-shrink mx-4 text-xs text-on-surface-variant uppercase tracking-widest">Or sign in with</span>
                        <div className="flex-grow border-t border-outline-variant"></div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-error-container border border-error/20 text-error px-4 py-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div className="space-y-1">
                            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-on-surface'}`} htmlFor="email">Email address</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">mail</span>
                                <input
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg text-base placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-surface-container-lowest border-outline-variant text-on-surface'}`}
                                    id="email"
                                    name="email"
                                    placeholder="name@company.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1">
                            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-on-surface'}`} htmlFor="password">Password</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                                <input
                                    className={`w-full pl-10 pr-10 py-3 border rounded-lg text-base placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-surface-container-lowest border-outline-variant text-on-surface'}`}
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Options Row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <input
                                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                                    id="remember"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <label className={`text-sm cursor-pointer ${isDark ? 'text-gray-400' : 'text-on-surface-variant'}`} htmlFor="remember">Remember me</label>
                            </div>
                            <a className="text-sm text-primary hover:underline transition-all" href="#">Forgot password?</a>
                        </div>

                        {/* Submit Button */}
                        <button
                            className="w-full py-4 bg-primary text-white text-sm font-medium rounded-lg shadow-md hover:bg-primary-container hover:shadow-lg active:scale-[0.98] transition-all duration-200"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Connexion en cours...' : 'Sign in to SynkHub'}
                        </button>
                    </form>

                    {/* Footer Link */}
                    <p className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-on-surface-variant'}`}>
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary font-bold hover:underline transition-all">Create an account</Link>
                    </p>
                </div>
            </section>
        </main>
    );
};

export default Login;
