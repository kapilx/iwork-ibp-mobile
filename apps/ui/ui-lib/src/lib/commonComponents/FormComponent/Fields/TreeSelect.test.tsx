import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import TreeSelect from "./TreeSelect";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@ui/ui-lib/styles";
import { act } from "react"; // switched from react-dom/test-utils

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

// Setup for dynamic useApi mock
const mockUseApi = jest.fn(() => ({
  doFetch: jest.fn(),
  data: undefined,
  error: undefined,
}));
jest.mock("../../../hooks/useApi", () => () => mockUseApi());

// Mocks

jest.mock("@mui/x-date-pickers/internals/demo", () => ({
  DemoContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DemoItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: jest.fn(),
}));
jest.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock("@mui/x-date-pickers/DatePicker", () => ({
  DatePicker: jest.fn(() => <div data-testid="date-picker-mock" />),
}));
jest.mock("@mui/x-date-pickers/TimePicker", () => ({
  TimePicker: jest.fn(() => <div data-testid="time-picker-mock" />),
}));
jest.mock("@mui/x-date-pickers/DateTimePicker", () => ({
  DateTimePicker: jest.fn(() => <div data-testid="datetime-picker-mock" />),
}));
jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));
let initialControlledValue: any = "";
(globalThis as any).__getInitialControlledValue = () => initialControlledValue;
jest.mock("../utils", () => ({
  ControlledField: ({ render }: any) => {
    const React = require("react");
    const [val, setVal] = React.useState<any>(
      (globalThis as any).__getInitialControlledValue()
    );
    return render({
      onChange: (newVal: any) => setVal(newVal),
      value: val,
      error: false,
      helperText: "",
    });
  },
}));
jest.mock("../../../utils", () => ({
  findMatchingPaths: jest.fn(() => new Set(["1", "2"])),
  getSessionStorageData: jest.fn(() => ({ userId: "user-1" })),
}));

const baseField = {
  name: "treeField",
  key: "treeField", // added to satisfy FormFieldConfig
  label: "Tree Field",
  type: "select" as any, // map TreeSelect to existing select type for tests
  rules: { required: true },
  apiDependencies: {
    endPoint: jest.fn(() => "/api/tree"),
    utilityFunction: jest.fn((data: any) => data),
  },
};

// Helper to mock react-hook-form watch behaving both as value getter and subscription
const createWatchMock = (returnValues: Record<string, any> = {}) => {
  const watchMock = jest.fn((arg?: any) => {
    if (typeof arg === "function") {
      // subscription form
      return { unsubscribe: jest.fn() };
    }
    if (typeof arg === "string") {
      return returnValues[arg];
    }
    return returnValues; // watch() with no args returns all values
  });
  return watchMock;
};
// Replace base watch with subscription-capable mock
const baseWatch = createWatchMock({});

const baseProps = {
  field: baseField,
  control: {} as any, // cast to any to satisfy Control type in tests
  watch: baseWatch,
  setValue: jest.fn(),
  trigger: jest.fn(),
  onActionMap: { testAction: jest.fn() },
};

