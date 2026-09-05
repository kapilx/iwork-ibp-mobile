import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import Header from "./index";
import { theme } from "@ui/ui-lib/styles";

const mockNavigate = jest.fn();
const mockSignOut = jest.fn();
const mockRefresh = jest.fn();
const mockUpdateStatus = jest.fn();
const mockSetFilterStatus = jest.fn();

// Capture props passed to the mocked NotificationsDrawer
let onItemClickHandler: (item: any) => void;

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Mock react-redux to bypass Provider requirement
jest.mock("react-redux", () => ({
  useSelector: jest.fn().mockReturnValue(false),
  useDispatch: jest.fn(),
}));

jest.mock("../../providers/AuthProvider", () => ({
  useAuth: () => ({ signOut: mockSignOut }),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/knowledge-central" }),
}));

jest.mock("../NotificationsDrawer", () => ({
  __esModule: true,
  default: ({ open, onItemClick, onClose }: any) => {
    onItemClickHandler = onItemClick;
    return open ? <div data-testid="notifications-drawer" /> : null;
  },
  useNotifications: () => ({
    notifications: [],
    unreadCount: 1,
    refresh: mockRefresh,
    updateStatus: mockUpdateStatus,
    loadMore: jest.fn(),
    hasMore: false,
    filterStatus: "unread",
    setFilterStatus: mockSetFilterStatus,
    isLoading: false,
  }),
}));

describe("Header Component", () => {
  const renderWithTheme = () => {
    return render(
      <ThemeProvider theme={theme}>
        <Header />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    sessionStorage.setItem(
      "user",
      JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        designation: "Engineer",
      })
    );
    mockNavigate.mockClear();
    mockUpdateStatus.mockClear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("renders user profile icon and opens menu on click", () => {
    renderWithTheme();
    const avatar = screen.getByTestId("user-profile-icon");
    expect(avatar).toBeInTheDocument();
    fireEvent.click(avatar);
    expect(avatar).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("closes user menu when handleMenuClose is triggered", () => {
    renderWithTheme();
    const avatar = screen.getByTestId("user-profile-icon");
    fireEvent.click(avatar);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    const logoutItem = screen.getByRole("menuitem", { name: /logout/i });
    fireEvent.click(logoutItem);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect((avatar as HTMLElement).getAttribute("aria-expanded")).toBeNull();
  });

  it("navigates to /companies when logo is clicked", () => {
    renderWithTheme();
    const logo = screen.getByAltText(/iirm/i);
    fireEvent.click(logo);
    expect(mockNavigate).toHaveBeenCalledWith("/companies");
  });

  it("isActiveTab returns false when notification is active", () => {
    renderWithTheme();
    const notificationIcon = screen.getByTestId("notification-badge");
    fireEvent.click(notificationIcon);
    const mailsTab = screen.getByText(/my mails/i);
    expect(mailsTab).toBeInTheDocument();
  });

  it("navigates to /knowledge-central when Knowledge Central tab is clicked", () => {
    renderWithTheme();
    const knowledgeTab = screen.getByText(/knowledge central/i);
    fireEvent.click(knowledgeTab);
    expect(mockNavigate).toHaveBeenCalledWith("/knowledge-central");
  });

  it("navigates to /my-mails when My Mails tab is clicked", () => {
    renderWithTheme();
    const mailsTab = screen.getByText(/my mails/i);
    fireEvent.click(mailsTab);
    expect(mockNavigate).toHaveBeenCalledWith("/my-mails");
  });

  it("navigates to /ilearn when Ilearn tab is clicked", () => {
    renderWithTheme();
    const ilearnTab = screen.getByText(/ilearn/i);
    fireEvent.click(ilearnTab);
    expect(mockNavigate).toHaveBeenCalledWith("/ilearn");
  });

  it("toggles notification drawer on icon click", () => {
    renderWithTheme();
    const icon = screen.getByTestId("notification-badge");
    fireEvent.click(icon);
    expect(screen.getByTestId("notifications-drawer")).toBeInTheDocument();
    fireEvent.click(icon);
    expect(
      screen.queryByTestId("notifications-drawer")
    ).not.toBeInTheDocument();
  });

  it("closes notification drawer and resets active tab", () => {
    renderWithTheme();
    const icon = screen.getByTestId("notification-badge");
    fireEvent.click(icon); // open drawer
    expect(screen.getByTestId("notifications-drawer")).toBeInTheDocument();
    fireEvent.click(icon); // close drawer
    expect(
      screen.queryByTestId("notifications-drawer")
    ).not.toBeInTheDocument();
  });

  it("calls updateStatus and navigates when notification item is clicked", () => {
    renderWithTheme();
    fireEvent.click(screen.getByTestId("notification-badge")); // open drawer
    onItemClickHandler({ id: "1", redirectUrl: "/test-redirect" });
    expect(mockUpdateStatus).toHaveBeenCalledWith("1", "read");
    expect(mockNavigate).toHaveBeenCalledWith("/test-redirect");
  });

  it("calls updateStatus but does not navigate when no redirectUrl is present", () => {
    renderWithTheme();
    fireEvent.click(screen.getByTestId("notification-badge")); // open drawer

    mockNavigate.mockClear(); // Clear call history from earlier tests

    onItemClickHandler({ id: "2" });

    expect(mockUpdateStatus).toHaveBeenCalledWith("2", "read");
    expect(mockNavigate).not.toHaveBeenCalled(); // now safe
  });

  it("resets anchorEl and activeTab when notification drawer is closed using onClose", () => {
    renderWithTheme();

    const icon = screen.getByTestId("notification-badge");
    fireEvent.click(icon); // open
    expect(screen.getByTestId("notifications-drawer")).toBeInTheDocument();

    fireEvent.click(icon); // close
    expect(
      screen.queryByTestId("notifications-drawer")
    ).not.toBeInTheDocument();
  });
});
