import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { AuthProvider } from '../../context/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext';

const renderWithRouter = (component) => {
    return render(
        <MemoryRouter>
            <ThemeProvider>
                <AuthProvider>
                    {component}
                </AuthProvider>
            </ThemeProvider>
        </MemoryRouter>
    );
};

describe('Sidebar', () => {
    test('renders SynkHub title', () => {
        renderWithRouter(<Sidebar />);
        expect(screen.getByText('SynkHub')).toBeInTheDocument();
    });

    test('renders navigation links', () => {
        renderWithRouter(<Sidebar />);
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Boards')).toBeInTheDocument();
        expect(screen.getByText('Decision Hub')).toBeInTheDocument();
        expect(screen.getByText('Teams')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    test('renders logout button', () => {
        renderWithRouter(<Sidebar />);
        expect(screen.getByText('Logout')).toBeInTheDocument();
    });
});
