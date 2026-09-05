import {
  Divider,
  NestedDynamicButtonsContainer as ButtonsContainer,
  StyledFormButtonsContainer,
} from "./styles";
import "@testing-library/jest-dom";
import React, { createRef } from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import NestedDynamicForm, {
  NestedGroupedDataCollectionHandle,
  normalizeApiDataForResetting,
  evaluateCondition,
} from "./index";
import { theme } from "@ui/ui-lib/styles";

// Track form method instances for validateSection testing
const mockFormMethodInstances: any[] = [];
beforeEach(() => {
  mockFormMethodInstances.length = 0;
});

// Mocks for dependencies
jest.mock("../FormComponent", () => ({
  __esModule: true,
  default: (props: any) => {
    const { formConfig, formMethods } = props;
    if (formMethods) {
      const methodsObj = {
        getValues: () => ({ name: "Test" }),
        watch: jest.fn(), // keep as simple mock without side effects
        reset: jest.fn(),
        trigger: jest.fn(() => true),
        formState: { errors: {} },
      };
      formMethods(methodsObj);
      mockFormMethodInstances.push(methodsObj);
    }
    return (
      <div data-testid="dynamic-form">
        {formConfig.map((f: any) => (
          <input
            key={f.name}
            name={f.name}
            defaultValue={f.defaultValue || ""}
            placeholder={f.label || f.name}
            aria-label={f.label || f.name}
            disabled={
              typeof props.disableAllFields === "string"
                ? props.disableAllFields === "true"
                : !!props.disableAllFields
            }
          />
        ))}
      </div>
    );
  },
}));

let mockSectionTriggerResult = true;
let mockAttachImperativeHandle = true;
jest.mock("../MultipleSections", () => {
  const React = require("react");
  return React.forwardRef((props: any, ref: any) => {
    if (mockAttachImperativeHandle) {
      React.useImperativeHandle(ref, () => ({
        getValues: () => [{ name: "Test" }],
        watch: () => ({ name: "Test" }),
        trigger: jest.fn(() => mockSectionTriggerResult),
        reset: jest.fn(),
      }));
    }
    return React.createElement("div", { "data-testid": "multiple-section" });
  });
});

