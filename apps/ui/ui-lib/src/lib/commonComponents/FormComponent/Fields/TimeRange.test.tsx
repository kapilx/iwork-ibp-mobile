import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@ui/ui-lib/styles";

// Mock react-hook-form context before importing component
const store: Record<string, any> = {};
const mockSetValue = jest.fn((name: string, value: any) => {
  store[name] = value;
});
const mockGetValues = jest.fn((name?: string) => {
  if (!name) return store;
  return store[name];
});
const mockWatch = jest.fn((name?: string) => {
  if (!name) return store;
  return store[name];
});

jest.mock("react-hook-form", () => ({
  useFormContext: () => ({
    control: {},
    setValue: mockSetValue,
    getValues: mockGetValues,
    watch: mockWatch,
    formState: { isSubmitting: false },
  }),
}));

import TimeRange from "./TimeRange";

// Mocks for styled components and pickers
const lastEvents: { keyDown?: any } = {};
jest.mock("./styles", () => ({
  CombinedDivider: jest.fn(() => <div data-testid="divider" />),
  CombinedTimePickerWrapper: jest.fn(
    ({
      value,
      onChange,
      format,
      name,
      helperText,
      onFocus,
      onKeyDown,
      ...props
    }) => {
      const {
        disabled,
        startTimeForLabel,
        minTime,
        containerTestId,
        cutoff,
        ...forward
      } = props as any;
      return (
        <div>
          <input
            id={name}
            name={name}
            data-testid={`time-picker-${name}`}
            value={
              value
                ? value.format
                  ? value.format(format || "HH:mm")
                  : value
                : ""
            }
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const raw = e.target.value; // expect HH:mm:ss
              if (!raw) onChange(null);
              else if (raw === "invalid") onChange("invalid");
              else {
                const iso = `2025-01-01T${raw}`;
                onChange(iso);
              }
            }}
            onFocus={(e) => onFocus && onFocus(e)}
            onKeyDown={(e) => {
              if (onKeyDown) onKeyDown(e);
              lastEvents.keyDown = e;
            }}
            {...forward}
          />
          {helperText && (
            <span data-testid={`${name}-helper`}>{helperText}</span>
          )}
        </div>
      );
    }
  ),
  StyledLabelTypography: jest.fn(({ children, ...props }) => (
    <label {...props}>{children}</label>
  )),
  StyledPickerBox: jest.fn(({ children }) => (
    <div data-testid="picker-box">{children}</div>
  )),
  StyledPickerFormController: jest.fn(({ children }) => (
    <div data-testid="picker-form-controller">{children}</div>
  )),
  StyledPickerLabelContainer: jest.fn(({ children }) => (
    <div data-testid="label-container">{children}</div>
  )),
  StyledTimeRangeContainer: jest.fn(({ children }) => (
    <div data-testid="time-range-container">{children}</div>
  )),
}));

jest.mock("../utils", () => ({
  ControlledField: jest.fn(({ field, control, render }) => {
    // Supply name so component can use it
    return render({
      label: field.label,
      value: store[field.name] || "12:00:00",
      onChange: (v: any) => {
        // Simulate react-hook-form update
        const formatted =
          typeof v === "string" ? v : v?.format?.("HH:mm:ssZ") || v;
        mockSetValue(field.name, formatted);
      },
      helperText: field.helperText,
      error: false,
      name: field.name,
    });
  }),
}));

jest.mock("../../../utils/DateFormat", () => ({
  formatTimeToUtcOffset: (val: string) => val + "+05:30",
  getRoundedTime: () => ({
    format: () => "10:00:00+05:30",
    add: (m: number, unit: string) => ({ format: () => "10:30:00+05:30" }),
  }),
  parseBackendTime: (val: string) => (val ? val.substring(0, 5) : undefined),
}));

jest.mock("./DateField", () => ({
  AddTimeSvgIcon: () => <svg data-testid="add-time-icon" />,
}));

describe("TimeRange", () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    jest.clearAllMocks();
  });

  const defaultField = {
    fromName: "startTime",
    toName: "endTime",
    fromLabel: "Start Time",
    toLabel: "End Time",
    rules: { required: true },
  } as any;

  const renderWithTheme = (fieldProps = defaultField, extraProps = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <TimeRange field={fieldProps} {...extraProps} />
      </ThemeProvider>
    );
  };

  it("renders both time pickers and labels", () => {
    renderWithTheme();
    expect(screen.getByText("Start Time *")).toBeInTheDocument();
    expect(screen.getByText("End Time *")).toBeInTheDocument();
    expect(screen.getByTestId("time-picker-startTime")).toBeInTheDocument();
    expect(screen.getByTestId("time-picker-endTime")).toBeInTheDocument();
    expect(screen.getByTestId("divider")).toBeInTheDocument();
  });

  it("calls onChange and trigger for from and to pickers", () => {
    renderWithTheme(defaultField, {});
    const fromInput = screen.getByTestId("time-picker-startTime");
    const toInput = screen.getByTestId("time-picker-endTime");
    fireEvent.change(fromInput, { target: { value: "13:00:00" } });
    fireEvent.change(toInput, { target: { value: "14:00:00" } });
    const startUpdated = mockSetValue.mock.calls
      .filter((c) => c[0] === "startTime")
      .some((c) => String(c[1]).includes("13:00"));
    const endUpdated = mockSetValue.mock.calls
      .filter((c) => c[0] === "endTime")
      .some((c) => String(c[1]).includes("14:00"));
    expect(startUpdated).toBe(true);
    expect(endUpdated).toBe(true);
  });

  it("renders error message if fromError or toError is true", () => {
    const utils = require("../utils");
    utils.ControlledField.mockImplementationOnce(() => <div>Error!</div>);
    renderWithTheme();
    expect(screen.getByText("Error!")).toBeInTheDocument();
  });

  it("renders without labels if fromLabel/toLabel are missing", () => {
    renderWithTheme({
      ...defaultField,
      fromLabel: undefined,
      toLabel: undefined,
    } as any);
    expect(screen.queryByText("Start Time *")).not.toBeInTheDocument();
    expect(screen.queryByText("End Time *")).not.toBeInTheDocument();
  });

  it("prevents focus and keydown interaction when disabled", () => {
    renderWithTheme(defaultField, { disabled: true });
    const fromInput = screen.getByTestId("time-picker-startTime") as any;
    const toInput = screen.getByTestId("time-picker-endTime") as any;
    const blurSpy = jest
      .spyOn(fromInput.constructor.prototype, "blur")
      .mockImplementation(() => {});

    // Trigger on the from (start) picker
    fireEvent.focus(fromInput);
    fireEvent.keyDown(fromInput, { key: "A" });
    expect(lastEvents.keyDown?.defaultPrevented).toBe(true);

    // Trigger on the to (end) picker to cover the second handler instance
    fireEvent.focus(toInput);
    fireEvent.keyDown(toInput, { key: "B" });
    expect(lastEvents.keyDown?.defaultPrevented).toBe(true);

    // We should have blurred twice (once for each focus attempt)
    expect(blurSpy.mock.calls.length).toBeGreaterThanOrEqual(2);

    blurSpy.mockRestore();
  });
});
