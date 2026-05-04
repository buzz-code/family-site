/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import DashboardHome from '../page';

describe('DashboardHome', () => {
  describe('Rendering', () => {
    it('renders dashboard heading', () => {
      render(<DashboardHome />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders welcome message', () => {
      render(<DashboardHome />);

      expect(screen.getByText('Welcome to your family site dashboard.')).toBeInTheDocument();
    });
  });

  describe('Dashboard cards', () => {
    it('renders Quick Start card', () => {
      render(<DashboardHome />);

      expect(screen.getByText('Quick Start')).toBeInTheDocument();
      expect(screen.getByText('Get started with your family site.')).toBeInTheDocument();
    });

    it('renders Recent Activity card', () => {
      render(<DashboardHome />);

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('View recent updates and changes.')).toBeInTheDocument();
    });

    it('renders Tools card', () => {
      render(<DashboardHome />);

      expect(screen.getByText('Tools')).toBeInTheDocument();
      expect(screen.getByText('Access your available tools.')).toBeInTheDocument();
    });
  });

  describe('Card icons', () => {
    it('renders card icons', () => {
      render(<DashboardHome />);

      expect(screen.getByText('🚀')).toBeInTheDocument();
      expect(screen.getByText('📋')).toBeInTheDocument();
      expect(screen.getByText('🔧')).toBeInTheDocument();
    });
  });
});