jest.mock("../Button/index", () => (props: any) => (
  <button {...props}>{props.children}</button>
));

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe("NestedDynamicForm", () => {
  const singleFormConfig = [
    {
      key: "single",
      title: "Single Group",
      config: [
        {
          key: "field1",
          name: "field1",
          type: "text" as const,
          label: "Field 1",
        },
      ],
    },
  ] as any;

  const multipleFormConfig = [
    {
      key: "multi",
      title: "Multiple Group",
      config: [
        {
          key: "fieldX",
          name: "fieldX",
          type: "text" as const,
          label: "Field X",
        },
      ],
      isMultiple: true,
    },
  ] as any;

  it("renders single form group correctly", () => {
    renderWithTheme(<NestedDynamicForm config={singleFormConfig as any} />);
    expect(screen.getByText("Single Group")).toBeInTheDocument();
    expect(screen.getByTestId("dynamic-form")).toBeInTheDocument();
  });

  it("renders multiple section group", () => {
    renderWithTheme(<NestedDynamicForm config={multipleFormConfig as any} />);
    expect(screen.getByTestId("multiple-section")).toBeInTheDocument();
  });

  it("exposes imperative methods correctly", async () => {
    const ref = createRef<NestedGroupedDataCollectionHandle>();
    const config = [...singleFormConfig, ...multipleFormConfig];
    renderWithTheme(<NestedDynamicForm config={config as any} ref={ref} />);
    await waitFor(() => expect(ref.current?.isMounted).toBe(true));
    act(() => {
      ref.current?.resetForms({
        single: { field1: "Test" },
        multi: [{ fieldX: "Val" }],
      });
    });
    const values = ref.current?.getValues?.();
    expect(values?.single).toBeDefined();
    expect(values?.multi).toEqual([{ name: "Test" }]);
    const result = await ref.current?.submitAll?.();
    expect(result?.isAllValid).toBe(true);
    expect(result?.result.multi).toEqual([{ name: "Test" }]);
  });

  it("submitAll skips validation/collection if section is hidden (showSection=false)", async () => {
    // Use correct FormFieldType for config
    type FormFieldType =
      | "text"
      | "number"
      | "select"
      | "checkbox"
      | "radio"
      | "date";
    const config = [
      {
        key: "hiddenSection",
        title: "Hidden Section",
        config: [
          {
            key: "fieldA",
            name: "fieldA",
            type: "text" as FormFieldType,
            label: "Field A",
          },
        ],
        showSection: "false", // always hidden
        isMultiple: false,
      },
      {
        key: "visibleSection",
        title: "Visible Section",
        config: [
          {
            key: "fieldB",
            name: "fieldB",
            type: "text" as FormFieldType,
            label: "Field B",
          },
        ],
        isMultiple: false,
      },
    ];
    const ref = createRef<NestedGroupedDataCollectionHandle>();
    renderWithTheme(<NestedDynamicForm config={config as any} ref={ref} />);
    await waitFor(() => expect(ref.current?.isMounted).toBe(true));
    const result = await ref.current?.submitAll?.();
    // hiddenSection should be skipped and return {}
    expect(result?.result.hiddenSection).toEqual({});
    // visibleSection should be present
    expect(result?.result.visibleSection).toBeDefined();
  });

  it("calls onActionMap or action.onClick when renderActions are clicked", async () => {
    const onActionMap = {
      testAction: jest.fn(),
    };
    const actionFn = jest.fn();
    const config = [
      {
        key: "actionSection",
        title: "Action Section",
        config: [
          {
            key: "fieldA",
            name: "fieldA",
            type: "text" as const,
            label: "Field A",
          },
        ],
        renderActions: [
          { text: "Action1", onClick: "testAction", variant: "imageAndText" },
          {
            text: "Action2",
            onClick: actionFn,
            key: "action2",
            variant: "imageAndText",
          },
        ],
      },
    ];
    renderWithTheme(
      <NestedDynamicForm config={config as any} onActionMap={onActionMap} />
    );
    // Find and click both actions
    const action1 = screen.getAllByText("Action1")[0];
    const action2 = screen.getAllByText("Action2")[0];
    act(() => {
      fireEvent.click(action1);
      fireEvent.click(action2);
    });
    expect(onActionMap.testAction).toHaveBeenCalled();
    expect(actionFn).toHaveBeenCalledWith("action2");
  });

  it("submitAll returns empty array for multiple section if ref is missing", async () => {
    // Simulate config with isMultiple and no MultipleSections ref
    const config = [
      {
        key: "multiMissingRef",
        title: "Multi Missing Ref",
        config: [
          {
            key: "fieldX",
            name: "fieldX",
            type: "text" as const,
            label: "Field X",
          },
        ],
        isMultiple: true,
      },
    ];
    // Patch the mock to not attach a ref for this test
    mockAttachImperativeHandle = false;
    const ref = createRef<NestedGroupedDataCollectionHandle>();
    renderWithTheme(<NestedDynamicForm config={config as any} ref={ref} />);
    await waitFor(() => expect(ref.current?.isMounted).toBe(true));
    const result = await ref.current?.submitAll?.();
    expect(result?.result.multiMissingRef).toEqual([]);
    mockAttachImperativeHandle = true;
  });

  it("submitAll falls back to showSection=true and logs warning if showSection throws", async () => {
    const config = [
      {
        key: "errorSection",
        title: "Error Section",
        config: [
          {
            key: "fieldA",
            name: "fieldA",
            type: "text" as const,
            label: "Field A",
          },
        ],
        showSection: "throw new Error('bad expr')", // will throw
        isMultiple: false,
      },
    ];
    const ref = createRef<NestedGroupedDataCollectionHandle>();
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    renderWithTheme(<NestedDynamicForm config={config as any} ref={ref} />);
    await waitFor(() => expect(ref.current?.isMounted).toBe(true));
    const result = await ref.current?.submitAll?.();
    expect(result?.result.errorSection).toBeDefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Condition evaluation failed:"),
      "throw new Error('bad expr')",
      expect.any(SyntaxError)
    );
    warnSpy.mockRestore();
  });

  it("Divider renders with correct styles from theme", () => {
    // Use ThemeProvider to inject theme
    const customTheme = {
      ...theme,
      palette: {
        ...theme.palette,
        background: {
          ...theme.palette.background,
          divider: "#123456",
        },
      },
    };
    const { container } = render(
      <ThemeProvider theme={customTheme}>
        <Divider data-testid="divider" />
      </ThemeProvider>
    );
    const div = screen.getByTestId("divider") as HTMLElement;
    expect(div).toHaveStyle({
      width: "100%",
      height: "1px",
      backgroundColor: "#123456",
    });
  });

  it("falls back to showSection=true and logs warning if showSection evaluation throws", async () => {
    const config = [
      {
        key: "errorSection",
        title: "Error Section",
        config: [
          {
            key: "fieldA",
            name: "fieldA",
            type: "text" as const,
            label: "Field A",
          },
        ],
        showSection: "throw new Error('bad expr')", // will throw
        isMultiple: false,
      },
    ];
    const ref = createRef<NestedGroupedDataCollectionHandle>();
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    renderWithTheme(<NestedDynamicForm config={config as any} ref={ref} />);
    await waitFor(() => expect(ref.current?.isMounted).toBe(true));
    const result = await ref.current?.submitAll?.();
    expect(result?.result.errorSection).toBeDefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Condition evaluation failed:"),
      "throw new Error('bad expr')",
      expect.any(SyntaxError)
    );
    warnSpy.mockRestore();
  });

  it("renders multiple section even if showSection evaluation throws, and logs warning", () => {
    const config = [
      {
        key: "multiError",
        title: "Multi Error",
        config: [
          {
            key: "fieldA",
            name: "fieldA",
            type: "text" as const,
            label: "Field A",
          },
        ],
        isMultiple: true,
        showSection: "throw new Error('bad expr')", // will throw
      },
    ];
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    renderWithTheme(<NestedDynamicForm config={config as any} />);
    // Section should still be rendered (fallback to true)
    expect(screen.getByTestId("multiple-section")).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Condition evaluation failed:"),
      "throw new Error('bad expr')",
      expect.any(SyntaxError)
    );
    warnSpy.mockRestore();
  });

  it("renders the form buttons section when isButtons is true", () => {
    const config = [
      {
        key: "actions",
        isButtons: true,
        config: [
          { label: "Save", componentProps: { "data-testid": "save-btn" } },
          { label: "Cancel", componentProps: { "data-testid": "cancel-btn" } },
        ],
      },
    ];
    const { getByText } = renderWithTheme(
      <NestedDynamicForm config={config as any} />
    );
    expect(getByText("Save")).toBeInTheDocument();
    expect(getByText("Cancel")).toBeInTheDocument();
  });

  it("disables form group when disableAllFields string expression evaluates to true", () => {
    const config = [
      {
        key: "disabledGroup",
        title: "Disabled Group",
        config: [
          { key: "field1", name: "field1", type: "text", label: "Field 1" },
        ],
        disableAllFields: "true", // always disables
      },
    ];
    renderWithTheme(<NestedDynamicForm config={config as any} />);
    const input = (screen.getByTestId("dynamic-form") as any).querySelector(
      'input[name="field1"]'
    );
    expect(input).toBeDisabled();
  });

  it("validateSection returns true when all sections valid and false when any invalid", async () => {
    const ref = createRef<NestedGroupedDataCollectionHandle>();
    const config = [
      {
        key: "group1",
        title: "Group 1",
        config: [
          {
            key: "field1",
            name: "field1",
            type: "text" as const,
            label: "Field 1",
          },
        ],
      },
      {
        key: "group2",
        title: "Group 2",
        config: [
          {
            key: "field2",
            name: "field2",
            type: "text" as const,
            label: "Field 2",
          },
        ],
      },
    ];
    renderWithTheme(<NestedDynamicForm config={config as any} ref={ref} />);
    await waitFor(() => expect(ref.current?.isMounted).toBe(true));
    expect(mockFormMethodInstances.length).toBeGreaterThanOrEqual(2);
    const getLatestPair = () => mockFormMethodInstances.slice(-2); // last two correspond to latest render of group1 & group2
    let [g1, g2] = getLatestPair();
    // Ensure both valid initially
    g1.trigger = jest.fn(() => true);
    g2.trigger = jest.fn(() => true);
    const firstPass = await ref.current!.validateSection!(["group1", "group2"]);
    expect(firstPass).toBe(true);
    // After potential internal re-render fetch latest again
    [g1, g2] = getLatestPair();
    g1.trigger = jest.fn(() => false); // make group1 invalid
    g2.trigger = jest.fn(() => true);
    const secondPass = await ref.current!.validateSection!([
      "group1",
      "group2",
    ]);
    expect(secondPass).toBe(false);
  });
});

