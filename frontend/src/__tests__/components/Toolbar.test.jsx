import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Toolbar from '../../components/Toolbar';
import { ThemeProvider } from '../../context/ThemeContext';

const renderWithRouter = (component) => {
    return render(
        <MemoryRouter>
            <ThemeProvider>
                {component}
            </ThemeProvider>
        </MemoryRouter>
    );
};

describe('Toolbar', () => {
    test('renders toolbar buttons', () => {
        renderWithRouter(<Toolbar activeTool="select" onToolChange={() => {}} />);
        expect(screen.getByText('near_me')).toBeInTheDocument();
        expect(screen.getByText('note_stack')).toBeInTheDocument();
        expect(screen.getByText('edit')).toBeInTheDocument();
        expect(screen.getByText('pentagon')).toBeInTheDocument();
        expect(screen.getByText('title')).toBeInTheDocument();
    });
});
