import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import Invoice from '../Invoice';

// Mock lucide-react since it's used in Invoice
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="close-icon">X</span>
}));

describe('Invoice Component', () => {
  const mockData = {
    id: 123,
    date: '2023-10-27T10:00:00.000Z',
    customer: 'John Doe',
    items: [
      { name: 'Gaming Mouse', quantity: 1, price_sell: 5000 },
      { name: 'Keyboard', quantity: 2, price_sell: 3000 }
    ],
    total: 11000
  };

  it('renders nothing when data is null', () => {
    const { container } = render(<Invoice data={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders invoice details when data is provided', () => {
    render(<Invoice data={mockData} />);
    
    expect(screen.getByText(/INVOICE #123/i)).toBeInTheDocument();
    expect(screen.getByText(/Gaming Mouse/i)).toBeInTheDocument();
    // Use a flexible matcher for the total because formatting might vary by locale
    // We expect "11,000" or similar.
    expect(screen.getAllByText(/11,000/)[0]).toBeInTheDocument(); 
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<Invoice data={mockData} onClose={handleClose} />);
    
    const closeButton = screen.getByLabelText('Close Invoice');
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
