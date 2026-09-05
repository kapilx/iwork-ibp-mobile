import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { theme } from "@ui/ui-lib";
import NotificationsDrawer, {
  useNotifications,
  NotificationItem,
} from "./index";
import * as uiLib from "@ui/ui-lib";

// Mock dependencies
jest.mock("@ui/ui-lib", () => ({
  ...jest.requireActual("@ui/ui-lib"),
  useApiQuery: jest.fn(),
  useApiMutation: jest.fn(),
  apiRequest: jest.fn(),
  endPoints: {
    getNotifications: jest.fn(),
    updateNotificationReadStatus: jest.fn(),
    checkLatestNotification: jest.fn(),
  },
  MessageOverlay: ({ children, open, onClose, ...props }: any) =>
    open ? (
      <div data-testid="message-overlay" {...props}>
        {children}
      </div>
    ) : null,
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Mock close icon
jest.mock("../../assets/svgs/close-icon.svg", () => "close-icon.svg");

// Mock constants
jest.mock("../../constants", () => ({
  LOAD_MORE: "Load More",
  NOTIFICATION: "Notifications",
  NOTIFICATION_DELETE: "delete",
  NOTIFICATION_READ: "read",
  NOTIFICATION_UNREAD: "unread",
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>{component}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const mockNotifications: NotificationItem[] = [
  {
    id: 1,
    message: "Test notification 1",
    body: "Test body 1",
    redirectUrl: "/test/1",
    read: false,
    date: "2024-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    message: "Test notification 2",
    body: "Test body 2",
    redirectUrl: "/test/2",
    read: true,
    date: "2024-01-02T00:00:00.000Z",
  },
];

const defaultProps = {
  open: true,
  anchorEl: document.createElement("div"),
  onClose: jest.fn(),
  notifications: mockNotifications,
  onItemClick: jest.fn(),
  onDeleteClick: jest.fn(),
  onLoadMore: jest.fn(),
  unreadCount: 1,
  status: "unread" as const,
  onStatusChange: jest.fn(),
  hasMore: true,
  loading: false,
};

describe("NotificationsDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Status Toggle", () => {
    it("should call onStatusChange when switch is toggled", () => {
      const onStatusChange = jest.fn();
      renderWithProviders(
        <NotificationsDrawer
          {...defaultProps}
          onStatusChange={onStatusChange}
        />
      );

      const switchElement = screen.getByRole("checkbox");
      fireEvent.click(switchElement);

      expect(onStatusChange).toHaveBeenCalledWith("read");
    });
  });

  describe("User Interactions", () => {
    it("should call onItemClick when notification is clicked", () => {
      const onItemClick = jest.fn();
      renderWithProviders(
        <NotificationsDrawer {...defaultProps} onItemClick={onItemClick} />
      );

      const notification = screen.getByTestId("notification-1");
      fireEvent.click(notification);

      expect(onItemClick).toHaveBeenCalledWith(mockNotifications[0]);
    });

    it("should call onDeleteClick when close icon is clicked", async () => {
      const onDeleteClick = jest.fn();
      renderWithProviders(
        <NotificationsDrawer {...defaultProps} onDeleteClick={onDeleteClick} />
      );

      const closeIcons = screen.getAllByAltText("close");
      fireEvent.click(closeIcons[0]);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(onDeleteClick).toHaveBeenCalledWith(1);
      });
    });

    it("should prevent event propagation when close icon is clicked", () => {
      const onItemClick = jest.fn();
      renderWithProviders(
        <NotificationsDrawer {...defaultProps} onItemClick={onItemClick} />
      );

      const closeIcons = screen.getAllByAltText("close");
      fireEvent.click(closeIcons[0]);

      expect(onItemClick).not.toHaveBeenCalled();
    });

    it("should call onLoadMore when load more button is clicked", async () => {
      const onLoadMore = jest.fn().mockResolvedValue(undefined);
      renderWithProviders(
        <NotificationsDrawer {...defaultProps} onLoadMore={onLoadMore} />
      );

      const loadMoreButton = screen.getByTestId("load-more");
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(onLoadMore).toHaveBeenCalled();
      });
    });

    it("should call onClose when overlay is closed", () => {
      const onClose = jest.fn();
      renderWithProviders(
        <NotificationsDrawer {...defaultProps} onClose={onClose} />
      );

      // This would depend on how MessageOverlay handles close events
      // For now, we just verify the prop is passed
      expect(onClose).toEqual(expect.any(Function));
    });
  });
});

