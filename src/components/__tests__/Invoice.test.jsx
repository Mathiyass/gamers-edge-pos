import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import React from 'react';
import Invoice from '../Invoice';

// Mock lucide-react since it's used in Invoice
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="close-icon">X</span>
}));

describe('Invoice Component', () => {
  // Setup window.api mock
  beforeAll(() => {
    window.api = {
      getSettings: vi.fn().mockResolvedValue({
        storeName: 'Test Store',
        address: 'Test Address',
        phone: '1234567890',
        email: 'test@example.com',
        footerText: 'Test Footer'
      })
    };
    window.print = vi.fn();
  });

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

  it('renders invoice details when data is provided', async () => {
    render(<Invoice data={mockData} />);
    
    // Check for Invoice text (multiple occurrences is fine)
    expect(screen.getAllByText(/Invoice/i).length).toBeGreaterThan(0);

    expect(screen.getByText(/#123/i)).toBeInTheDocument();
    expect(screen.getByText(/Gaming Mouse/i)).toBeInTheDocument();

    // Check if store settings are applied (async)
    await waitFor(() => {
        expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/11,000/)[0]).toBeInTheDocument(); 
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    render(<Invoice data={mockData} onClose={handleClose} />);
    
    const closeButton = screen.getByLabelText('Close Invoice');
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
