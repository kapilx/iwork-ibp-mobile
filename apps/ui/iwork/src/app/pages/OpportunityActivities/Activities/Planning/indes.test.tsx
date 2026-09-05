import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OpportunityPlanning from './index';
import { useApiQuery, useApiMutation } from '@ui/ui-lib';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import dayjs from 'dayjs';

// Mock dependencies
jest.mock('@ui/ui-lib', () => ({
  __esModule: true,
  ...jest.requireActual('@ui/ui-lib'),
  useApiQuery: jest.fn(),
  useApiMutation: jest.fn(),
  setToastMessage: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: '123' }),
}));

const mockStore = configureStore([]);
const store = mockStore({});

describe('OpportunityPlanning Component', () => {
  const mockMutate = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useApiQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'participants') {
        return { data: [{ userName: 'John Doe', userId: 1 }] };
      }
      if (queryKey[0] === 'opportunityId') {
        return {
          data: {
            data: [
              {
                stageId: 1,
                stageName: 'Stage 1',
                activities: [
                  {
                    opportunityActivityId: 1,
                    activityName: 'Activity 1',
                    dueDate: '2025-05-16',
                    participants: [{ userName: 'John Doe', userId: 1 }],
                  },
                ],
              },
            ],
          },
        };
      }
      return {};
    });

    (useApiMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      config: { onSuccess: mockOnSuccess, onError: mockOnError },
    });
  });

  it('renders the component without crashing', () => {
    render(
      <Provider store={store}>
        <OpportunityPlanning />
      </Provider>
    );

    expect(screen.getByText('Stage 1')).toBeInTheDocument();
    expect(screen.getByText('Activity 1')).toBeInTheDocument();
  });

  it('displays validation errors when form is submitted with invalid data', async () => {
    render(
      <Provider store={store}>
        <OpportunityPlanning />
      </Provider>
    );

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Required')).toBeInTheDocument();
    });
  });

  it('calls the API mutation with the correct payload on form submission', async () => {
    render(
      <Provider store={store}>
        <OpportunityPlanning />
      </Provider>
    );

    const dateInput = screen.getByPlaceholderText('DD/MM/YYYY');
    fireEvent.change(dateInput, { target: { value: '2025-05-17' } });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        endpoint: expect.any(String),
        method: 'PUT',
        data: {
          opportunityActivities: [
            {
              opportunityActivityId: 1,
              dueDate: '2025-05-17T00:00:00.000Z',
              participants: [1],
            },
          ],
        },
      });
    });
  });

  it('handles API errors gracefully', async () => {
    (useApiMutation as jest.Mock).mockReturnValueOnce({
      mutate: jest.fn((_, { onError }) => onError({ message: 'API Error' })),
    });

    render(
      <Provider store={store}>
        <OpportunityPlanning />
      </Provider>
    );

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('renders loading state when data is being fetched', () => {
    (useApiQuery as jest.Mock).mockReturnValueOnce({ isLoading: true });

    render(
      <Provider store={store}>
        <OpportunityPlanning />
      </Provider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders error state when data fetching fails', () => {
    (useApiQuery as jest.Mock).mockReturnValueOnce({ error: true });

    render(
      <Provider store={store}>
        <OpportunityPlanning />
      </Provider>
    );

    expect(screen.getByText('Error loading data')).toBeInTheDocument();
  });
});