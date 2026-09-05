import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom"; // Required for custom matchers
import { ThemeProvider } from "@mui/material/styles";
import CustomTabs, { TabsProps } from "./"; // Adjust the path to your theme file
import { theme } from "../../styles/Theme";

// Mock the image import
jest.mock(
  "../../assets/webp/no-data-found-background-image.webp",
  () => "no-data-found-background-image.webp"
);

// Mock tabs data
const mockTabs: TabsProps["tabs"] = [
  { tabKey: "tab1", label: "Tab 1", content: <div>Content 1</div> },
  { tabKey: "tab2", label: "Tab 2", content: <div>Content 2</div> },
  { tabKey: "tab3", label: "Tab 3", content: <div>Content 3</div> },
];

// Tabs with missing content (to test fallback)
const tabsWithMissingContent: TabsProps["tabs"] = [
  { tabKey: "tab1", label: "Tab 1", content: undefined },
  { tabKey: "tab2", label: "Tab 2" },
];

// Render helper
const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe("CustomTabs Component", () => {
  test("renders all tab labels", () => {
    renderWithTheme(<CustomTabs tabs={mockTabs} />);
    mockTabs.forEach((tab) => {
      expect(screen.getByText(tab.label)).toBeInTheDocument();
    });
  });

  test("renders initial tab content by default", () => {
    renderWithTheme(<CustomTabs tabs={mockTabs} />);
    expect(screen.getByText("Content 1")).toBeInTheDocument();
  });

  test("renders correct tab content on tab click", () => {
    renderWithTheme(<CustomTabs tabs={mockTabs} />);
    fireEvent.click(screen.getByText("Tab 2"));
    expect(screen.getByText("Content 2")).toBeInTheDocument();
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
  });

  test("respects initialTabKey prop", () => {
    renderWithTheme(<CustomTabs tabs={mockTabs} initialTabKey="tab3" />);
    expect(screen.getByText("Content 3")).toBeInTheDocument();
  });

  test("respects activeTabKey prop and re-renders on change", () => {
    const { rerender } = renderWithTheme(
      <CustomTabs tabs={mockTabs} activeTabKey="tab1" />
    );
    expect(screen.getByText("Content 1")).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <CustomTabs tabs={mockTabs} activeTabKey="tab3" />
      </ThemeProvider>
    );

    expect(screen.getByText("Content 3")).toBeInTheDocument();
  });

  test("calls onTabChange callback with tabKey", () => {
    const handleTabChange = jest.fn();
    renderWithTheme(
      <CustomTabs tabs={mockTabs} onTabChange={handleTabChange} />
    );
    fireEvent.click(screen.getByText("Tab 2"));
    expect(handleTabChange).toHaveBeenCalledWith("tab2");
  });

  test("renders No Data fallback when content is undefined", () => {
    renderWithTheme(<CustomTabs tabs={tabsWithMissingContent} />);
    expect(screen.getByText("No Data Found")).toBeInTheDocument();
  });

  test("disabled tab cannot be clicked", () => {
    const tabs: TabsProps["tabs"] = [
      { tabKey: "tab1", label: "Tab 1", content: <div>Content A</div> },
      {
        tabKey: "tab2",
        label: "Tab 2",
        content: <div>Content B</div>,
        disabled: true,
      },
    ];
    renderWithTheme(<CustomTabs tabs={tabs} />);
    fireEvent.click(screen.getByText("Tab 2")); // Should be ignored
    expect(screen.queryByText("Content B")).not.toBeInTheDocument();
    expect(screen.getByText("Content A")).toBeInTheDocument();
  });

  test("applies tabProps and tabsProps correctly", () => {
    const tabProps = { "data-testid": "tab" };
    const tabsProps = { "aria-label": "custom-tabs" };
    renderWithTheme(
      <CustomTabs tabs={mockTabs} tabProps={tabProps} tabsProps={tabsProps} />
    );
    expect(screen.getAllByTestId("tab").length).toBe(mockTabs.length);
    expect(screen.getByRole("tablist")).toHaveAttribute(
      "aria-label",
      "custom-tabs"
    );
  });
});