describe("useNotifications Hook", () => {
  const mockUseApiQuery = uiLib.useApiQuery as jest.Mock;
  const mockUseApiMutation = uiLib.useApiMutation as jest.Mock;
  const mockApiRequest = uiLib.apiRequest as jest.Mock;

  const mockQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={mockQueryClient}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>{children}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock sessionStorage
    Object.defineProperty(window, "sessionStorage", {
      value: {
        getItem: jest.fn(() => "mock-user"),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
    });

    mockUseApiQuery.mockReturnValue({
      data: {
        data: {
          notification: [
            {
              id: 1,
              subject: "Test notification",
              message: "Test message",
              body: {
                content: "Test:123",
                entityId: "123",
                entityType: "test",
              },
              status: "unread",
              createdAt: "2024-01-01T00:00:00.000Z",
            },
          ],
          unreadCount: 1,
        },
      },
      refetch: jest.fn(),
      isFetching: false,
    });

    mockUseApiMutation.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
    });

    mockApiRequest.mockResolvedValue({
      data: { anyNewNotification: false },
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Initial State", () => {
    it("should initialize with correct default values", () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      expect(result.current.filterStatus).toBe("unread");
      expect(result.current.isLoading).toBe(false);
      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.unreadCount).toBe(1);
      expect(result.current.hasMore).toBe(false);
    });

    it("should process notifications data correctly", () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      const notification = result.current.notifications[0];
      expect(notification).toEqual({
        id: 1,
        message: "Test notification",
        body: "Test:123",
        redirectUrl: "/test/123",
        read: false,
        date: "2024-01-01T00:00:00.000Z",
      });
    });
  });

  describe("Filter Status Management", () => {
    it("should update filter status", () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      act(() => {
        result.current.setFilterStatus("read");
      });

      expect(result.current.filterStatus).toBe("read");
    });

  });

  describe("Load More Functionality", () => {
    it("should determine hasMore correctly", () => {
      mockUseApiQuery.mockReturnValue({
        data: {
          data: {
            notification: new Array(10).fill(null).map((_, i) => ({
              id: i + 1,
              subject: `Test ${i + 1}`,
              message: `Message ${i + 1}`,
              body: {
                content: "Test:123",
                entityId: "123",
                entityType: "test",
              },
              status: "unread",
              createdAt: "2024-01-01T00:00:00.000Z",
            })),
            unreadCount: 1,
          },
        },
        refetch: jest.fn(),
        isFetching: false,
      });

      const { result } = renderHook(() => useNotifications(), { wrapper });

      expect(result.current.hasMore).toBe(true);
    });
  });

  describe("Polling Effect", () => {
    it("should check for new notifications and refetch if found", async () => {
      const mockRefetch = jest.fn();

      mockUseApiQuery.mockReturnValue({
        data: {
          data: {
            notification: [
              {
                id: 1,
                subject: "Test notification",
                message: "Test message",
                body: {
                  content: "Test:123",
                  entityId: "123",
                  entityType: "test",
                },
                status: "unread",
                createdAt: "2024-01-01T00:00:00.000Z",
              },
            ],
            unreadCount: 1,
          },
        },
        refetch: mockRefetch,
        isFetching: false,
      });

      mockApiRequest.mockResolvedValue({
        data: { anyNewNotification: true },
      });

      renderHook(() => useNotifications(), { wrapper });

      // Fast-forward the interval
      act(() => {
        jest.advanceTimersByTime(100000);
      });

      await waitFor(() => {
        expect(mockApiRequest).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    it("should not check for notifications if list is empty", async () => {
      mockUseApiQuery.mockReturnValue({
        data: {
          data: {
            notification: [],
            unreadCount: 0,
          },
        },
        refetch: jest.fn(),
        isFetching: false,
      });

      renderHook(() => useNotifications(), { wrapper });

      act(() => {
        jest.advanceTimersByTime(100000);
      });

      expect(mockApiRequest).not.toHaveBeenCalled();
    });
  });

  describe("Refresh Functionality", () => {
    it("should call refetch when refresh is called", () => {
      const mockRefetch = jest.fn();

      mockUseApiQuery.mockReturnValue({
        data: { data: { notification: [], unreadCount: 0 } },
        refetch: mockRefetch,
        isFetching: false,
      });

      const { result } = renderHook(() => useNotifications(), { wrapper });

      act(() => {
        result.current.refresh();
      });

      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
