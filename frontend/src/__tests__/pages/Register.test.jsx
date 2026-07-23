import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Register from '../../pages/Register';
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

describe('Register Page', () => {
    test('renders register form', () => {
        renderWithRouter(<Register />);
        expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('name@company.com')).toBeInTheDocument();
    });

    test('renders create account button', () => {
        renderWithRouter(<Register />);
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    test('renders login link', () => {
        renderWithRouter(<Register />);
        expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
    });

    test('renders SynkHub branding', () => {
        renderWithRouter(<Register />);
        expect(screen.getAllByText('SynkHub').length).toBeGreaterThanOrEqual(1);
    });

    test('renders subtitle', () => {
        renderWithRouter(<Register />);
        expect(screen.getByText(/Join the collective/i)).toBeInTheDocument();
    });

    test('renders social signup buttons', () => {
        renderWithRouter(<Register />);
        expect(screen.getByText('Google')).toBeInTheDocument();
        expect(screen.getByText('GitHub')).toBeInTheDocument();
    });

    test('renders terms checkbox', () => {
        renderWithRouter(<Register />);
        expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
        expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
    });
});