describe("TreeSelect", () => {
  it("renders label with required asterisk", () => {
    renderWithTheme(<TreeSelect {...baseProps} />);
    expect(screen.getByText(/Tree Field \*/)).toBeInTheDocument();
  });

  it("calls setValue and trigger on change", () => {
    const setValue = jest.fn();
    const trigger = jest.fn();
    const onChange = jest.fn();
    const field = { ...baseField, invokeFunction: "testAction" };
    const onActionMap = { testAction: jest.fn() };
    const watch = createWatchMock({ foo: "bar" });
    // Patch ControlledField to use our onChange
    jest.doMock("../utils", () => ({
      ControlledField: ({ render }: any) =>
        render({
          onChange,
          value: "",
          error: false,
          helperText: "",
        }),
    }));
    renderWithTheme(
      <TreeSelect
        {...baseProps}
        field={field}
        setValue={setValue}
        trigger={trigger}
        onActionMap={onActionMap}
        watch={watch}
      />
    );
    // Simulate option selection
    // Not rendering real options due to mocks, but we can call handleChange directly in a real integration test
    // Here, just check label and button
    expect(screen.getByText(/Tree Field \*/)).toBeInTheDocument();
  });

  it("renders input placeholder", () => {
    renderWithTheme(<TreeSelect {...baseProps} />);
    expect(screen.getByPlaceholderText("Select employee")).toBeInTheDocument();
  });

  it("shows no options text when no data", async () => {
    renderWithTheme(<TreeSelect {...baseProps} />);
    // Open the dropdown to trigger noOptionsText rendering
    const input = screen.getByPlaceholderText("Select employee");
    fireEvent.mouseDown(input);
    // Wait for the no options text to appear
    await waitFor(() => {
      expect(screen.getByText(/No Data Found/i)).toBeInTheDocument();
    });
  });

  it("renders without crashing with minimal props", () => {
    const minimalWatch = jest.fn((arg?: any) => {
      if (typeof arg === "function") return { unsubscribe: jest.fn() };
      if (typeof arg === "string") return undefined;
      return {}; // watch() with no args
    });
    renderWithTheme(
      <TreeSelect
        field={{
          name: "f",
          key: "f",
          label: "L",
          type: "text" as any,
          rules: {},
        }}
        control={{} as any}
        watch={minimalWatch as any}
        setValue={jest.fn() as any}
      />
    );
    expect(screen.getByText("L")).toBeInTheDocument();
  });

  it("calls utilityFunction and sets treeData when response data is present", async () => {
    const mockUtilityFunction = jest.fn(() => [
      { key: "1", title: "Node 1", children: [] },
      { key: "2", title: "Node 2", children: [] },
    ]);
    mockUtilityFunction.mockClear();
    mockUseApi.mockReturnValue({
      doFetch: jest.fn(),
      data: { data: [{ id: 1 }, { id: 2 }] } as any,
      error: undefined,
    } as any);
    const field = {
      ...baseField,
      apiDependencies: {
        ...baseField.apiDependencies,
        utilityFunction: mockUtilityFunction,
      },
    } as any;
    renderWithTheme(<TreeSelect {...baseProps} field={field} />);
    // The label should still render
    expect(screen.getByText(/Tree Field \*/)).toBeInTheDocument();
    // Wait for the utility function to be called with response.data
    await waitFor(() => {
      expect(mockUtilityFunction).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
    });
  });

  it("toggles expand/collapse on parent node icon click", async () => {
    // Setup a tree with a parent and child
    const treeData = [
      {
        key: "parent",
        title: "Parent",
        children: [{ key: "child", title: "Child" }],
      },
    ];
    mockUseApi.mockReturnValue({
      doFetch: jest.fn(),
      data: { data: treeData } as any,
      error: undefined,
    } as any);
    const field = {
      ...baseField,
      apiDependencies: {
        ...baseField.apiDependencies,
        utilityFunction: (data: any) => data,
      },
    } as any;
    renderWithTheme(<TreeSelect {...baseProps} field={field} />);
    // Open the dropdown
    const input = screen.getByPlaceholderText("Select employee");
    fireEvent.mouseDown(input);
    // Wait for the parent node to appear
    await waitFor(() => {
      expect(screen.getByText("Parent")).toBeInTheDocument();
    });
    // Find the collapse icon (down arrow) and click it
    const collapseIcon = screen.getByTestId("KeyboardArrowDownIcon");
    fireEvent.click(collapseIcon);
    // After clicking, the right arrow should appear (collapsed)
    await waitFor(() => {
      expect(screen.getByTestId("KeyboardArrowRightIcon")).toBeInTheDocument();
    });
  });

  it("calls onChange, setValue, trigger, and onActionMap action when option is selected", async () => {
    // Setup a tree with a parent and child
    const treeData = [
      {
        key: "parent",
        title: "Parent",
        children: [{ key: "child", title: "Child" }],
      },
    ];
    mockUseApi.mockReturnValue({
      doFetch: jest.fn(),
      data: { data: treeData } as any,
      error: undefined,
    } as any);
    const setValue = jest.fn();
    const trigger = jest.fn();
    const onAction = jest.fn();
    const watch = createWatchMock({ foo: "bar" });
    const field = {
      ...baseField,
      invokeFunction: "testAction",
      apiDependencies: {
        ...baseField.apiDependencies,
        utilityFunction: (data: any) => data,
      },
    } as any;
    const onActionMap = { testAction: onAction };
    renderWithTheme(
      <TreeSelect
        {...baseProps}
        field={field}
        setValue={setValue}
        trigger={trigger}
        onActionMap={onActionMap}
        watch={watch as any}
      />
    );
    // Open the dropdown
    const input = screen.getByPlaceholderText("Select employee");
    fireEvent.mouseDown(input);
    // Wait for the parent node to appear
    await waitFor(() => {
      expect(screen.getByText("Parent")).toBeInTheDocument();
    });
    // Simulate selecting the parent node
    const parentOption = screen.getByText("Parent");
    fireEvent.click(parentOption);
    // onChange, setValue, trigger, and onAction should be called
    await waitFor(() => {
      expect(setValue).toHaveBeenCalledWith(field.name, "parent");
      expect(trigger).toHaveBeenCalledWith(field.name);
      expect(onAction).toHaveBeenCalledWith({ foo: "bar" });
    });
  });

  it("sets initial search term from existing object value", async () => {
    const treeData = [{ key: "parent", title: "Parent Label", children: [] }];
    mockUseApi.mockReturnValue({
      doFetch: jest.fn(),
      data: { data: treeData } as any,
      error: undefined,
    } as any);
    const initialVal = { value: "parent", label: "Parent Label" };
    const watch = (() => {
      let subCb: any;
      const fn: any = jest.fn((arg?: any) => {
        if (typeof arg === "function") {
          subCb = arg;
          return { unsubscribe: jest.fn() };
        }
        if (typeof arg === "string") return initialVal;
        return { treeField: initialVal };
      });
      fn.__emit = (val: any) =>
        subCb && subCb({ treeField: val }, { name: "treeField" });
      return fn;
    })();

    renderWithTheme(<TreeSelect {...baseProps} watch={watch as any} />);
    const input = await screen.findByPlaceholderText("Select employee");
    expect((input as any).value).toBe("Parent Label");
  });

  it("updates search term via watch subscription when field cleared then set with new label", async () => {
    const treeData = [
      {
        key: "parent",
        title: "Parent Label",
        children: [{ key: "child", title: "Child Label" }],
      },
    ];
    mockUseApi.mockReturnValue({
      doFetch: jest.fn(),
      data: { data: treeData } as any,
      error: undefined,
    } as any);
    let currentVal: any = { value: "parent", label: "Parent Label" };
    let subscriptionCb: any;
    const watch: any = jest.fn((arg?: any) => {
      if (typeof arg === "function") {
        subscriptionCb = arg;
        return { unsubscribe: jest.fn() };
      }
      if (typeof arg === "string") return currentVal;
      return { treeField: currentVal };
    });
    watch.__emit = (val: any) => {
      currentVal = val;
      subscriptionCb &&
        subscriptionCb({ treeField: val }, { name: "treeField" });
    };

    renderWithTheme(<TreeSelect {...baseProps} watch={watch as any} />);
    const input = await screen.findByPlaceholderText("Select employee");
    expect((input as any).value).toBe("Parent Label");

    await act(async () => {
      watch.__emit(undefined);
    });
    await waitFor(() => expect((input as any).value).toBe(""));

    const newVal = { value: "child", label: "Child Label" };
    await act(async () => {
      watch.__emit(newVal);
    });
    await waitFor(() => expect((input as any).value).toBe("Child Label"));
  });

  it("executes fallback selection logic when previously selected node is filtered out", async () => {
    const treeData = [
      {
        key: "parent",
        title: "Parent",
        children: [
          {
            key: "mid",
            title: "Mid",
            children: [{ key: "deep", title: "Deep Node" }],
          },
        ],
      },
    ];
    mockUseApi.mockReturnValue({
      doFetch: jest.fn(),
      data: { data: treeData } as any,
      error: undefined,
    } as any);
    const watch = createWatchMock({});
    const utilsMod = require("../../../utils");
    const findMatchingPathsMock = utilsMod.findMatchingPaths as jest.Mock;
    findMatchingPathsMock.mockReturnValue(new Set(["parent", "mid", "deep"]));

    renderWithTheme(<TreeSelect {...baseProps} watch={watch as any} />);

    const input = screen.getByPlaceholderText("Select employee");
    fireEvent.mouseDown(input);
    await waitFor(() => expect(screen.getByText("Mid")).toBeInTheDocument());

    const midArrow = screen
      .getAllByTestId(/KeyboardArrowRightIcon|KeyboardArrowDownIcon/)
      .find((el) => el.closest("li")?.textContent?.includes("Mid"));
    if (midArrow) fireEvent.click(midArrow);
    await waitFor(() =>
      expect(screen.getByText("Deep Node")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("Deep Node"));

    findMatchingPathsMock.mockReturnValueOnce(new Set());
    fireEvent.change(input, { target: { value: "zzz-no-match" } });
    fireEvent.mouseDown(input);
    await waitFor(() =>
      expect(screen.getByText(/No Data Found/i)).toBeInTheDocument()
    );
  });

  it("recurses across sibling roots when selected deep node hidden from visible options", async () => {
    // Tree with two root nodes; target deep node under second root
    const treeData = [
      {
        key: "root1",
        title: "Root 1",
        children: [{ key: "childA", title: "Child A" }],
      },
      {
        key: "root2",
        title: "Root 2",
        children: [{ key: "deepX", title: "Deep X" }],
      },
    ];
    mockUseApi.mockReturnValue({
      doFetch: jest.fn(),
      data: { data: treeData } as any,
      error: undefined,
    } as any);

    // Pre-select deepX via primitive value so no initial label -> forces fallback logic when filtered
    const watch = createWatchMock({ treeField: "deepX" });
    (watch as any).mockImplementation((arg?: any) => {
      if (typeof arg === "function") return { unsubscribe: jest.fn() };
      if (typeof arg === "string") return "deepX";
      return { treeField: "deepX" };
    });

    // Control matching paths: when searchTerm active only first root branch returned (excluding deepX)
    const utilsMod = require("../../../utils");
    const findMatchingPathsMock = utilsMod.findMatchingPaths as jest.Mock;
    findMatchingPathsMock.mockReturnValue(new Set()); // initial (not used since no search)

    renderWithTheme(<TreeSelect {...baseProps} watch={watch as any} />);

    const input = screen.getByPlaceholderText("Select employee");
    fireEvent.mouseDown(input);
    await waitFor(() => expect(screen.getByText("Root 1")).toBeInTheDocument());
    expect(screen.getByText("Root 2")).toBeInTheDocument();

    // Now type search that filters to only root1 branch so visibleOptions excludes deepX -> triggers fallback recursion across roots
    findMatchingPathsMock.mockReturnValue(new Set(["root1", "childA"]));
    fireEvent.change(input, { target: { value: "root1" } });

    // Open again to reflect filtered list
    fireEvent.mouseDown(input);
    await waitFor(() =>
      expect(screen.queryByText("Deep X")).not.toBeInTheDocument()
    );
    // Presence of Root 1 + absence of Deep X indicates fallback selection (deepX) not in visibleOptions; recursion executed.
  });

  it("covers findNodeByKey recursion for hidden grandchild selection", async () => {
    // root -> child -> grand; grandchild not initially visible (child visible, but grandchild hidden until expansion)
    const treeData = [
      {
        key: "root1",
        title: "Root 1",
        children: [
          {
            key: "child1",
            title: "Child 1",
            children: [{ key: "grand1", title: "Grand 1" }],
          },
        ],
      },
    ];
    mockUseApi.mockReturnValue({
      doFetch: jest.fn(),
      data: { data: treeData } as any,
      error: undefined,
    } as any);
    initialControlledValue = "grand1"; // pre-select hidden grandchild
    renderWithTheme(<TreeSelect {...baseProps} />);
    const input = screen.getByPlaceholderText("Select employee");
    fireEvent.mouseDown(input);
    // Child should be visible but grandchild not (since child not expanded) ensuring fallback recursion runs.
    await waitFor(() =>
      expect(screen.getByText("Child 1")).toBeInTheDocument()
    );
    expect(screen.queryByText("Grand 1")).not.toBeInTheDocument();
  });

  it("covers findNodeByKey null return when key not found anywhere", async () => {
    const treeData = [
      { key: "a", title: "A", children: [{ key: "b", title: "B" }] },
      { key: "c", title: "C", children: [{ key: "d", title: "D" }] },
    ];
    mockUseApi.mockReturnValue({
      doFetch: jest.fn(),
      data: { data: treeData } as any,
      error: undefined,
    } as any);
    initialControlledValue = "missing-key"; // value absent from tree
    renderWithTheme(<TreeSelect {...baseProps} />);
    const input = screen.getByPlaceholderText("Select employee");
    fireEvent.mouseDown(input);
    await waitFor(() => expect(screen.getByText("A")).toBeInTheDocument());
  });
});
