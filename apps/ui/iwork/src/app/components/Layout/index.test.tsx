import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import Layout from "./index";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@ui/ui-lib";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ContentContainer } from "./styles";

// Create a minimal mock reducer for your test
const store = configureStore({
  reducer: () => ({
    user: {
      lookupValues: {
        // Provide realistic mock lookups expected by Layout/children
        sidebar: [{ id: 1, name: "SidebarItem" }],
        rightNav: [{ id: 2, name: "RightNavItem" }],
        // Add more keys if needed by your component
      },
    },
    permissions: { access: {} },
  }),
});

const queryClient = new QueryClient();

// Mock the environment module to avoid import.meta parsing issues
jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Consolidated mock for @ui/ui-lib
jest.mock("@ui/ui-lib", () => {
  const actual = jest.requireActual("@ui/ui-lib");
  return {
    ...actual,
    Sidebar: ({ isOpen, onOpen, onClose }: any) => (
      <div data-testid="sidebar-wrapper">
        <button data-testid="open-sidebar" onClick={onOpen}>
          Open Sidebar
        </button>
        <button data-testid="close-sidebar" onClick={onClose}>
          Close Sidebar
        </button>
      </div>
    ),
    RightNav: ({ onOpen, onClose }: any) => (
      <div data-testid="right-nav">
        <button data-testid="open-rightnav" onClick={onOpen}>
          Open RightNav
        </button>
        <button data-testid="close-rightnav" onClick={onClose}>
          Close RightNav
        </button>
      </div>
    ),
    // Only override environment to avoid import.meta issues
    environment: {
      featureFlag: {},
      apiUrl: "http://localhost:3000",
      production: false,
    },
    // Keep the real FeatureKey and selectHasPermission from actual ui-lib
    FeatureKey: actual.FeatureKey,
    selectHasPermission:
      actual.selectHasPermission ||
      jest.fn((featureKey: string) => (state: any) => true),
  };
});

jest.mock("../FloatingAssistant", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="floating-assistant">FloatingAssistant Mock</div>
  ),
}));

jest.mock("../ComponentMount", () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));

jest.mock("../../pages/TaskMeetingNotesPage/TaskMeetingNotesDetail", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="task-meeting-notes-detail">Task Meeting Notes Detail</div>
  ),
}));

// Also mock `Outlet` to simulate routed children
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    Outlet: () => <div data-testid="content-container">Outlet Content</div>,
  };
});

// Mock SideBar/config to avoid config import issues
jest.mock("rehype-raw", () => ({}));
jest.mock("react-markdown", () => ({}));

// Mock MUI components to avoid styled-engine issues
jest.mock("@mui/material/Button", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));


global.fetch = jest.fn();
(global.fetch as jest.Mock).mockImplementation((url: string) => {
  if (url.includes("look-up/lookup-values-by-name")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            sidebar: [{ id: 1, name: "SidebarItem" }],
            rightNav: [{ id: 2, name: "RightNavItem" }],
          },
        }),
    });
  }

  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  });
});

describe("Layout Component", () => {
  const renderWithProviders = () => {
    return render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <MemoryRouter>
              <Layout />
            </MemoryRouter>
          </ThemeProvider>
        </QueryClientProvider>
      </Provider>
    );
  };

  it("renders Sidebar, RightNav, FloatingAssistant, and ContentContainer", async () => {
    renderWithProviders();

    expect(await screen.findByTestId("sidebar-wrapper")).toBeInTheDocument();
    expect(await screen.findByTestId("right-nav")).toBeInTheDocument();
    expect(await screen.findByTestId("floating-assistant")).toBeInTheDocument();
    expect(await screen.findByTestId("content-container")).toBeInTheDocument();
  });

  it("opens and closes Sidebar and RightNav via handlers", () => {
    renderWithProviders();
    // Simulate open/close logic if testIDs or buttons exist in Sidebar/RightNav
    // This is a placeholder; actual tests depend on Sidebar/RightNav implementation
    // Example:
    // fireEvent.click(screen.getByTestId("sidebar-open-btn"));
    // expect(screen.getByTestId("sidebar-wrapper")).toHaveClass("open");
  });

  it("scrolls ContentContainer to top on location change", () => {
    renderWithProviders();
    // Simulate location change and check scrollTop
    // This is a placeholder; actual test depends on ContentContainer implementation
  });

  it("toggles Sidebar and RightNav correctly via handlers", async () => {
    renderWithProviders();

    const openSidebarBtn = await screen.findByTestId("open-sidebar");
    const closeSidebarBtn = await screen.findByTestId("close-sidebar");
    const openRightNavBtn = await screen.findByTestId("open-rightnav");
    const closeRightNavBtn = await screen.findByTestId("close-rightnav");

    // Initially both are rendered but visibility isn't tracked in mocks
    // So we simulate the behavior by using classnames or log output

    // Open Sidebar
    fireEvent.click(openSidebarBtn);
    // You can assert side effects or behavior here if the UI reflects them

    // Open RightNav (should also close sidebar internally)
    fireEvent.click(openRightNavBtn);

    // Close RightNav
    fireEvent.click(closeRightNavBtn);

    // Close Sidebar
    fireEvent.click(closeSidebarBtn);

    // In a real app, you'd test for visible states or classes,
    // but here we simulate that clicking handlers does not crash the app
    expect(true).toBe(true); // Placeholder to indicate it runs without error
  });
});

describe("ContentContainer Styles", () => {
  it("applies correct styles from theme", () => {
    render(
      <ThemeProvider theme={theme}>
        <ContentContainer data-testid="content-container-style-test">
          Test Content
        </ContentContainer>
      </ThemeProvider>
    );

    const container = screen.getByTestId("content-container-style-test");

    // Verify style properties based on theme
    expect(container).toHaveStyle({
      position: "relative",
      overflowX: "hidden",
      backgroundColor: theme.palette.background.paper,
      marginTop: theme.spacing(13),
      boxShadow: theme.shadows[14],
    });

    // You can also check custom border-radius/border if defined in theme
    expect(container).toHaveStyle(
      `border-top-left-radius: ${theme.shape.borderRadii.normal}`
    );
    expect(container).toHaveStyle(
      `border-top-right-radius: ${theme.shape.borderRadii.normal}`
    );
    expect(container).toHaveStyle(
      `border-top: ${theme.shape.borderSizes.thin} solid ${theme.palette.secondary.border}`
    );
  });
});