describe("normalizeApiDataForResetting", () => {
  it("returns same object if no arrays", () => {
    const input = { a: 1, b: "test" };
    expect(normalizeApiDataForResetting(input)).toEqual({ a: 1, b: "test" });
  });
  it("replaces empty arrays with [{}]", () => {
    const input = { a: [], b: 2 };
    expect(normalizeApiDataForResetting(input)).toEqual({ a: [{}], b: 2 });
  });
  it("keeps non-empty arrays as is", () => {
    const input = { a: [{ x: 1 }], b: 3 };
    expect(normalizeApiDataForResetting(input)).toEqual({
      a: [{ x: 1 }],
      b: 3,
    });
  });
});

describe("evaluateCondition", () => {
  it("returns true for a valid expression", () => {
    expect(evaluateCondition("a === 1", { a: 1 })).toBe(true);
  });
  it("returns false for a valid expression that is false", () => {
    expect(evaluateCondition("a === 2", { a: 1 })).toBe(false);
  });
  it("returns true if evaluation throws (invalid syntax)", () => {
    expect(evaluateCondition("invalid syntax", { a: 1 })).toBe(true);
  });
});

describe("ButtonsContainer and StyledFormButtonsContainer", () => {
  it("ButtonsContainer renders with correct flex styles from theme", () => {
    const customTheme = {
      ...theme,
      spacing: (factor: number) => `${factor * 8}px`,
    };
    const { getByTestId } = render(
      <ThemeProvider theme={customTheme}>
        <ButtonsContainer data-testid="buttons-container">
          <button>Btn1</button>
          <button>Btn2</button>
        </ButtonsContainer>
      </ThemeProvider>
    );
    const container = getByTestId("buttons-container");
    expect(container).toHaveStyle({
      display: "flex",
      gap: "16px",
      justifyContent: "flex-end",
      alignItems: "center",
    });
  });

  it("StyledFormButtonsContainer renders with correct column flex styles from theme", () => {
    const customTheme = {
      ...theme,
      spacing: (factor: number) => `${factor * 8}px`,
    };
    const { getByTestId } = render(
      <ThemeProvider theme={customTheme}>
        <StyledFormButtonsContainer data-testid="form-buttons-container">
          <div>Child1</div>
          <div>Child2</div>
        </StyledFormButtonsContainer>
      </ThemeProvider>
    );
    const container = getByTestId("form-buttons-container");
    expect(container).toHaveStyle({
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    });
  });
});

