import { renderHook, act } from '@testing-library/react';
import useFormWatcher from './useFormWatcher';
import { updateUserDefaultConfig } from '../redux';

jest.mock('../redux', () => ({
  updateUserDefaultConfig: jest.fn((payload) => ({
    __thunk: 'updateUserDefaultConfig',
    payload,
  })),
}));

jest.mock('./useTableController', () => ({
  buildColumnSettingsPayload: jest.fn((columnOrder?: any[]) =>
    columnOrder?.map((item, index) => ({
      name: item.field,
      index,
      hide: item?.hide || false,
    }))
  ),
}));

describe('useFormWatcher', () => {
  const mockSetSearchTerm = jest.fn();
  const mockReset = jest.fn();
  let mockWatch: jest.Mock;
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribe = jest.fn();
    mockWatch = jest.fn((cb) => {
      // Simulate subscription
      mockWatch._cb = cb;
      return { unsubscribe: mockUnsubscribe };
    });
  });

  function getFormMethods(values = {}) {
    return {
      watch: mockWatch,
      reset: mockReset,
      getValues: () => values,
    };
  }

  it('initializes with searchDefaultValues', () => {
    const formMethods = getFormMethods();
    const { result } = renderHook(() =>
      useFormWatcher({
        formMethods,
        setSearchTerm: mockSetSearchTerm,
        searchFieldName: 'search',
        searchDefaultValues: { search: 'init' },
      })
    );
    expect(result.current.selectedValues).toEqual({ search: 'init' });
  });

  it('initializes with undefined if no searchDefaultValues', () => {
    const formMethods = getFormMethods();
    const { result } = renderHook(() =>
      useFormWatcher({
        formMethods,
        setSearchTerm: mockSetSearchTerm,
        searchFieldName: 'search',
      })
    );
    expect(result.current.selectedValues).toBeUndefined();
  });

  it('subscribes to formMethods.watch and updates selectedValues and searchTerm', () => {
    const formMethods = getFormMethods();
    renderHook(() =>
      useFormWatcher({
        formMethods,
        setSearchTerm: mockSetSearchTerm,
        searchFieldName: 'search',
      })
    );
    // Simulate form change
    act(() => {
      mockWatch._cb({ search: 'foo' });
    });
    expect(mockSetSearchTerm).toHaveBeenCalledWith('foo');
  });

  it('sets searchTerm to empty string if field is missing', () => {
    const formMethods = getFormMethods();
    renderHook(() =>
      useFormWatcher({
        formMethods,
        setSearchTerm: mockSetSearchTerm,
        searchFieldName: 'search',
      })
    );
    act(() => {
      mockWatch._cb({});
    });
    expect(mockSetSearchTerm).toHaveBeenCalledWith('');
  });

  it('cleans up subscription on unmount', () => {
    const formMethods = getFormMethods();
    const { unmount } = renderHook(() =>
      useFormWatcher({
        formMethods,
        setSearchTerm: mockSetSearchTerm,
        searchFieldName: 'search',
      })
    );
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('handleReset resets form and clears searchTerm if searchDefaultValues provided', () => {
    const formMethods = getFormMethods();
    const { result } = renderHook(() =>
      useFormWatcher({
        formMethods,
        setSearchTerm: mockSetSearchTerm,
        searchFieldName: 'search',
        searchDefaultValues: { search: 'init' },
      })
    );
    act(() => {
      result.current.handleReset();
    });
    expect(mockReset).toHaveBeenCalledWith({ search: 'init' });
    expect(mockSetSearchTerm).toHaveBeenCalledWith('');
  });

  it('handleReset does nothing if searchDefaultValues is missing', () => {
    const formMethods = getFormMethods();
    const { result } = renderHook(() =>
      useFormWatcher({
        formMethods,
        setSearchTerm: mockSetSearchTerm,
        searchFieldName: 'search',
      })
    );
    act(() => {
      result.current.handleReset();
    });
    expect(mockReset).not.toHaveBeenCalled();
    expect(mockSetSearchTerm).not.toHaveBeenCalledWith('');
  });

  it('handleReset dispatches updateUserDefaultConfig when dispatch and entityKey are provided', () => {
    const mockDispatch = jest.fn();
    const formMethods = getFormMethods();
    const columnOrder = [
      { field: 'name', hide: false },
      { field: 'status', hide: true },
    ];
    const { result } = renderHook(() =>
      useFormWatcher({
        formMethods,
        setSearchTerm: mockSetSearchTerm,
        searchFieldName: 'search',
        searchDefaultValues: { search: 'init' },
        entityKey: 'SOME_ENTITY',
        columnOrder,
        dispatch: mockDispatch,
      })
    );
    act(() => {
      result.current.handleReset();
    });
    expect(updateUserDefaultConfig).toHaveBeenCalledWith({
      entityKey: 'SOME_ENTITY',
      selectedFilterValues: { search: 'init' },
      columns: [
        { name: 'name', index: 0, hide: false },
        { name: 'status', index: 1, hide: true },
      ],
    });
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(
      jest.mocked(updateUserDefaultConfig).mock.results[0].value
    );
  });

  it('handleReset persists persistDefaultValues instead of searchDefaultValues when provided, while still resetting the form to searchDefaultValues', () => {
    const mockDispatch = jest.fn();
    const formMethods = getFormMethods();
    const { result } = renderHook(() =>
      useFormWatcher({
        formMethods,
        setSearchTerm: mockSetSearchTerm,
        searchFieldName: 'search',
        // e.g. a drill-down link's transient, contextual prefilled value —
        // fine to reset the form to, but must never be persisted as default.
        searchDefaultValues: { search: 'contextual-prefill' },
        persistDefaultValues: { search: 'true-system-default' },
        entityKey: 'SOME_ENTITY',
        dispatch: mockDispatch,
      })
    );
    act(() => {
      result.current.handleReset();
    });
    expect(mockReset).toHaveBeenCalledWith({ search: 'contextual-prefill' });
    expect(updateUserDefaultConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedFilterValues: { search: 'true-system-default' },
      })
    );
  });

  it('handleReset does not dispatch when entityKey is missing', () => {
    const mockDispatch = jest.fn();
    const formMethods = getFormMethods();
    renderHook(() =>
      useFormWatcher({
        formMethods,
        setSearchTerm: mockSetSearchTerm,
        searchFieldName: 'search',
        searchDefaultValues: { search: 'init' },
        dispatch: mockDispatch,
      })
    ).result.current.handleReset();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('handleReset does not dispatch when dispatch is missing', () => {
    const formMethods = getFormMethods();
    const { result } = renderHook(() =>
      useFormWatcher({
        formMethods,
        setSearchTerm: mockSetSearchTerm,
        searchFieldName: 'search',
        searchDefaultValues: { search: 'init' },
        entityKey: 'SOME_ENTITY',
      })
    );
    expect(() => {
      act(() => {
        result.current.handleReset();
      });
    }).not.toThrow();
  });

  it('does nothing if formMethods is missing', () => {
    // @ts-expect-error purposely missing formMethods
    const { result } = renderHook(() =>
      useFormWatcher({
        formMethods: undefined,
        setSearchTerm: mockSetSearchTerm,
        searchFieldName: 'search',
      })
    );
    expect(result.current.selectedValues).toBeUndefined();
    act(() => {
      result.current.handleReset();
    });
    expect(mockSetSearchTerm).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
  });
});
