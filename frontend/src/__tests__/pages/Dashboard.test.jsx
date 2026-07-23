import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Dashboard from '../../pages/Dashboard';
import { AuthProvider } from '../../context/AuthContext';
import { OnlineProvider } from '../../context/OnlineContext';
import { ThemeProvider } from '../../context/ThemeContext';

vi.mock('../../api/boards', () => ({
    workspaceAPI: { getAll: vi.fn().mockResolvedValue({ data: [] }) },
    boardAPI: { getAll: vi.fn().mockResolvedValue({ data: [] }) },
    postitAPI: { getAll: vi.fn().mockResolvedValue({ data: [] }) },
}));

const renderWithProviders = (component) => {
    return render(
        <MemoryRouter>
            <ThemeProvider>
                <AuthProvider>
                    <OnlineProvider>
                        {component}
                    </OnlineProvider>
                </AuthProvider>
            </ThemeProvider>
        </MemoryRouter>
    );
};

describe('Dashboard Page', () => {
    test('renders SynkHub branding', async () => {
        renderWithProviders(<Dashboard />);
        await waitFor(() => {
            expect(screen.getByText('SynkHub')).toBeInTheDocument();
        });
    });

    test('renders Dashboard navigation', async () => {
        renderWithProviders(<Dashboard />);
        await waitFor(() => {
            expect(screen.getByText('Dashboard')).toBeInTheDocument();
        });
    });

    test('renders Boards navigation', async () => {
        renderWithProviders(<Dashboard />);
        await waitFor(() => {
            expect(screen.getByText('Boards')).toBeInTheDocument();
        });
    });

    test('renders Decision Hub navigation', async () => {
        renderWithProviders(<Dashboard />);
        await waitFor(() => {
            expect(screen.getByText('Decision Hub')).toBeInTheDocument();
        });
    });

    test('renders Teams navigation', async () => {
        renderWithProviders(<Dashboard />);
        await waitFor(() => {
            expect(screen.getByText('Teams')).toBeInTheDocument();
        });
    });

    test('renders Settings navigation', async () => {
        renderWithProviders(<Dashboard />);
        await waitFor(() => {
            expect(screen.getByText('Settings')).toBeInTheDocument();
        });
    });

    test('renders search input', async () => {
        renderWithProviders(<Dashboard />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Search boards/i)).toBeInTheDocument();
        });
    });

    test('renders stats cards', async () => {
        renderWithProviders(<Dashboard />);
        await waitFor(() => {
            expect(screen.getByText('Total Boards')).toBeInTheDocument();
        });
    });

    test('renders New Board button', async () => {
        renderWithProviders(<Dashboard />);
        await waitFor(() => {
            expect(screen.getByText('New Board')).toBeInTheDocument();
        });
    });

    test('renders Workspaces section', async () => {
        renderWithProviders(<Dashboard />);
        await waitFor(() => {
            expect(screen.getAllByText('Workspaces').length).toBeGreaterThanOrEqual(1);
        });
    });
});