describe("Form buttons section rendering", () => {
  it("renders StyledFormButtonsContainer with Divider and ButtonsContainer containing Button labels", () => {
    const customTheme = {
      ...theme,
      spacing: (factor: number) => `${factor * 8}px`,
      palette: {
        ...theme.palette,
        background: {
          ...theme.palette.background,
          divider: "#abcdef",
        },
      },
    };
    const actions = [
      { label: "Save", componentProps: { "data-testid": "save-btn" } },
      { label: "Cancel", componentProps: { "data-testid": "cancel-btn" } },
    ];
    const { getByTestId, getByText } = render(
      <ThemeProvider theme={customTheme}>
        <StyledFormButtonsContainer data-testid="form-buttons-section">
          <Divider data-testid="divider" />
          <ButtonsContainer data-testid="buttons-container">
            {actions.map((action, i) => (
              <button key={i} {...action.componentProps}>
                {action.label}
              </button>
            ))}
          </ButtonsContainer>
        </StyledFormButtonsContainer>
      </ThemeProvider>
    );
    const section = getByTestId("form-buttons-section");
    const divider = getByTestId("divider");
    const container = getByTestId("buttons-container");
    expect(section).toBeInTheDocument();
    expect(divider).toBeInTheDocument();
    expect(container).toBeInTheDocument();
    expect(getByText("Save")).toBeInTheDocument();
    expect(getByText("Cancel")).toBeInTheDocument();
    expect(container).toHaveStyle({
      display: "flex",
      gap: "16px",
      justifyContent: "flex-end",
      alignItems: "center",
    });
    expect(section).toHaveStyle({
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    });
    expect(divider).toHaveStyle({
      width: "100%",
      height: "1px",
      backgroundColor: "#abcdef",
    });
  });
});
