import React from "react";
import "@testing-library/jest-dom";
import SmartSearch from "./index";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@ui/ui-lib/styles/Theme";
import { useForm } from "react-hook-form";

jest.mock("react-hook-form", () => ({
  useForm: () => ({
    setValue: jest.fn(),
    reset: jest.fn(),
    getValues: jest.fn(),
    register: jest.fn(),
    handleSubmit: jest.fn(() => jest.fn()),
    formState: {},
  }),
}));

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@ui/ui-lib/utils/renderWithTheme";

jest.mock("../../environment", () => ({
  environment: {
    VITE_API_URL: "http://localhost",
    featureFlag: {
      FF_IWORK_POLICY_LISTING: false,
    },
  },
}));

jest.mock("rehype-raw", () => ({}));
jest.mock("react-markdown", () => ({}));
jest.mock("../FormComponent", () => ({
  __esModule: true,
  default: ({ formMethods }: any) => {
    // invoke the callback to trigger coverage of SmartSearch inline handler
    if (formMethods) {
      formMethods({ mock: true });
    }
    return <div>DynamicForm</div>;
  },
}));

describe("SmartSearch Component", () => {
  const searchFormConfig = [
    { key: "status", label: "Status", name: "status", type: "text" },
    { key: "type", label: "Type", name: "type", type: "text" },
  ];

  const selectedValues = {
    status: "Active",
    type: "Admin",
  };

  const selectedValuesWithArray = {
    status: ["Active", "Inactive"],
  };

  const emptyValues = {};
  const searchFieldName = "searchTerm";
  const placeholder = "Search...";
  const onReset = jest.fn();

  const renderComponent = (
    props?: Partial<React.ComponentProps<typeof SmartSearch>>
  ) => {
    const formMethods = props?.formMethods ?? useForm();
    return render(
      <ThemeProvider theme={theme}>
        <SmartSearch
          searchFormConfig={searchFormConfig}
          selectedValues={selectedValues}
          onReset={onReset}
          formMethods={formMethods}
          searchFieldName={searchFieldName}
          placeholder={placeholder}
          {...props}
        />
      </ThemeProvider>
    );
  };

  it("renders the SmartSearch component", () => {
    renderComponent();
    expect(screen.getByTestId("smart-search")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
  });

  it("updates search field value on input change and triggers delayed setValue", async () => {
    jest.useFakeTimers();
    renderComponent();

    const input = screen.getByPlaceholderText(placeholder);
    fireEvent.change(input, { target: { value: "Test search" } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(input).toHaveValue("Test search");
    });

    jest.useRealTimers();
  });

  it("handles manual search icon click", () => {
    renderComponent();
    const input = screen.getByPlaceholderText(placeholder);
    fireEvent.change(input, { target: { value: "Manual Search" } });

    const buttons = screen.getAllByRole("button");
    const searchButton = buttons[0];
    fireEvent.click(searchButton);
    expect(input).toHaveValue("Manual Search");
  });

  it("calls searchFormMethods on mount", () => {
    const mockSearchFormMethods = jest.fn();
    renderComponent({ searchFormMethods: mockSearchFormMethods });
    expect(mockSearchFormMethods).toHaveBeenCalled();
  });

  it("invokes searchFormMethods with dynamic form methods from DynamicForm", async () => {
    const searchFormMethodsMock = jest.fn();
    renderComponent({ searchFormMethods: searchFormMethodsMock });

    // there are two initial invocations from SmartSearch mount effects
    const initialCalls = searchFormMethodsMock.mock.calls.length;
    expect(initialCalls).toBeGreaterThanOrEqual(2);

    const filterButton = screen
      .getAllByRole("button")
      .find((btn) => btn.className.includes("filter-icon"));
    if (!filterButton) throw new Error("Filter button not found");

    fireEvent.click(filterButton); // expand to render DynamicForm mock which calls formMethods again

    await waitFor(() => {
      expect(searchFormMethodsMock.mock.calls.length).toBeGreaterThan(
        initialCalls
      );
    });
  });

  it("resets form and calls onReset when Reset button is clicked", () => {
    const onResetMock = jest.fn();
    renderComponent({
      selectedValues: { status: "Active" },
      onReset: onResetMock,
    });
    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "Test" } });
    const buttons = screen.getAllByRole("button");
    const filterButton = buttons[1];
    fireEvent.click(filterButton);
    const resetButton = screen.getByRole("button", {
      name: /reset/i,
    });
    fireEvent.click(resetButton);
    expect(onResetMock).toHaveBeenCalled();
  });

  it("toggles accordion when filter icon is clicked", async () => {
    renderComponent();

    // Initially DynamicForm (accordion content) should not be rendered
    expect(screen.queryByText("DynamicForm")).not.toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    const filterButton = buttons.find((btn) =>
      btn.className.includes("filter-icon")
    );
    if (!filterButton) throw new Error("Filter button not found");

    // Expand
    fireEvent.click(filterButton);
    await waitFor(() => {
      expect(screen.getByText("DynamicForm")).toBeInTheDocument();
    });

    // Collapse
    fireEvent.click(filterButton);
    await waitFor(() => {
      expect(screen.queryByText("DynamicForm")).not.toBeInTheDocument();
    });
  });

  it("formats selectedValues for object-with-label and array cases", () => {
    const config = [
      { key: "status", label: "Status", name: "status", type: "text" as any },
      {
        key: "statusArray",
        label: "Status Array",
        name: "statusArray",
        type: "text" as any,
      },
    ];
    const values = {
      status: { label: "Active" },
      statusArray: ["Active", "Inactive"],
    } as any;

    renderComponent({
      searchFormConfig: config as any,
      selectedValues: values,
    });

    const filters = screen.getByTestId("selected-filters");
    expect(filters).toHaveTextContent(/Status:\s?Active/);
    expect(filters).toHaveTextContent(/Status Array:\s?Active, Inactive/);
  });
});
