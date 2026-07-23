import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { teamAPI } from '../api/boards';
import { useAuth } from '../context/AuthContext';

const InviteAccept = () => {
    const { token } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [invitation, setInvitation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [accepting, setAccepting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadInvitation();
    }, [token]);

    const loadInvitation = async () => {
        try {
            const response = await teamAPI.getInvitation(token);
            setInvitation(response.data);
        } catch (error) {
            setError(error.response?.data?.detail || 'Invalid or expired invitation');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!user) {
            navigate(`/login?redirect=/invite/${token}`);
            return;
        }

        setAccepting(true);
        try {
            const response = await teamAPI.acceptInvitation(token);
            setSuccess(true);
            setTimeout(() => {
                navigate(`/dashboard`);
            }, 2000);
        } catch (error) {
            setError(error.response?.data?.detail || 'Error accepting invitation');
        } finally {
            setAccepting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl text-center">
                    <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-error text-3xl">error</span>
                    </div>
                    <h2 className="text-xl font-bold text-on-surface mb-2">Invitation Error</h2>
                    <p className="text-on-surface-variant mb-6">{error}</p>
                    <Link to="/login" className="px-6 py-3 bg-primary text-on-primary rounded-xl font-medium hover:brightness-110 transition-all inline-block">
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
                    </div>
                    <h2 className="text-xl font-bold text-on-surface mb-2">Welcome!</h2>
                    <p className="text-on-surface-variant mb-6">You've been added to <strong>{invitation?.workspace_name}</strong></p>
                    <p className="text-sm text-on-surface-variant">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-primary text-3xl">group_add</span>
                    </div>
                    <h2 className="text-xl font-bold text-on-surface mb-2">You're Invited!</h2>
                    <p className="text-on-surface-variant">
                        <strong>{invitation?.invited_by}</strong> invited you to join
                    </p>
                    <p className="text-lg font-bold text-primary mt-1">"{invitation?.workspace_name}"</p>
                </div>

                <div className="bg-surface-container-low rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-on-surface-variant">email</span>
                        <div>
                            <p className="text-sm font-medium text-on-surface">{invitation?.email}</p>
                            <p className="text-xs text-on-surface-variant">Role: {invitation?.role}</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full py-3 bg-primary text-on-primary rounded-xl font-medium hover:brightness-110 transition-all disabled:opacity-50"
                >
                    {accepting ? 'Accepting...' : user ? 'Accept Invitation' : 'Login to Accept'}
                </button>

                {!user && (
                    <p className="text-center text-sm text-on-surface-variant mt-4">
                        You need to login or create an account first
                    </p>
                )}
            </div>
        </div>
    );
};

export default InviteAccept;
