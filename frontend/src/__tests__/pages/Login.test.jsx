import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/Login';
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

describe('Login Page', () => {
    test('renders login form', () => {
        renderWithRouter(<Login />);
        expect(screen.getByPlaceholderText('name@company.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    test('renders sign in button', () => {
        renderWithRouter(<Login />);
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    test('renders register link', () => {
        renderWithRouter(<Login />);
        expect(screen.getByText(/Create an account/i)).toBeInTheDocument();
    });

    test('renders SynkHub branding', () => {
        renderWithRouter(<Login />);
        expect(screen.getByText('SynkHub')).toBeInTheDocument();
    });

    test('renders subtitle', () => {
        renderWithRouter(<Login />);
        expect(screen.getByText(/Bring your team/i)).toBeInTheDocument();
    });

    test('renders social login buttons', () => {
        renderWithRouter(<Login />);
        expect(screen.getByText('Google')).toBeInTheDocument();
        expect(screen.getByText('GitHub')).toBeInTheDocument();
    });

    test('renders remember me checkbox', () => {
        renderWithRouter(<Login />);
        expect(screen.getByText('Remember me')).toBeInTheDocument();
    });
});
