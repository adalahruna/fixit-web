import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteConfirmation from '../DeleteConfirmation';

describe('DeleteConfirmation Component', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    itemName: 'Test Item',
    itemType: 'Test Type',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <DeleteConfirmation {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(<DeleteConfirmation {...defaultProps} />);
      expect(screen.getByText(/Hapus Test Type\?/i)).toBeInTheDocument();
    });

    it('should display item name in confirmation message', () => {
      render(<DeleteConfirmation {...defaultProps} />);
      expect(screen.getByText(/Test Item/i)).toBeInTheDocument();
    });

    it('should display custom title when provided', () => {
      render(<DeleteConfirmation {...defaultProps} title="Custom Title" />);
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should display custom message when provided', () => {
      const customMessage = 'Are you absolutely sure?';
      render(<DeleteConfirmation {...defaultProps} message={customMessage} />);
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should render confirm and cancel buttons', () => {
      render(<DeleteConfirmation {...defaultProps} />);
      expect(screen.getByText('Hapus')).toBeInTheDocument();
      expect(screen.getByText('Batal')).toBeInTheDocument();
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onClose when cancel button is clicked', () => {
      render(<DeleteConfirmation {...defaultProps} />);
      const cancelButton = screen.getByText('Batal');
      fireEvent.click(cancelButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onConfirm when cancel is clicked', () => {
      render(<DeleteConfirmation {...defaultProps} />);
      const cancelButton = screen.getByText('Batal');
      fireEvent.click(cancelButton);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should clear error state when cancel is clicked', async () => {
      mockOnConfirm.mockResolvedValue({ error: 'Test error' });
      render(<DeleteConfirmation {...defaultProps} />);
      
      // Trigger error
      const confirmButton = screen.getByText('Hapus');
      fireEvent.click(confirmButton);
      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Cancel should close dialog
      const cancelButton = screen.getByText('Batal');
      fireEvent.click(cancelButton);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Confirm Functionality', () => {
    it('should call onConfirm when confirm button is clicked', async () => {
      mockOnConfirm.mockResolvedValue({ success: true });
      render(<DeleteConfirmation {...defaultProps} />);
      
      const confirmButton = screen.getByText('Hapus');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      });
    });

    it('should show loading state during deletion', async () => {
      mockOnConfirm.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
      render(<DeleteConfirmation {...defaultProps} />);
      
      const confirmButton = screen.getByText('Hapus');
      fireEvent.click(confirmButton);
      
      expect(screen.getByText('Menghapus...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
      });
    });

    it('should disable buttons during deletion', async () => {
      mockOnConfirm.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
      render(<DeleteConfirmation {...defaultProps} />);
      
      const confirmButton = screen.getByText('Hapus');
      const cancelButton = screen.getByText('Batal');
      
      fireEvent.click(confirmButton);
      
      expect(confirmButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
      
      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
      });
    });
  });

  describe('Success Handling', () => {
    it('should display success message on successful deletion', async () => {
      mockOnConfirm.mockResolvedValue({ success: true });
      render(<DeleteConfirmation {...defaultProps} />);
      
      const confirmButton = screen.getByText('Hapus');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/berhasil dihapus/i)).toBeInTheDocument();
      });
    });

    it('should close dialog after showing success message', async () => {
      jest.useFakeTimers();
      mockOnConfirm.mockResolvedValue({ success: true });
      render(<DeleteConfirmation {...defaultProps} />);
      
      const confirmButton = screen.getByText('Hapus');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/berhasil dihapus/i)).toBeInTheDocument();
      });

      // Fast-forward time
      jest.advanceTimersByTime(1500);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
      
      jest.useRealTimers();
    });

    it('should disable buttons after success', async () => {
      mockOnConfirm.mockResolvedValue({ success: true });
      render(<DeleteConfirmation {...defaultProps} />);
      
      const confirmButton = screen.getByText('Hapus');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/berhasil dihapus/i)).toBeInTheDocument();
      });

      expect(confirmButton).toBeDisabled();
      expect(screen.getByText('Batal')).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when deletion fails', async () => {
      const errorMessage = 'Cannot delete: item has dependencies';
      mockOnConfirm.mockResolvedValue({ error: errorMessage });
      render(<DeleteConfirmation {...defaultProps} />);
      
      const confirmButton = screen.getByText('Hapus');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should handle thrown errors', async () => {
      const errorMessage = 'Network error';
      mockOnConfirm.mockRejectedValue(new Error(errorMessage));
      render(<DeleteConfirmation {...defaultProps} />);
      
      const confirmButton = screen.getByText('Hapus');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should handle non-Error thrown values', async () => {
      mockOnConfirm.mockRejectedValue('String error');
      render(<DeleteConfirmation {...defaultProps} />);
      
      const confirmButton = screen.getByText('Hapus');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Terjadi kesalahan saat menghapus/i)).toBeInTheDocument();
      });
    });

    it('should not close dialog on error', async () => {
      mockOnConfirm.mockResolvedValue({ error: 'Test error' });
      render(<DeleteConfirmation {...defaultProps} />);
      
      const confirmButton = screen.getByText('Hapus');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should re-enable buttons after error', async () => {
      mockOnConfirm.mockResolvedValue({ error: 'Test error' });
      render(<DeleteConfirmation {...defaultProps} />);
      
      const confirmButton = screen.getByText('Hapus');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      expect(confirmButton).not.toBeDisabled();
      expect(screen.getByText('Batal')).not.toBeDisabled();
    });
  });

  describe('Reusability', () => {
    it('should work with different entity types', () => {
      const { rerender } = render(
        <DeleteConfirmation {...defaultProps} itemType="Service" itemName="Oil Change" />
      );
      expect(screen.getByText(/Hapus Service\?/i)).toBeInTheDocument();
      expect(screen.getByText(/Oil Change/i)).toBeInTheDocument();

      rerender(
        <DeleteConfirmation {...defaultProps} itemType="Mechanic" itemName="John Doe" />
      );
      expect(screen.getByText(/Hapus Mechanic\?/i)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    it('should handle multiple confirmation dialogs independently', async () => {
      const mockOnConfirm1 = jest.fn().mockResolvedValue({ success: true });
      const mockOnConfirm2 = jest.fn().mockResolvedValue({ success: true });

      const { rerender } = render(
        <DeleteConfirmation
          {...defaultProps}
          onConfirm={mockOnConfirm1}
          itemName="Item 1"
        />
      );

      const confirmButton = screen.getByText('Hapus');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnConfirm1).toHaveBeenCalled();
      });

      rerender(
        <DeleteConfirmation
          {...defaultProps}
          onConfirm={mockOnConfirm2}
          itemName="Item 2"
        />
      );

      const confirmButton2 = screen.getByText('Hapus');
      fireEvent.click(confirmButton2);

      await waitFor(() => {
        expect(mockOnConfirm2).toHaveBeenCalled();
      });

      expect(mockOnConfirm1).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper modal structure', () => {
      render(<DeleteConfirmation {...defaultProps} />);
      const dialog = screen.getByText(/Hapus Test Type\?/i).closest('div');
      expect(dialog).toHaveClass('bg-white', 'rounded-lg');
    });

    it('should have visible backdrop', () => {
      const { container } = render(<DeleteConfirmation {...defaultProps} />);
      const backdrop = container.querySelector('.bg-black.bg-opacity-50');
      expect(backdrop).toBeInTheDocument();
    });

    it('should have proper button styling for destructive action', () => {
      render(<DeleteConfirmation {...defaultProps} />);
      const confirmButton = screen.getByText('Hapus');
      expect(confirmButton).toHaveClass('bg-red-600');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty item name', () => {
      render(<DeleteConfirmation {...defaultProps} itemName="" />);
      expect(screen.getByText(/Hapus Test Type\?/i)).toBeInTheDocument();
    });

    it('should handle very long item names', () => {
      const longName = 'A'.repeat(200);
      render(<DeleteConfirmation {...defaultProps} itemName={longName} />);
      expect(screen.getByText(new RegExp(longName))).toBeInTheDocument();
    });

    it('should handle special characters in item name', () => {
      const specialName = 'Test <Item> & "Special" \'Chars\'';
      render(<DeleteConfirmation {...defaultProps} itemName={specialName} />);
      expect(screen.getByText(new RegExp(specialName))).toBeInTheDocument();
    });

    it('should handle rapid button clicks', async () => {
      mockOnConfirm.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
      render(<DeleteConfirmation {...defaultProps} />);
      
      const confirmButton = screen.getByText('Hapus');
      
      // Click multiple times rapidly
      fireEvent.click(confirmButton);
      fireEvent.click(confirmButton);
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      });
    });
  });
});
