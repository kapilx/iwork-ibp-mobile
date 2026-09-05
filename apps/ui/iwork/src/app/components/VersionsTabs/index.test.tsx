import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import userEvent from "@testing-library/user-event";
import VersionTabs, { TabData } from "./index";
import { theme } from "@ui/ui-lib";

// Mock the SVG imports
jest.mock("../../../app/assets/svgs/circleIcon.svg", () => "circle-icon.svg");
jest.mock("../../../app/assets/svgs/addNew.svg", () => "add-new-icon.svg");
jest.mock("../../../app/assets/svgs/icons8-edit.svg", () => "edit-icon.svg");

// Mock constants
jest.mock("../../constants", () => ({
  ADD_NEW_VERSION: "Add new version",
}));

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

describe("VersionTabs Component", () => {
  const renderWithTheme = (props: any) => {
    return render(
      <ThemeProvider theme={theme}>
        <VersionTabs {...props} />
      </ThemeProvider>
    );
  };

  const mockSetTabs = jest.fn();
  const mockSetSelectedTab = jest.fn();
  const mockOnBeforeTabChange = jest.fn();
  const mockOnAddTab = jest.fn();

  const defaultTabs: TabData[] = [
    {
      id: "tab1",
      label: "Version 1",
      isEditing: false,
      values: { field1: "value1" },
      isDirty: false,
      versionId: 1,
    },
    {
      id: "tab2",
      label: "Version 2",
      isEditing: false,
      values: { field2: "value2" },
      isDirty: false,
      versionId: 2,
    },
    {
      id: "tab3",
      label: "Version 3",
      isEditing: true,
      values: null,
      isDirty: true,
      defaultVersionName: "Default Version",
    },
  ];

  const defaultProps = {
    tabs: defaultTabs,
    setTabs: mockSetTabs,
    selectedTab: "tab1",
    setSelectedTab: mockSetSelectedTab,
    enableAddTab: true,
    onBeforeTabChange: mockOnBeforeTabChange,
    onAddTab: mockOnAddTab,
    enableEditTab: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders the tabs container", () => {
      renderWithTheme(defaultProps);
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });

    it("renders all tabs with correct labels", () => {
      renderWithTheme(defaultProps);

      expect(
        screen.getByRole("tab", { name: /version 1/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /version 2/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /version 3/i })
      ).toBeInTheDocument();
    });

    it("renders add new version button when enableAddTab is true", () => {
      renderWithTheme(defaultProps);

      const addButton = screen.getByRole("button", {
        name: /add new version/i,
      });
      expect(addButton).toBeInTheDocument();
    });

    it("does not render add new version button when enableAddTab is false", () => {
      renderWithTheme({ ...defaultProps, enableAddTab: false });

      const addButton = screen.queryByRole("button", {
        name: /add new version/i,
      });
      expect(addButton).not.toBeInTheDocument();
    });

    it("shows circle icon for selected tab", () => {
      renderWithTheme(defaultProps);

      const selectedTab = screen.getByRole("tab", { name: /version 1/i });
      const circleIcon = selectedTab.querySelector(
        'img[src="circle-icon.svg"]'
      );
      expect(circleIcon).toBeInTheDocument();
    });

    it("shows edit icons when enableEditTab is true", () => {
      renderWithTheme(defaultProps);

      // Query for edit icons by their src attribute using container
      const { container } = render(
        <ThemeProvider theme={theme}>
          <VersionTabs {...defaultProps} />
        </ThemeProvider>
      );
      const editIcons = container.querySelectorAll('img[src="edit-icon.svg"]');
      expect(editIcons).toHaveLength(2); // Only non-editing tabs should have edit icons
    });

    it("does not show edit icons when enableEditTab is false", () => {
      const { container } = render(
        <ThemeProvider theme={theme}>
          <VersionTabs {...defaultProps} enableEditTab={false} />
        </ThemeProvider>
      );

      const editIcons = container.querySelectorAll('img[src="edit-icon.svg"]');
      expect(editIcons).toHaveLength(0);
    });

    it("renders input field for editing tab", () => {
      renderWithTheme(defaultProps);

      const inputField = screen.getByDisplayValue("Version 3");
      expect(inputField).toBeInTheDocument();
      expect(inputField).toHaveFocus();
    });
  });

  describe("Tab Selection", () => {
    it("calls setSelectedTab when a different tab is clicked", async () => {
      mockOnBeforeTabChange.mockResolvedValue(true);
      renderWithTheme(defaultProps);

      const tab2 = screen.getByRole("tab", { name: /version 2/i });
      await userEvent.click(tab2);

      expect(mockOnBeforeTabChange).toHaveBeenCalledWith("tab1", "tab2");
      expect(mockSetSelectedTab).toHaveBeenCalledWith("tab2");
    });

    it("does not change tab if onBeforeTabChange returns false", async () => {
      mockOnBeforeTabChange.mockResolvedValue(false);
      renderWithTheme(defaultProps);

      const tab2 = screen.getByRole("tab", { name: /version 2/i });
      await userEvent.click(tab2);

      expect(mockOnBeforeTabChange).toHaveBeenCalledWith("tab1", "tab2");
      expect(mockSetSelectedTab).not.toHaveBeenCalled();
    });

    it("does not call onBeforeTabChange when clicking the same tab", async () => {
      renderWithTheme(defaultProps);

      const tab1 = screen.getByRole("tab", { name: /version 1/i });
      await userEvent.click(tab1);

      expect(mockOnBeforeTabChange).not.toHaveBeenCalled();
      expect(mockSetSelectedTab).not.toHaveBeenCalled();
    });

    it("works without onBeforeTabChange callback", async () => {
      renderWithTheme({ ...defaultProps, onBeforeTabChange: undefined });

      const tab2 = screen.getByRole("tab", { name: /version 2/i });
      await userEvent.click(tab2);

      expect(mockSetSelectedTab).toHaveBeenCalledWith("tab2");
    });
  });

  describe("Tab Editing", () => {
    it("enters edit mode when edit icon is clicked (handleLabelDoubleClick)", async () => {
      const renderResult = render(
        <ThemeProvider theme={theme}>
          <VersionTabs {...defaultProps} />
        </ThemeProvider>
      );

      // Find the edit icon for tab1 (first non-editing tab)
      const editIcons = renderResult.container.querySelectorAll(
        'img[src="edit-icon.svg"]'
      );
      expect(editIcons).toHaveLength(2); // tab1 and tab2 should have edit icons

      // Click the first edit icon (tab1)
      const firstEditIcon = editIcons[0] as HTMLElement;
      await userEvent.click(firstEditIcon);

      expect(mockSetTabs).toHaveBeenCalledWith(expect.any(Function));

      // Test the handleLabelDoubleClick functionality
      const setTabsCallback = mockSetTabs.mock.calls[0][0];
      const updatedTabs = setTabsCallback(defaultTabs);

      // tab1 should now be in editing mode
      expect(updatedTabs[0].isEditing).toBe(true);
      expect(updatedTabs[0].id).toBe("tab1");

      // Other tabs should remain unchanged
      expect(updatedTabs[1].isEditing).toBe(false);
      expect(updatedTabs[2].isEditing).toBe(true); // was already editing
    });

    it("enters edit mode for tab2 when its edit icon is clicked", async () => {
      const renderResult = render(
        <ThemeProvider theme={theme}>
          <VersionTabs {...defaultProps} />
        </ThemeProvider>
      );

      const editIcons = renderResult.container.querySelectorAll(
        'img[src="edit-icon.svg"]'
      );

      // Click the second edit icon (tab2)
      const secondEditIcon = editIcons[1] as HTMLElement;
      await userEvent.click(secondEditIcon);

      expect(mockSetTabs).toHaveBeenCalledWith(expect.any(Function));

      const setTabsCallback = mockSetTabs.mock.calls[0][0];
      const updatedTabs = setTabsCallback(defaultTabs);

      // tab2 should now be in editing mode
      expect(updatedTabs[1].isEditing).toBe(true);
      expect(updatedTabs[1].id).toBe("tab2");

      // Other tabs should remain unchanged
      expect(updatedTabs[0].isEditing).toBe(false);
      expect(updatedTabs[2].isEditing).toBe(true); // was already editing
    });

    it("handleLabelDoubleClick works with tabs that have minimal properties", async () => {
      const minimalTabs: TabData[] = [
        {
          id: "minimal-tab",
          label: "Minimal Tab",
          isEditing: false,
          values: null,
          // Missing optional properties
        },
      ];

      const renderResult = render(
        <ThemeProvider theme={theme}>
          <VersionTabs {...defaultProps} tabs={minimalTabs} />
        </ThemeProvider>
      );

      const editIcons = renderResult.container.querySelectorAll(
        'img[src="edit-icon.svg"]'
      );
      await userEvent.click(editIcons[0] as HTMLElement);

      expect(mockSetTabs).toHaveBeenCalledWith(expect.any(Function));

      const setTabsCallback = mockSetTabs.mock.calls[0][0];
      const updatedTabs = setTabsCallback(minimalTabs);

      expect(updatedTabs[0].isEditing).toBe(true);
      expect(updatedTabs[0].id).toBe("minimal-tab");
      expect(updatedTabs[0].label).toBe("Minimal Tab");
      expect(updatedTabs[0].values).toBeNull();
    });

    it("does not show edit icon for tabs already in editing mode", () => {
      const tabsAllEditing: TabData[] = [
        { ...defaultTabs[0], isEditing: true },
        { ...defaultTabs[1], isEditing: true },
        { ...defaultTabs[2], isEditing: true },
      ];

      const renderResult = render(
        <ThemeProvider theme={theme}>
          <VersionTabs {...defaultProps} tabs={tabsAllEditing} />
        </ThemeProvider>
      );

      const editIcons = renderResult.container.querySelectorAll(
        'img[src="edit-icon.svg"]'
      );
      expect(editIcons).toHaveLength(0);
    });

    it("updates tab label when input value changes", async () => {
      renderWithTheme(defaultProps);

      const inputField = screen.getByDisplayValue("Version 3");

      // Simulate typing in the input field
      fireEvent.change(inputField, { target: { value: "Updated Version" } });

      expect(mockSetTabs).toHaveBeenCalled();

      // Test the setTabs callback
      const setTabsCallback = mockSetTabs.mock.calls[0][0];
      const updatedTabs = setTabsCallback(defaultTabs);

      // The editing tab (tab3) should have updated label and isDirty flag
      expect(updatedTabs[2].label).toBe("Updated Version");
      expect(updatedTabs[2].isDirty).toBe(true);

      // Other tabs should remain unchanged
      expect(updatedTabs[0]).toEqual(defaultTabs[0]);
      expect(updatedTabs[1]).toEqual(defaultTabs[1]);
    });

    it("exits edit mode when input loses focus", async () => {
      renderWithTheme(defaultProps);

      const inputField = screen.getByDisplayValue("Version 3");
      await userEvent.click(inputField);
      fireEvent.blur(inputField);

      expect(mockSetTabs).toHaveBeenCalled();

      // Test the function passed to setTabs
      const setTabsCallback =
        mockSetTabs.mock.calls[mockSetTabs.mock.calls.length - 1][0];
      const updatedTabs = setTabsCallback(defaultTabs);
      expect(updatedTabs[2].isEditing).toBe(false);
    });

    it("handles edit functionality when enableEditTab is false", () => {
      const renderResult = render(
        <ThemeProvider theme={theme}>
          <VersionTabs {...defaultProps} enableEditTab={false} />
        </ThemeProvider>
      );

      // Should not show any edit icons
      const editIcons = renderResult.container.querySelectorAll(
        'img[src="edit-icon.svg"]'
      );
      expect(editIcons).toHaveLength(0);

      // setTabs should not be called for edit functionality
      expect(mockSetTabs).not.toHaveBeenCalled();
    });
  });

  describe("Add New Tab", () => {
    it("calls onAddTab when add button is clicked", async () => {
      renderWithTheme(defaultProps);

      const addButton = screen.getByRole("button", {
        name: /add new version/i,
      });
      await userEvent.click(addButton);

      expect(mockOnAddTab).toHaveBeenCalled();
    });

    it("does not call onAddTab when onAddTab is not provided", async () => {
      renderWithTheme({ ...defaultProps, onAddTab: undefined });

      const addButton = screen.getByRole("button", {
        name: /add new version/i,
      });
      await userEvent.click(addButton);

      // Should not throw an error
      expect(mockOnAddTab).not.toHaveBeenCalled();
    });
  });

  describe("Props Variations", () => {
    it("works with minimal required props", () => {
      const minimalProps = {
        tabs: [
          {
            id: "single-tab",
            label: "Single Tab",
            isEditing: false,
            values: null,
          },
        ],
        setTabs: mockSetTabs,
        selectedTab: "single-tab",
        setSelectedTab: mockSetSelectedTab,
        enableEditTab: false,
      };

      renderWithTheme(minimalProps);

      expect(
        screen.getByRole("tab", { name: /single tab/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /add new version/i })
      ).toBeInTheDocument(); // enableAddTab defaults to true
    });

    it("handles empty tabs array", () => {
      const emptyTabsProps = {
        ...defaultProps,
        tabs: [],
      };

      renderWithTheme(emptyTabsProps);

      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /add new version/i })
      ).toBeInTheDocument();
    });

    it("handles tabs with optional properties missing", () => {
      const tabsWithMissingProps: TabData[] = [
        {
          id: "minimal-tab",
          label: "Minimal Tab",
          isEditing: false,
          values: null,
          // Missing isDirty, defaultVersionName, versionId
        },
      ];

      renderWithTheme({ ...defaultProps, tabs: tabsWithMissingProps });

      expect(
        screen.getByRole("tab", { name: /minimal tab/i })
      ).toBeInTheDocument();
    });
  });
});
