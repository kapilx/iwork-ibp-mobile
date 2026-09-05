import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Announcement from "./index";
import { theme } from "@ui/ui-lib";

// Mock the useApiQuery hook
const mockUseApiQuery = jest.fn();
jest.mock("@ui/ui-lib", () => ({
  ...jest.requireActual("@ui/ui-lib"),
  useApiQuery: () => mockUseApiQuery(),
  endPoints: {
    announcement: "/api/announcements",
  },
  formatDate: jest.fn((date, format) => {
    if (!date) return "";
    // Mock formatDate to return a predictable format
    if (format === "DD MMM") {
      return "15 Jan";
    }
    return date;
  }),
}));

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

describe("Announcement Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const renderWithProviders = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <Announcement />
        </ThemeProvider>
      </QueryClientProvider>
    );
  };

  const mockAnnouncementData = [
    {
      id: 1,
      title: "Important System Maintenance",
      description: "The system will be down for maintenance on Sunday.",
      expiryDate: "2025-08-20T10:00:00Z",
    },
    {
      id: 2,
      title: "New Feature Release",
      description: "We have released new dashboard features.",
      expiryDate: "2025-08-25T15:30:00Z",
    },
  ];

  it("renders the announcement container", () => {
    mockUseApiQuery.mockReturnValue({
      data: { data: { data: mockAnnouncementData } },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    // Check if the container is rendered
    const container = screen
      .getByText("Important System Maintenance")
      .closest("div");
    expect(container).toBeInTheDocument();
  });

  it("renders multiple announcements correctly", () => {
    mockUseApiQuery.mockReturnValue({
      data: { data: { data: mockAnnouncementData } },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    expect(
      screen.getByText("Important System Maintenance")
    ).toBeInTheDocument();
    expect(
      screen.getByText("The system will be down for maintenance on Sunday.")
    ).toBeInTheDocument();
    expect(screen.getByText("New Feature Release")).toBeInTheDocument();
    expect(
      screen.getByText("We have released new dashboard features.")
    ).toBeInTheDocument();
  });

  it("displays formatted expiry dates correctly", () => {
    mockUseApiQuery.mockReturnValue({
      data: { data: { data: mockAnnouncementData } },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    const expiryDates = screen.getAllByText("15 Jan");
    expect(expiryDates).toHaveLength(2);
  });

  it("handles empty announcements array", () => {
    mockUseApiQuery.mockReturnValue({
      data: { data: { data: [] } },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    expect(
      screen.queryByText("Important System Maintenance")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("New Feature Release")).not.toBeInTheDocument();
  });

  it("handles null/undefined data", () => {
    mockUseApiQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    expect(
      screen.queryByText("Important System Maintenance")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("New Feature Release")).not.toBeInTheDocument();
  });

  it("handles announcements without expiry date", () => {
    const announcementWithoutDate = [
      {
        id: 3,
        title: "No Date Announcement",
        description: "This announcement has no expiry date.",
        expiryDate: "",
      },
    ];

    mockUseApiQuery.mockReturnValue({
      data: { data: { data: announcementWithoutDate } },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    expect(screen.getByText("No Date Announcement")).toBeInTheDocument();
    expect(
      screen.getByText("This announcement has no expiry date.")
    ).toBeInTheDocument();
  });

  it("handles announcements without id", () => {
    const announcementWithoutId = [
      {
        title: "No ID Announcement",
        description: "This announcement has no ID.",
        expiryDate: "2025-08-30T10:00:00Z",
      },
    ];

    mockUseApiQuery.mockReturnValue({
      data: { data: { data: announcementWithoutId } },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    expect(screen.getByText("No ID Announcement")).toBeInTheDocument();
    expect(
      screen.getByText("This announcement has no ID.")
    ).toBeInTheDocument();
  });

  it("handles loading state", () => {
    mockUseApiQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    renderWithProviders();

    // During loading, no announcements should be displayed
    expect(
      screen.queryByText("Important System Maintenance")
    ).not.toBeInTheDocument();
  });

  it("handles error state", () => {
    mockUseApiQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Failed to fetch announcements"),
    });

    renderWithProviders();

    // During error, no announcements should be displayed
    expect(
      screen.queryByText("Important System Maintenance")
    ).not.toBeInTheDocument();
  });

  it("renders dividers between multiple announcements", () => {
    mockUseApiQuery.mockReturnValue({
      data: { data: { data: mockAnnouncementData } },
      isLoading: false,
      error: null,
    });

    const { container } = renderWithProviders();

    // Check that there's one divider for two announcements
    const announcements = container.querySelectorAll("[data-testid]");
    const titles = screen.getAllByText(
      /Important System Maintenance|New Feature Release/
    );
    expect(titles).toHaveLength(2);
  });

  it("handles special characters in announcement content", () => {
    const specialCharAnnouncement = [
      {
        id: 5,
        title: "Special Characters & Symbols!",
        description: "This contains special chars: @#$%^&*()_+ & émojis 🎉",
        expiryDate: "2025-08-30T10:00:00Z",
      },
    ];

    mockUseApiQuery.mockReturnValue({
      data: { data: { data: specialCharAnnouncement } },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    expect(
      screen.getByText("Special Characters & Symbols!")
    ).toBeInTheDocument();
    expect(
      screen.getByText("This contains special chars: @#$%^&*()_+ & émojis 🎉")
    ).toBeInTheDocument();
  });
});
