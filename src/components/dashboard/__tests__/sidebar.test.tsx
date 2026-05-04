/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../sidebar';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('Sidebar', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { name: 'John Doe', email: 'john@example.com' },
      },
    });
  });

  describe('Rendering', () => {
    it('renders sidebar with logo', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('Family Site')).toBeInTheDocument();
    });

    it('renders all navigation items', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Tools')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Feature Request')).toBeInTheDocument();
    });

    it('renders user info when logged in', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders sign out button when logged in', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });
  });

  describe('Sidebar visibility', () => {
    it('is visible when isOpen is true', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);

      const sidebar = screen.getByText('Family Site').closest('aside');
      expect(sidebar).toHaveClass('translate-x-0');
    });

    it('is hidden when isOpen is false', () => {
      render(<Sidebar isOpen={false} onClose={mockOnClose} />);

      const sidebar = screen.getByText('Family Site').closest('aside');
      expect(sidebar).toHaveClass('-translate-x-full');
    });
  });

  describe('Close button', () => {
    it('calls onClose when close button is clicked', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sign out', () => {
    it('calls signOut with correct callbackUrl when sign out is clicked', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);

      const signOutButton = screen.getByText('Sign out');
      fireEvent.click(signOutButton);

      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
  });

  describe('Active navigation state', () => {
    it('shows Dashboard as active when on /dashboard', () => {
      (usePathname as jest.Mock).mockReturnValue('/dashboard');
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveClass('bg-blue-50', 'text-blue-600');
    });

    it('shows Settings as active when on /dashboard/settings', () => {
      (usePathname as jest.Mock).mockReturnValue('/dashboard/settings');
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);

      const settingsLink = screen.getByText('Settings').closest('a');
      expect(settingsLink).toHaveClass('bg-blue-50', 'text-blue-600');
    });
  });

  describe('Tools dropdown', () => {
    it('renders dropdown items when expanded', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);

      const toolsLabel = screen.getByText('Tools');
      const detailsElement = toolsLabel.closest('details') as HTMLDetailsElement;

      // Initially collapsed
      expect(detailsElement).not.toHaveAttribute('open');

      // Click to expand
      fireEvent.click(toolsLabel.closest('summary')!);

      expect(screen.getByText('Tool 1')).toBeInTheDocument();
      expect(screen.getByText('Tool 2')).toBeInTheDocument();
      expect(screen.getByText('Tool 3')).toBeInTheDocument();
    });
  });

  describe('User avatar fallback', () => {
    it('shows email first letter when name is missing', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: { name: null, email: 'john@example.com' },
        },
      });
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);

      const avatar = screen.getByText('J');
      expect(avatar).toBeInTheDocument();
    });

    it('shows "U" as fallback when no name or email', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: { name: null, email: null },
        },
      });
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);

      const avatar = screen.getByText('U');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('No session state', () => {
    it('does not render user info when not logged in', () => {
      (useSession as jest.Mock).mockReturnValue({ data: null });
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);

      expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
    });
  });
});
