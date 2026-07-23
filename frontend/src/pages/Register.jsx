import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        if (!termsAccepted) {
            setError('Vous devez accepter les conditions d\'utilisation');
            return;
        }

        setLoading(true);

        try {
            await register(email, password, username);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || "Erreur lors de l'inscription");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen">
            {/* Left Side: Creative Illustration / Branding */}
            <section className="hidden lg:flex lg:w-1/2 relative bg-mesh overflow-hidden flex-col justify-between p-8">
                {/* Branding */}
                <div className="z-10">
                    <h1 className="text-5xl text-primary-fixed-dim tracking-tight font-bold">SynkHub</h1>
                    <p className="text-xl text-on-primary-container max-w-md mt-2 opacity-90">
                        The infinite canvas for your collective intelligence.
                    </p>
                </div>

                {/* Abstract Collaborative Elements */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-full h-full max-w-lg aspect-square">
                        {/* Floating "Idea" Cards */}
                        <div className="animate-float absolute top-1/4 left-10 glass-panel p-4 rounded-xl shadow-2xl border border-white/20 w-48 rotate-[-6deg]">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-secondary"></div>
                                <span className="text-xs font-semibold text-on-surface-variant uppercase">Brainstorm</span>
                            </div>
                            <div className="h-2 w-full bg-surface-variant rounded-full mb-1"></div>
                            <div className="h-2 w-3/4 bg-surface-variant rounded-full opacity-60"></div>
                        </div>

                        <div className="animate-float absolute bottom-1/3 right-10 glass-panel p-4 rounded-xl shadow-2xl border border-white/20 w-56 rotate-[4deg]" style={{ animationDelay: '-2s' }}>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                <span className="text-xs font-semibold text-on-surface-variant uppercase">Collaborate</span>
                            </div>
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-secondary-fixed"></div>
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-tertiary-fixed-dim"></div>
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-fixed-dim flex items-center justify-center text-[10px] font-bold">+4</div>
                            </div>
                        </div>

                        {/* Center Ornament */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[100px] rounded-full"></div>
                    </div>
                </div>

               
            </section>

            {/* Right Side: Signup Form */}
            <section className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8 bg-surface">
                <div className="w-full max-w-md">
                    {/* Mobile Header */}
                    <div className="lg:hidden mb-8">
                        <h1 className="text-2xl text-primary tracking-tight font-bold">SynkHub</h1>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-semibold text-on-surface mb-1">Join the collective.</h2>
                        <p className="text-base text-on-surface-variant">Create your account and start brainstorming today.</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-error-container border border-error/20 text-error px-4 py-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Registration Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-2" htmlFor="username">Full Name</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">person</span>
                                <input
                                    className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-outline-variant ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-surface-container-lowest border-outline-variant'}`}
                                    id="username"
                                    name="username"
                                    placeholder="Enter your name"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-2" htmlFor="email">Work Email</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">mail</span>
                                <input
                                    className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-outline-variant ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-surface-container-lowest border-outline-variant'}`}
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

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-2" htmlFor="password">Password</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
                                <input
                                    className={`w-full pl-11 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-outline-variant ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-surface-container-lowest border-outline-variant'}`}
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
                            <p className="text-[10px] text-on-surface-variant mt-1 ml-1">Must be at least 6 characters.</p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-2" htmlFor="confirmPassword">Confirm Password</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
                                <input
                                    className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-outline-variant ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-surface-container-lowest border-outline-variant'}`}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    placeholder="••••••••"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="flex items-start gap-2">
                            <input
                                className="mt-1 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                                id="terms"
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                            />
                            <label className="text-sm text-on-surface-variant" htmlFor="terms">
                                I agree to the <a className="text-primary hover:underline" href="#">Terms of Service</a> and <a className="text-primary hover:underline" href="#">Privacy Policy</a>.
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            className="w-full py-4 bg-primary text-on-primary text-sm font-medium rounded-lg shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Création en cours...' : 'Create Account'}
                            {!loading && (
                                <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative flex items-center py-4">
                        <div className="flex-grow border-t border-outline-variant"></div>
                        <span className="flex-shrink mx-4 text-xs text-outline uppercase tracking-widest">or sign up with</span>
                        <div className="flex-grow border-t border-outline-variant"></div>
                    </div>

                    {/* Social Signup */}
                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-2 py-2 px-4 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors text-sm text-on-surface-variant">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Google
                        </button>
                        <button className="flex items-center justify-center gap-2 py-2 px-4 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors text-sm text-on-surface-variant">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                            </svg>
                            GitHub
                        </button>
                    </div>

                    {/* Footer Switch */}
                    <div className="mt-8 text-center">
                        <p className="text-base text-on-surface-variant">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary font-bold hover:underline transition-all">Sign In</Link>
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Register;
