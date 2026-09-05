import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useForm } from "react-hook-form";
import CheckboxField from "./CheckboxField";
import { FieldComponentProps } from "../types";

// ✅ Mock only MUI components — one clean mock
jest.mock("@mui/material", () => {
  const originalModule = jest.requireActual("@mui/material");
  return {
    ...originalModule,
    Checkbox: jest.fn(({ checked, onChange, ...props }) => (
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        {...props}
        data-testid="checkbox"
      />
    )),
    FormControl: jest.fn(({ children }) => (
      <div data-testid="form-control">{children}</div>
    )),
    FormControlLabel: jest.fn(({ control, label }) => (
      <label data-testid="form-control-label">
        {control}
        {label}
      </label>
    )),
    FormHelperText: jest.fn(({ children, ...props }) => (
      <div data-testid="form-helper-text" {...props}>
        {children}
      </div>
    )),
  };
});

// ✅ DO NOT mock ControlledField — we use the real one now

describe("CheckboxField", () => {
  const mockField: FieldComponentProps["field"] = {
    name: "testCheckbox",
    label: "Test Checkbox",
    rules: { required: { value: true, message: "This field is required" } },
  };

  const renderWithForm = (fieldProps = mockField) => {
    const Wrapper = () => {
      const {
        control,
        handleSubmit,
        formState: { errors },
      } = useForm({
        defaultValues: { testCheckbox: false },
        mode: "onSubmit",
      });

      return (
        <form onSubmit={handleSubmit(() => {})}>
          <CheckboxField field={fieldProps} control={control} />
          <button type="submit">Submit</button>
        </form>
      );
    };

    return render(<Wrapper />);
  };

  it("renders the checkbox field with label", () => {
    renderWithForm();
    expect(screen.getByTestId("form-control")).toBeInTheDocument();
    expect(screen.getByTestId("form-control-label")).toHaveTextContent("Test Checkbox");
    expect(screen.getByTestId("checkbox")).toBeInTheDocument();
  });

  it("handles checkbox toggle", () => {
    renderWithForm();
    const checkbox = screen.getByTestId("checkbox");

    // Initially unchecked
    expect(checkbox).not.toBeChecked();

    // Simulate checking the checkbox
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Simulate unchecking the checkbox
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("displays error message when validation fails", async () => {
    renderWithForm();
    fireEvent.click(screen.getByText("Submit"));

    expect(await screen.findByTestId("form-helper-text")).toHaveTextContent("This field is required");
  });
});
