import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OnlineProvider } from './context/OnlineContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Boards from './pages/Boards';
import Board from './pages/Board';
import DecisionHub from './pages/DecisionHub';
import Teams from './pages/Teams';
import Settings from './pages/Settings';
import RGPDAdmin from './pages/RGPDAdmin';
import InviteAccept from './pages/InviteAccept';

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    return user ? <Navigate to="/dashboard" /> : children;
};

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <ToastProvider>
                    <OnlineProvider>
                        <Router>
                            <Routes>
                                <Route path="/login" element={
                                    <PublicRoute>
                                        <Login />
                                    </PublicRoute>
                                } />
                                <Route path="/register" element={
                                    <PublicRoute>
                                        <Register />
                                    </PublicRoute>
                                } />
                                <Route path="/invite/:token" element={<InviteAccept />} />
                                <Route path="/dashboard" element={
                                    <PrivateRoute>
                                        <Dashboard />
                                    </PrivateRoute>
                                } />
                                <Route path="/boards" element={
                                    <PrivateRoute>
                                        <Boards />
                                    </PrivateRoute>
                                } />
                                <Route path="/boards/:id" element={
                                    <PrivateRoute>
                                        <Board />
                                    </PrivateRoute>
                                } />
                                <Route path="/decision-hub" element={
                                    <PrivateRoute>
                                        <DecisionHub />
                                    </PrivateRoute>
                                } />
                                <Route path="/teams" element={
                                    <PrivateRoute>
                                        <Teams />
                                    </PrivateRoute>
                                } />
                                <Route path="/settings" element={
                                    <PrivateRoute>
                                        <Settings />
                                    </PrivateRoute>
                                } />
                                <Route path="/rgpd" element={
                                    <PrivateRoute>
                                        <RGPDAdmin />
                                    </PrivateRoute>
                                } />
                                <Route path="/" element={<Navigate to="/login" />} />
                            </Routes>
                        </Router>
                    </OnlineProvider>
                </ToastProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
