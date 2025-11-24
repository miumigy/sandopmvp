import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InputTable from '../components/InputTable';

describe('InputTable', () => {
    const mockData = [
        { month: 1, quantity: 100, price: 10 },
        { month: 2, quantity: 120, price: 10 },
    ];

    const mockColumns = [
        { key: 'month', label: 'Month', readOnly: true },
        { key: 'quantity', label: 'Quantity' },
        { key: 'price', label: 'Price' },
    ];

    const mockOnChange = jest.fn();

    it('renders table with data', () => {
        render(<InputTable data={mockData} columns={mockColumns} onChange={mockOnChange} />);
        expect(screen.getByDisplayValue('100')).toBeInTheDocument();
        expect(screen.getByDisplayValue('120')).toBeInTheDocument();
    });

    it('calls onChange when input changes', () => {
        render(<InputTable data={mockData} columns={mockColumns} onChange={mockOnChange} />);
        const input = screen.getByDisplayValue('100');
        fireEvent.change(input, { target: { value: '150' } });

        // Check if onChange was called with updated data
        expect(mockOnChange).toHaveBeenCalled();
        const updatedData = mockOnChange.mock.calls[0][0];
        expect(updatedData[0].quantity).toBe(150);
    });
});
