import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import '@testing-library/jest-dom'; // 👈 This is the key fix
import RadioField from "./RadioField";

// 👇 Mock ControlledField setup
let mockRenderProps: any = {
  name: "testRadio",
  value: "",
  onChange: jest.fn(),
  onBlur: jest.fn(),
  error: false,
  helperText: "",
  label: "Test Label",
};

jest.mock("../utils", () => ({
  ControlledField: ({ render }: any) => render(mockRenderProps),
}));

describe("RadioField", () => {
  const option = { label: "Yes", value: "yes" };

  beforeEach(() => {
    mockRenderProps = {
      name: "testRadio",
      value: "",
      onChange: jest.fn(),
      onBlur: jest.fn(),
      error: false,
      helperText: "",
      label: "Test Label",
    };
  });

  it("renders the radio field with label", () => {
    render(
      <RadioField
        field={{ name: "testRadio", label: "Test Label" }}
        control={{}}
        option={option}
      />
    );
    expect(screen.getByLabelText("Test Label")).toBeInTheDocument();
  });

  it("allows selecting the radio", () => {
    render(
      <RadioField
        field={{ name: "testRadio", label: "Test Label" }}
        control={{}}
        option={option}
      />
    );
    const radio = screen.getByLabelText("Test Label") as HTMLInputElement;
    fireEvent.click(radio);
    expect(radio.checked).toBe(true);
  });

  it("displays error message on validation failure", () => {
    // Set mock error and helper text
    mockRenderProps.error = true;
    mockRenderProps.helperText = "Required field";
  
    render(
      <RadioField
        field={{ name: "testRadio", label: "Test Label" }}
        control={{}}
        option={option}
      />
    );
  
    // Assert that the error message is displayed
    const errorMessage = screen.getByText("Required field");
    expect(errorMessage).toBeInTheDocument();
  });
});
