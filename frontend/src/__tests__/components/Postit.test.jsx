import { render, screen } from '@testing-library/react';
import { COLORS } from '../../components/Postit';

describe('Postit', () => {
    test('COLORS object has all expected colors', () => {
        expect(COLORS.yellow).toBeDefined();
        expect(COLORS.pink).toBeDefined();
        expect(COLORS.blue).toBeDefined();
        expect(COLORS.green).toBeDefined();
        expect(COLORS.purple).toBeDefined();
        expect(COLORS.orange).toBeDefined();
    });

    test('COLORS has correct hex values', () => {
        expect(COLORS.yellow).toBe('#fef08a');
        expect(COLORS.pink).toBe('#fbcfe8');
        expect(COLORS.blue).toBe('#bfdbfe');
        expect(COLORS.green).toBe('#bbf7d0');
        expect(COLORS.purple).toBe('#e9d5ff');
        expect(COLORS.orange).toBe('#fed7aa');
    });
});
