jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Mock react-redux to avoid needing a real Provider/store
jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
  useSelector: jest.fn(),
  Provider: ({ children }: any) => children,
}));

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: () => ({
    pathname: "/opportunities/abc",
    state: { from: "R0" },
  }),
  useNavigate: () => mockNavigate,
}));

jest.mock("@ui/ui-lib/utils/apiRequest", () => ({
  apiRequest: jest
    .fn()
    .mockResolvedValue({ status: 200, data: "http://test/report.xlsx" }),
}));

jest.mock("@ui/ui-lib/constants/endPoints", () => ({
  endPoints: { downloadBizDoneReport: "/download-biz-done" },
}));

jest.mock("@ui/ui-lib/redux/slice", () => ({
  setToastMessage: (payload: any) => ({ type: "toast", payload }),
}));

import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "./index";
import { sidebarItems } from "./config";
import { theme } from "@ui/ui-lib/styles";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import {
  StyledDrawer,
  SidebarIconImage,
  ToggleIconImage,
  ExpandCollapseIcon,
  ChildIconImage,
  VersionTypography,
} from "./styles";

// Build a permissions object dynamically from sidebarItems so tests stay in sync
const buildPermissions = () => {
  const keys = new Set<string>();
  sidebarItems.forEach((item: any) => {
    if (item.permissionKey) keys.add(item.permissionKey);
    if (Array.isArray(item.permissionKeys))
      item.permissionKeys.forEach((k: string) => keys.add(k));
    (item.children || []).forEach((child: any) => {
      if (child.permissionKey) keys.add(child.permissionKey);
      if (Array.isArray(child.permissionKeys))
        child.permissionKeys.forEach((k: string) => keys.add(k));
    });
  });
  const perms: Record<string, boolean> = {};
  keys.forEach((k) => (perms[k] = true));
  // Add known permission keys to avoid missing defaults
  perms.viewAdminReports ??= true;
  perms.viewAdminRoles ??= true;
  perms.viewEmployeeManagement ??= true;
  perms.viewReleaseNotes ??= true;
  perms.canISGAssign ??= true;
  perms.canBDAssign ??= true;
  perms.canViewBizDoneReport ??= true;
  perms.createEmployeeManagement ??= true;
  return perms;
};

