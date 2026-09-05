import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CelebrationsCard from "./index";
import { theme } from "@ui/ui-lib";
import { CelebrationType } from "../../constants/enum";

// Mock React Slick
jest.mock("react-slick", () => {
  return function MockSlider({ children, ...props }: any) {
    return (
      <div data-testid="slider" data-slider-props={JSON.stringify(props)}>
        {children}
      </div>
    );
  };
});

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Mock CSS imports
jest.mock("slick-carousel/slick/slick.css", () => ({}));
jest.mock("slick-carousel/slick/slick-theme.css", () => ({}));

jest.mock("@ui/ui-lib", () => ({
  ...jest.requireActual("@ui/ui-lib"),
  useApiQuery: jest.fn(),
  endPoints: {
    employeeCelebrations: "/api/employee-celebrations",
  },
  CustomTabs: ({ tabs, activeTab, onTabChange }: any) => (
    <div data-testid="custom-tabs">
      <div data-testid="tab-list">
        {tabs.map((tab: any) => (
          <button
            key={tab.tabKey}
            data-testid={`tab-${tab.tabKey}`}
            onClick={() => onTabChange(tab.tabKey)}
            data-active={activeTab === tab.tabKey}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div data-testid="tab-content">
        {tabs.find((tab: any) => tab.tabKey === activeTab)?.content}
      </div>
    </div>
  ),
}));

describe("CelebrationsCard Component", () => {
  let queryClient: QueryClient;

  // Helper function to get the mocked useApiQuery
  const getMockApiQuery = () => require("@ui/ui-lib").useApiQuery as jest.Mock;

  const mockCelebrationsData = {
    data: {
      data: [
        {
          employeeId: 1,
          userId: 1,
          fullName: "John Doe",
          emailId: "john.doe@example.com",
          celebrationType: CelebrationType.BIRTHDAY,
          celebrationDate: new Date().toISOString(), // Today
          profileUrl: "https://example.com/john.jpg",
        },
        {
          employeeId: 2,
          userId: 2,
          fullName: "Jane Smith",
          emailId: "jane.smith@example.com",
          celebrationType: CelebrationType.WORK_ANNIVERSARY,
          celebrationDate: new Date().toISOString(), // Today
          profileUrl: "",
        },
        {
          employeeId: 3,
          userId: 3,
          fullName: "Bob Johnson",
          emailId: "bob.johnson@example.com",
          celebrationType: CelebrationType.BIRTHDAY,
          celebrationDate: new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000
          ).toISOString(), // 3 days from now
          profileUrl: "https://example.com/bob.jpg",
        },
        {
          employeeId: 4,
          userId: 4,
          fullName: "Alice Wilson",
          emailId: "alice.wilson@example.com",
          celebrationType: CelebrationType.WORK_ANNIVERSARY,
          celebrationDate: new Date(
            Date.now() + 5 * 24 * 60 * 60 * 1000
          ).toISOString(), // 5 days from now
          profileUrl: "",
        },
      ],
    },
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();

    // Set up the default mock return value
    getMockApiQuery().mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
  });

  const renderWithProviders = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CelebrationsCard />
        </ThemeProvider>
      </QueryClientProvider>
    );
  };

  it("renders loading state correctly", () => {
    getMockApiQuery().mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    renderWithProviders();

    expect(screen.getByText("Loading Celebrations...")).toBeInTheDocument();
  });

  it("renders celebrations data with tabs", async () => {
    getMockApiQuery().mockReturnValue({
      data: mockCelebrationsData,
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("custom-tabs")).toBeInTheDocument();
      expect(screen.getByTestId("tab-birthday")).toBeInTheDocument();
      expect(screen.getByTestId("tab-anniversary")).toBeInTheDocument();
    });

    // Check tab labels with counts
    expect(screen.getByText("Birthdays (2)")).toBeInTheDocument();
    expect(screen.getByText("Anniversaries (2)")).toBeInTheDocument();
  });

  it("displays correct celebration counts in tab labels", async () => {
    const customData = {
      data: {
        data: [
          {
            employeeId: 1,
            userId: 1,
            fullName: "John Doe",
            emailId: "john.doe@example.com",
            celebrationType: CelebrationType.BIRTHDAY,
            celebrationDate: new Date().toISOString(),
            profileUrl: "",
          },
        ],
      },
    };

    getMockApiQuery().mockReturnValue({
      data: customData,
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("Birthdays (1)")).toBeInTheDocument();
      expect(screen.getByText("Anniversaries (0)")).toBeInTheDocument();
    });
  });

  it("shows no upcoming anniversaries message", async () => {
    const user = userEvent.setup();
    const emptyData = {
      data: {
        data: [],
      },
    };

    getMockApiQuery().mockReturnValue({
      data: emptyData,
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("tab-anniversary")).toBeInTheDocument();
    });

    // Click on anniversary tab
    const anniversaryTab = screen.getByTestId("tab-anniversary");
    await user.click(anniversaryTab);

    await waitFor(() => {
      expect(screen.getByText("No Anniversaries today")).toBeInTheDocument();
      expect(
        screen.getByText("No upcoming anniversaries in the next 7 days")
      ).toBeInTheDocument();
    });
  });

  it("configures slider correctly for multiple items", async () => {
    const multipleItemsData = {
      data: {
        data: [
          {
            employeeId: 1,
            userId: 1,
            fullName: "John Doe",
            emailId: "john.doe@example.com",
            celebrationType: CelebrationType.BIRTHDAY,
            celebrationDate: new Date().toISOString(),
            profileUrl: "",
          },
          {
            employeeId: 2,
            userId: 2,
            fullName: "Jane Smith",
            emailId: "jane.smith@example.com",
            celebrationType: CelebrationType.BIRTHDAY,
            celebrationDate: new Date().toISOString(),
            profileUrl: "",
          },
        ],
      },
    };

    getMockApiQuery().mockReturnValue({
      data: multipleItemsData,
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    await waitFor(() => {
      const slider = screen.getByTestId("slider");
      const sliderProps = JSON.parse(
        slider.getAttribute("data-slider-props") || "{}"
      );

      expect(sliderProps.dots).toBe(true);
      expect(sliderProps.infinite).toBe(true);
      expect(sliderProps.autoplay).toBe(true);
      expect(sliderProps.autoplaySpeed).toBe(5000);
    });
  });

  it("configures slider correctly for single item", async () => {
    const singleItemData = {
      data: {
        data: [
          {
            employeeId: 1,
            userId: 1,
            fullName: "John Doe",
            emailId: "john.doe@example.com",
            celebrationType: CelebrationType.BIRTHDAY,
            celebrationDate: new Date().toISOString(),
            profileUrl: "",
          },
        ],
      },
    };

    getMockApiQuery().mockReturnValue({
      data: singleItemData,
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    await waitFor(() => {
      const slider = screen.getByTestId("slider");
      const sliderProps = JSON.parse(
        slider.getAttribute("data-slider-props") || "{}"
      );

      expect(sliderProps.dots).toBe(false);
      expect(sliderProps.infinite).toBe(false);
      expect(sliderProps.autoplay).toBe(false);
    });
  });

  it("handles empty celebration response gracefully", async () => {
    getMockApiQuery().mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("Birthdays (0)")).toBeInTheDocument();
      expect(screen.getByText("Anniversaries (0)")).toBeInTheDocument();
    });
  });

  it("formats upcoming celebration dates correctly", async () => {
    getMockApiQuery().mockReturnValue({
      data: mockCelebrationsData,
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    await waitFor(() => {
      // Check that dates are formatted in "dd MMM" format
      const dateElements = screen.getAllByText(/\d{1,2} \w{3}/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  it("handles component unmounting gracefully", () => {
    getMockApiQuery().mockReturnValue({
      data: mockCelebrationsData,
      isLoading: false,
      error: null,
    });

    const { unmount } = renderWithProviders();
    expect(() => unmount()).not.toThrow();
  });
});
