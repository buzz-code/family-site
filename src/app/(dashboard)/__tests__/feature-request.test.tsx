/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeatureRequestPage from '../feature-request/page';

describe('FeatureRequestPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to avoid polluting test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders feature request form', () => {
      render(<FeatureRequestPage />);

      expect(screen.getByText('Feature Request')).toBeInTheDocument();
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<FeatureRequestPage />);

      expect(screen.getByText('Submit Request')).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('requires title field', async () => {
      render(<FeatureRequestPage />);

      const descriptionInput = screen.getByLabelText('Description');
      const submitButton = screen.getByText('Submit Request');

      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Title')).toBeInvalid();
      });
    });

    it('requires description field', async () => {
      render(<FeatureRequestPage />);

      const titleInput = screen.getByLabelText('Title');
      const submitButton = screen.getByText('Submit Request');

      fireEvent.change(titleInput, { target: { value: 'Test title' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Description')).toBeInvalid();
      });
    });
  });

  describe('Form submission', () => {
    it('displays success message after submission', async () => {
      render(<FeatureRequestPage />);

      const titleInput = screen.getByLabelText('Title');
      const descriptionInput = screen.getByLabelText('Description');
      const submitButton = screen.getByText('Submit Request');

      fireEvent.change(titleInput, { target: { value: 'New Feature' } });
      fireEvent.change(descriptionInput, { target: { value: 'A great new feature' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('✓ Thank you! Your feature request has been submitted.')).toBeInTheDocument();
      });
    });

    it('allows submitting another request after success', async () => {
      render(<FeatureRequestPage />);

      // Submit first request
      const titleInput = screen.getByLabelText('Title');
      const descriptionInput = screen.getByLabelText('Description');
      const submitButton = screen.getByText('Submit Request');

      fireEvent.change(titleInput, { target: { value: 'First Feature' } });
      fireEvent.change(descriptionInput, { target: { value: 'First description' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('✓ Thank you! Your feature request has been submitted.')).toBeInTheDocument();
      });

      // Click "Submit another request"
      fireEvent.click(screen.getByText('Submit another request'));

      // Form should be visible again
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });
  });

  describe('Priority selection', () => {
    it('defaults to medium priority', () => {
      render(<FeatureRequestPage />);

      const prioritySelect = screen.getByLabelText('Priority');
      expect(prioritySelect).toHaveValue('medium');
    });

    it('allows selecting low priority', () => {
      render(<FeatureRequestPage />);

      const prioritySelect = screen.getByLabelText('Priority');
      fireEvent.change(prioritySelect, { target: { value: 'low' } });

      expect(prioritySelect).toHaveValue('low');
    });

    it('allows selecting high priority', () => {
      render(<FeatureRequestPage />);

      const prioritySelect = screen.getByLabelText('Priority');
      fireEvent.change(prioritySelect, { target: { value: 'high' } });

      expect(prioritySelect).toHaveValue('high');
    });
  });

  describe('Form state management', () => {
    it('updates form data as user types', () => {
      render(<FeatureRequestPage />);

      const titleInput = screen.getByLabelText('Title');
      const descriptionInput = screen.getByLabelText('Description');

      fireEvent.change(titleInput, { target: { value: 'My Feature' } });
      fireEvent.change(descriptionInput, { target: { value: 'My description' } });

      expect(titleInput).toHaveValue('My Feature');
      expect(descriptionInput).toHaveValue('My description');
    });
  });
});