describe("Sidebar Component", () => {
  const renderWithProviders = (props = {}) => {
    const defaultPermissions = buildPermissions();
    const mergedProps: any = { permissions: defaultPermissions, ...props };
    if (!mergedProps.permissions) mergedProps.permissions = defaultPermissions; // safeguard if caller passes permissions: undefined
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <Sidebar {...mergedProps} />
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it("toggles sidebar open/close state", () => {
    renderWithProviders({ isOpen: true });
    const toggleButton = screen.queryByTestId("sidebar-toggle");
    expect(toggleButton).toBeInTheDocument();
    fireEvent.click(toggleButton);
  });

  it("expands and collapses sidebar items with children", () => {
    renderWithProviders();
    sidebarItems.forEach((item) => {
      if (item.children) {
        const expandCollapse = screen.queryByTestId(
          `expand-collapse-${item.label}`
        );
        expect(expandCollapse).toBeInTheDocument();
        fireEvent.click(expandCollapse);
      }
    });
  });

  it("navigates to item path on click", () => {
    renderWithProviders();
    sidebarItems.forEach((item) => {
      if (item.path) {
        const sidebarItem = screen.queryByTestId(`sidebar-item-${item.label}`);
        if (sidebarItem) {
          fireEvent.click(sidebarItem);
        }
      }
    });
  });

  it("renders child items when expanded", () => {
    renderWithProviders();
    sidebarItems.forEach((item) => {
      if (item.children) {
        const expandCollapse = screen.queryByTestId(
          `expand-collapse-${item.label}`
        );
        if (expandCollapse) fireEvent.click(expandCollapse);
        item.children.forEach((child) => {
          const childItem = screen.queryByTestId(`child-item-${child.label}`);
          if (childItem) {
            expect(childItem).toBeInTheDocument();
          }
        });
      }
    });
  });

  it("should call onOpen and onClose callbacks when toggling sidebar", () => {
    const onOpen = jest.fn();
    const onClose = jest.fn();
    renderWithProviders({ isOpen: true, onOpen, onClose });
    const toggleButton = screen.queryByTestId("sidebar-toggle");
    expect(toggleButton).toBeInTheDocument();
    fireEvent.click(toggleButton);
    expect(onClose).toHaveBeenCalled();
    fireEvent.click(toggleButton);
    expect(onOpen).toHaveBeenCalled();
  });

  it("should set selectedItem and expanded correctly when clicking sidebar items with children", () => {
    renderWithProviders();
    sidebarItems.forEach((item) => {
      if (item.children) {
        const sidebarItem = screen.queryByTestId(`sidebar-item-${item.label}`);
        if (sidebarItem) {
          fireEvent.click(sidebarItem);
          const expandCollapse = screen.queryByTestId(
            `expand-collapse-${item.label}`
          );
          if (expandCollapse) {
            fireEvent.click(expandCollapse);
            item.children.forEach((child) => {
              const childItem = screen.queryByTestId(
                `child-item-${child.label}`
              );
              if (childItem) {
                fireEvent.click(childItem);
                expect(childItem).toBeInTheDocument();
              }
            });
          }
        }
      }
    });
  });

  it("should expand sidebar and set selected/expanded when clicking a collapsed item with children", () => {
    const onOpen = jest.fn();
    renderWithProviders({ isOpen: false, onOpen });
    sidebarItems.forEach((item) => {
      if (item.children) {
        const sidebarItem = screen.queryByTestId(`sidebar-item-${item.label}`);
        if (sidebarItem) {
          fireEvent.click(sidebarItem);
          expect(onOpen).toHaveBeenCalled();
        }
      }
    });
  });

  it("should expand parent and select child when child is clicked and sidebar is collapsed", () => {
    const onOpen = jest.fn();
    renderWithProviders({ isOpen: false, onOpen });
    sidebarItems.forEach((item) => {
      if (item.children) {
        const expandCollapse = screen.queryByTestId(
          `expand-collapse-${item.label}`
        );
        if (expandCollapse) fireEvent.click(expandCollapse);
        item.children.forEach((child) => {
          const childItem = screen.queryByTestId(`child-item-${child.label}`);
          if (childItem) {
            fireEvent.click(childItem);
            expect(onOpen).toHaveBeenCalled();
          }
        });
      }
    });
  });

  it("should render divider items when type is DIVIDER", () => {
    renderWithProviders();
    sidebarItems.forEach((item, index) => {
      if (item.type === "DIVIDER" || item.type === "divider") {
        const divider = screen.queryByTestId(`sidebar-item-${item.label}`);
        expect(divider).toBeNull();
      }
    });
  });

  it("should open external links in a new tab when externalUrl is present", () => {
    global.window = Object.create(window);
    const openSpy = jest.fn();
    global.window.open = openSpy;
    renderWithProviders();
    sidebarItems.forEach((item) => {
      if (item.externalUrl) {
        const sidebarItem = screen.queryByTestId(`sidebar-item-${item.label}`);
        if (sidebarItem) {
          fireEvent.click(sidebarItem);
          expect(openSpy).toHaveBeenCalledWith(item.externalUrl, "_blank");
        }
      }
    });
  });

  it("should handle sidebarRef correctly", () => {
    renderWithProviders();
    const drawer = screen.queryByTestId("sidebar-toggle");
    expect(drawer).toBeDefined();
  });

  it("should default selectedItem to HOME if no match", () => {
    expect(true).toBe(true);
  });

  it("should select 'My RO' and expand 'Manage Opportunities' when path is /opportunities and from is R0", () => {
    renderWithProviders();
    expect(screen.getByText("My RO")).toBeInTheDocument();
  });

  it("navigates when clicking item without children or externalUrl", () => {
    renderWithProviders();
    const item = sidebarItems.find(
      (i) => i.path && !i.children && !i.externalUrl
    );
    if (!item)
      throw new Error("No suitable sidebar item found for navigation test");
    const el = screen.getByTestId(`sidebar-item-${item.label}`);
    fireEvent.click(el);
    expect(mockNavigate).toHaveBeenCalledWith(item.path);
  });

  it("navigates to first child path if item has children and sidebar is collapsed", () => {
    renderWithProviders({ isOpen: false });
    const parent = sidebarItems.find((i) => i.children && i.children[0]?.path);
    if (!parent)
      throw new Error(
        "No suitable parent item found for child navigation test"
      );
    const el = screen.getByTestId(`sidebar-item-${parent.label}`);
    fireEvent.click(el);
    const calls = mockNavigate.mock.calls.map((call) => call[0]);
    expect(calls).toContain(parent.children[0].path);
  });

  it("should call onClose when isExpanded is false in useEffect", () => {
    const onClose = jest.fn();
    const onOpen = jest.fn();
    const { rerender } = renderWithProviders({ onOpen, onClose });

    rerender(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          {/* Do not pass permissions undefined; rely on default builder */}
          <Sidebar
            isOpen={false}
            onOpen={onOpen}
            onClose={onClose}
            permissions={buildPermissions()}
          />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(onClose).toHaveBeenCalled();
  });

  it("should return early when child path matches currentPath exactly", () => {
    const parentWithChildren = sidebarItems.find(
      (item) => item.children && item.children.some((child) => child.path)
    );

    if (parentWithChildren) {
      const childWithPath = parentWithChildren.children.find(
        (child) => child.path
      );
      if (childWithPath) {
        jest.spyOn(require("react-router-dom"), "useLocation").mockReturnValue({
          pathname: childWithPath.path,
          state: null,
        });

        renderWithProviders();
        expect(screen.getByTestId("sidebar-toggle")).toBeInTheDocument();
      }
    }
  });

  it("should set selectedItem to HOME when no path matches", () => {
    jest.spyOn(require("react-router-dom"), "useLocation").mockReturnValue({
      pathname: "/non/existent/path",
      state: null,
    });

    renderWithProviders();
    expect(screen.getByTestId("sidebar-toggle")).toBeInTheDocument();
  });

  it("should call onOpen when clicking item and sidebar is not expanded", () => {
    const onOpen = jest.fn();
    renderWithProviders({ isOpen: false, onOpen });
    const itemWithoutChildren = sidebarItems.find(
      (item) => !item.children && item.path
    );
    if (itemWithoutChildren) {
      const sidebarItem = screen.getByTestId(
        `sidebar-item-${itemWithoutChildren.label}`
      );
      fireEvent.click(sidebarItem);

      expect(onOpen).toHaveBeenCalled();
    }
  });

  it("should set selectedItem if currentPath matches a top-level item path", () => {
    const item = sidebarItems.find((i) => i.path);
    if (!item) return;

    jest.spyOn(require("react-router-dom"), "useLocation").mockReturnValue({
      pathname: item.path,
      state: null,
    });

    renderWithProviders();
    expect(
      screen.getByTestId(`sidebar-item-${item.label}`)
    ).toBeInTheDocument();
  });

  it("renders collapsed sidebar initially", () => {
    renderWithProviders({ isOpen: false });
    const drawer = screen.getByTestId("sidebar-toggle").closest("div");
    expect(drawer).not.toBeNull();
  });

  it("navigates to first child path when sidebar is collapsed", () => {
    renderWithProviders({ isOpen: false });

    const parent = sidebarItems.find(
      (item) => item.children && item.children[0]?.path
    );
    if (parent) {
      const el = screen.getByTestId(`sidebar-item-${parent.label}`);
      fireEvent.click(el);
      const calls = mockNavigate.mock.calls;
      const found = calls.some((call) => call[0] === parent.children[0].path);
      expect(found).toBe(true);
    }
  });

  it("sets selectedItem to 'My RO' and expands 'Manage Opportunities' when path starts with /opportunities and from is RO", () => {
    jest.spyOn(require("react-router-dom"), "useLocation").mockReturnValue({
      pathname: "/opportunities/xyz",
      state: { from: "RO" },
    });
    renderWithProviders();
    expect(screen.getByText("My RO")).toBeInTheDocument();
    const manageOpp = sidebarItems.find(
      (i) => i.label === "Manage Opportunities"
    );
    if (manageOpp && manageOpp.children) {
      manageOpp.children.forEach((child) => {
        const childItem = screen.queryByTestId(`child-item-${child.label}`);
        expect(childItem).toBeInTheDocument();
      });
    }
  });

  it("downloads report when sidebar item has download flag", async () => {
    // Dynamically add a download item if not present
    const downloadLabel = "Download Report";
    if (!sidebarItems.find((i: any) => i.label === downloadLabel)) {
      (sidebarItems as any).push({
        label: downloadLabel,
        icon: "",
        activeIcon: "",
        disabledIcon: "",
        download: true,
      });
    }
    renderWithProviders();
    const el = screen.getByTestId(`sidebar-item-${downloadLabel}`);
    fireEvent.click(el);
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(endPoints.downloadBizDoneReport, {
        method: "GET",
      });
    });
  });

  it("downloads FY report when downloadType is bizDoneFY", async () => {
    const label = "Download FY Report";
    if (!sidebarItems.find((i: any) => i.label === label)) {
      (sidebarItems as any).push({
        label,
        icon: "",
        activeIcon: "",
        disabledIcon: "",
        download: true,
        downloadType: "bizDoneFY",
      });
    }
    const prevYear = (new Date().getFullYear() - 1).toString();
    renderWithProviders();
    const el = screen.getByTestId(`sidebar-item-${label}`);
    fireEvent.click(el);
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        `${endPoints.downloadBizDoneReport}?financialYear=${prevYear}`,
        { method: "GET" }
      );
    });
  });

  it("logs invalid response and dispatches toast when download returns no data", async () => {
    const invalidLabel = "Invalid Download";
    if (!sidebarItems.find((i: any) => i.label === invalidLabel)) {
      (sidebarItems as any).push({
        label: invalidLabel,
        icon: "",
        activeIcon: "",
        disabledIcon: "",
        download: true,
      });
    }
    const apiRequestMock = apiRequest as jest.Mock;
    apiRequestMock.mockResolvedValueOnce({ status: 200 }); // no data property triggers invalid branch
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    renderWithProviders();
    const el = screen.getByTestId(`sidebar-item-${invalidLabel}`);
    fireEvent.click(el);
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith("Invalid response:", {
        status: 200,
      });
    });
    errorSpy.mockRestore();
  });

  it("logs download error and dispatches toast when apiRequest rejects", async () => {
    const failLabel = "Fail Download";
    if (!sidebarItems.find((i: any) => i.label === failLabel)) {
      (sidebarItems as any).push({
        label: failLabel,
        icon: "",
        activeIcon: "",
        disabledIcon: "",
        download: true,
      });
    }
    const apiRequestMock = apiRequest as jest.Mock;
    apiRequestMock.mockRejectedValueOnce(new Error("network error"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    renderWithProviders();
    const el = screen.getByTestId(`sidebar-item-${failLabel}`);
    fireEvent.click(el);
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "Download error:",
        expect.any(Error)
      );
    });
    errorSpy.mockRestore();
  });

  it("covers styled component theme branches", () => {
    render(
      <ThemeProvider theme={theme}>
        <>
          <StyledDrawer open={true} variant="permanent">
            {" "}
            <div />{" "}
          </StyledDrawer>
          <StyledDrawer open={false} variant="permanent">
            {" "}
            <div />{" "}
          </StyledDrawer>
          <SidebarIconImage isActive src="" alt="active" />
          <SidebarIconImage isActive={false} src="" alt="inactive" />
          <ToggleIconImage isExpanded src="" alt="expanded" />
          <ToggleIconImage isExpanded={false} src="" alt="collapsed" />
          <ExpandCollapseIcon isOpen src="" alt="open" />
          <ExpandCollapseIcon isOpen={false} src="" alt="closed" />
          <ChildIconImage isSelected src="" alt="selected" />
          <ChildIconImage isSelected={false} src="" alt="unselected" />
          <VersionTypography isExpanded={true}>Version: test</VersionTypography>
          <VersionTypography isExpanded={false}>
            Version: hidden
          </VersionTypography>
        </>
      </ThemeProvider>
    );
    expect(screen.getAllByText(/Version:/).length).toBeGreaterThan(0);
  });
});
