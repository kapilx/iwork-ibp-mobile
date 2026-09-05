const mockDoFetch = jest.fn();

import { renderHook, act } from '@testing-library/react';
import { useFileUpload, UploadedFile } from './useFileUpload';
import useApi from './useApi';
import { httpMethods } from '../constants';
import { endPoints } from '../constants/endPoints';
import { UPLOAD_INSTRUCTION } from '../constants';

// Mock environment
jest.mock("../environment", () => ({
  environment: {
    VITE_API_URL: "http://localhost",
  },
}));

// Mock Redux
jest.mock('react-redux', () => ({
  useDispatch: () => mockSetToastMessage,
}));

// Mock useApi
jest.mock('./useApi', () => {
  const useApi = jest.fn(() => ({
    doFetch: mockDoFetch,
    data: null,
    loading: false,
  }));
  return {
    __esModule: true,
    default: useApi,
    useApi,
  };
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
// @ts-expect-error test mock
globalThis.sessionStorage = mockSessionStorage;

// Mock Redux actions
const mockSetToastMessage = jest.fn();

describe('useFileUpload', () => {
  const mockToken = 'test-token';
  const mockUser = { accessToken: { accessToken: mockToken } };
  const mockFile: UploadedFile = {
    id: 1,
    fileName: 'test.pdf',
    fileBuffer: 'base64',
    mimeType: 'application/pdf',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockImplementation((key) =>
      key === 'user' ? JSON.stringify(mockUser) : null
    );
    (useApi as jest.Mock).mockImplementation(() => ({
      doFetch: mockDoFetch,
      data: null,
      loading: false,
    }));
  });

  it('should initialize with existingFile if provided', () => {
    const { result } = renderHook(() => useFileUpload(mockFile));
    expect(result.current.uploadedFile).toEqual(mockFile);
  });

  it('should initialize with null if no existingFile', () => {
    const { result } = renderHook(() => useFileUpload());
    expect(result.current.uploadedFile).toBeNull();
  });

  it('should call handleFileChange and handleFileUpload with valid file', () => {
    const { result } = renderHook(() => useFileUpload());
    const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
    const event = {
      target: {
        files: [file],
        value: 'test',
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileChange(event, 'type', 'id', 'doc', jest.fn());
    });

    expect(mockDoFetch).toHaveBeenCalled();
    // @ts-expect-error test mock
    expect(event.target.value).toBe('');
  });

  it('should not upload if file size exceeds MAX_FILE_SIZE_MB', () => {

    const { result } = renderHook(() => useFileUpload());
    // Use a file larger than 20MB (actual limit)
    const bigFile = new File([new Uint8Array(21 * 1024 * 1024)], 'big.pdf');
    const event = {
      target: {
        files: [bigFile],
        value: 'test',
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileChange(event, 'type', 'id', 'doc', jest.fn());
    });

    expect(mockSetToastMessage).toHaveBeenCalledWith(
      expect.objectContaining({ payload: UPLOAD_INSTRUCTION })
    );
    // @ts-expect-error test mock
    expect(event.target.value).toBe('');
    expect(mockDoFetch).not.toHaveBeenCalled();
  });

  it('should update uploadedFile when fileUploadResponse is received', () => {
    const responseData = { id: 2, fileName: 'new.pdf', fileBuffer: 'base64' };
    (useApi as jest.Mock).mockImplementation(() => ({
      doFetch: mockDoFetch,
      data: { data: responseData },
      loading: false,
    }));

    const { result } = renderHook(() => useFileUpload());
    expect(result.current.uploadedFile).toEqual(responseData);
  });

  it('should handle empty file selection', () => {
    const { result } = renderHook(() => useFileUpload());
    const event = {
      target: {
        files: [],
        value: 'test',
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileChange(event, 'type', 'id', 'doc', jest.fn());
    });

    expect(mockDoFetch).not.toHaveBeenCalled();
    // @ts-expect-error test mock
    expect(event.target.value).toBe('test');
  });

  it('should handle hideDropdown true scenario', () => {
    const { result } = renderHook(() => useFileUpload(undefined, undefined, true));
    const file = new File(['dummy'], 'test.pdf');
    act(() => {
      result.current.handleFileUpload(file, 'type', 'id', 'doc');
    });

    if (mockDoFetch.mock.calls.length > 0) {
      const formDataSent = mockDoFetch.mock.calls[0][1].data as FormData;
      expect(formDataSent.get('documentTypeLid')).toBe('');
    } else {
      throw new Error('mockDoFetch was not called');
    }
  });

  it('should use custom endpoint when provided', () => {
    const customEndpoint = '/custom/upload';
    const { result } = renderHook(() => useFileUpload(undefined, customEndpoint));
    const file = new File(['dummy'], 'test.pdf');

    act(() => {
      result.current.handleFileUpload(file, 'type', 'id', 'doc');
    });

    expect(mockDoFetch).toHaveBeenCalledWith(
      customEndpoint,
      expect.any(Object)
    );
  });

  it('should handle missing token', () => {
    mockSessionStorage.getItem.mockReturnValueOnce(null);
    const { result } = renderHook(() => useFileUpload());
    const file = new File(['dummy'], 'test.pdf');

    act(() => {
      result.current.handleFileUpload(file, 'type', 'id', 'doc');
    });

    expect(mockDoFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer null',
        }),
      })
    );
  });

  it('should not update state if fileUploadResponse.data is not an object', () => {
    (useApi as jest.Mock).mockImplementation(() => ({
      doFetch: mockDoFetch,
      data: { data: 'not-an-object' },
      loading: false,
    }));

    const { result } = renderHook(() => useFileUpload());
    expect(result.current.uploadedFile).toBeNull();
  });

  });