import { render, screen } from '@testing-library/react';
import { TranscriptView } from '../TranscriptView';
import { TranscriptEntry } from '../../types';
import { vi, describe, it, expect } from 'vitest';

// Mock Recat Virtuoso
vi.mock('react-virtuoso', () => ({
    Virtuoso: ({ data, itemContent }: any) => {
        return (
            <div data-testid="virtuoso-list">
                {data.map((item: any, index: number) => (
                    <div key={item.id}>{itemContent(index, item)}</div>
                ))}
            </div>
        );
    },
}));

describe('TranscriptView', () => {
    it('renders waiting state when empty', () => {
        render(<TranscriptView entries={[]} />);
        expect(screen.getByText(/Waiting for conversation/i)).toBeInTheDocument();
    });

    it('renders messages using Virtuoso', () => {
        const entries: TranscriptEntry[] = [
            {
                id: '1',
                timestamp: new Date(),
                speaker: 'user',
                text: 'Hello world',
                isFinal: true
            },
            {
                id: '2',
                timestamp: new Date(),
                speaker: 'speaker',
                text: 'Hi there',
                isFinal: true
            }
        ];

        render(<TranscriptView entries={entries} />);

        expect(screen.getByText('Hello world')).toBeInTheDocument();
        expect(screen.getByText('Hi there')).toBeInTheDocument();
        expect(screen.getByText('You')).toBeInTheDocument();
        expect(screen.getByText('Partner')).toBeInTheDocument();
    });
});
