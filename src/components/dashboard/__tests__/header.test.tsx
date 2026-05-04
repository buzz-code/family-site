/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from '../header';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('Header', () => {
  const mockOnMenuClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { name: 'John Doe', email: 'john@example.com' },
      },
    });
  });

  describe('Rendering', () => {
    it('renders header with breadcrumbs', () => {
      render(<Header onMenuClick={mockOnMenuClick} />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders menu button on mobile', () => {
      render(<Header onMenuClick={mockOnMenuClick} />);

      const menuButton = screen.getByText('☰');
      expect(menuButton).toBeInTheDocument();
    });

    it('renders user avatar when logged in', () => {
      render(<Header onMenuClick={mockOnMenuClick} />);

      const avatar = screen.getByText('J');
      expect(avatar).toBeInTheDocument();
    });

    it('renders user name when logged in', () => {
      render(<Header onMenuClick={mockOnMenuClick} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Menu button', () => {
    it('calls onMenuClick when menu button is clicked', () => {
      render(<Header onMenuClick={mockOnMenuClick} />);

      const menuButton = screen.getByText('☰');
      fireEvent.click(menuButton);

      expect(mockOnMenuClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('User menu dropdown', () => {
    it('opens dropdown when user avatar is clicked', () => {
      render(<Header onMenuClick={mockOnMenuClick} />);

      const userButton = screen.getByText('John Doe').closest('button');
      fireEvent.click(userButton!);

      expect(screen.getByText('Signed in as')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('closes dropdown when clicking overlay', () => {
      render(<Header onMenuClick={mockOnMenuClick} />);

      const userButton = screen.getByText('John Doe').closest('button');
      fireEvent.click(userButton!);

      expect(screen.getByText('Sign out')).toBeInTheDocument();

      // Click overlay to close
      const overlay = screen.getByText('Signed in as').closest('.fixed');
      fireEvent.click(overlay!);

      expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
    });

    it('calls signOut with correct callbackUrl when sign out is clicked', () => {
      render(<Header onMenuClick={mockOnMenuClick} />);

      const userButton = screen.getByText('John Doe').closest('button');
      fireEvent.click(userButton!);

      const signOutButton = screen.getByText('Sign out');
      fireEvent.click(signOutButton);

      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
  });

  describe('Sign in link', () => {
    it('shows sign in link when not logged in', () => {
      (useSession as jest.Mock).mockReturnValue({ data: null });
      render(<Header onMenuClick={mockOnMenuClick} />);

      expect(screen.getByText('Sign in')).toBeInTheDocument();
      const signInLink = screen.getByText('Sign in').closest('a');
      expect(signInLink).toHaveAttribute('href', '/login');
    });
  });

  describe('User avatar fallback', () => {
    it('shows email first letter when name is missing', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: { name: null, email: 'john@example.com' },
        },
      });
      render(<Header onMenuClick={mockOnMenuClick} />);

      const avatar = screen.getByText('J');
      expect(avatar).toBeInTheDocument();
    });

    it('shows "U" as fallback when no name or email', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: { name: null, email: null },
        },
      });
      render(<Header onMenuClick={mockOnMenuClick} />);

      const avatar = screen.getByText('U');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Responsive behavior', () => {
    it('hides user name on small screens', () => {
      render(<Header onMenuClick={mockOnMenuClick} />);

      const userName = screen.getByText('John Doe');
      expect(userName).toHaveClass('hidden', 'sm:block');
    });
  });
});
