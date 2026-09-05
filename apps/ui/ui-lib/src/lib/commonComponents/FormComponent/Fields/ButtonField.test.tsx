import React from "react";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ButtonField from "./ButtonField";

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

describe("ButtonField", () => {
  // Mocks for required props not used in ButtonField
  const mockControl = {} as any;
  const mockWatch = jest.fn();
  const mockSetValue = jest.fn();

  const defaultField = {
    key: "submitBtn",
    name: "submitBtn",
    label: "Submit",
    type: "text" as const,
    componentProps: {},
  };

  it("renders the button with the correct label", () => {
    const { getByText } = render(
      <ButtonField
        field={defaultField}
        control={mockControl}
        watch={mockWatch}
        setValue={mockSetValue}
        onActionMap={{}}
      />
    );
    expect(getByText("Submit")).toBeInTheDocument();
  });

  it("calls field.onClick if it is a function", () => {
    const onClickMock = jest.fn();
    const field = { ...defaultField, onClick: onClickMock };
    const { getByText } = render(
      <ButtonField
        field={field}
        control={mockControl}
        watch={mockWatch}
        setValue={mockSetValue}
        onActionMap={{}}
      />
    );
    fireEvent.click(getByText("Submit"));
    expect(onClickMock).toHaveBeenCalled();
  });

  it("calls onActionMap handler if field.onClick is a string and exists in onActionMap", () => {
    const actionMock = jest.fn();
    const field = { ...defaultField, onClick: "customAction" };
    const { getByText } = render(
      <ButtonField
        field={field}
        control={mockControl}
        watch={mockWatch}
        setValue={mockSetValue}
        onActionMap={{ customAction: actionMock }}
      />
    );
    fireEvent.click(getByText("Submit"));
    expect(actionMock).toHaveBeenCalled();
  });

  it("warns if no valid onClick handler is found", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const field = { ...defaultField, onClick: "missingAction" };
    const { getByText } = render(
      <ButtonField
        field={field}
        control={mockControl}
        watch={mockWatch}
        setValue={mockSetValue}
        onActionMap={{}}
      />
    );
    fireEvent.click(getByText("Submit"));
    expect(warnSpy).toHaveBeenCalledWith(
      `No valid onClick handler found for field: ${field.name}`
    );
    warnSpy.mockRestore();
  });

  it("passes componentProps to Button", () => {
    const field = {
      ...defaultField,
      componentProps: { "data-testid": "my-btn", disabled: true },
    };
    const { getByTestId } = render(
      <ButtonField
        field={field}
        control={mockControl}
        watch={mockWatch}
        setValue={mockSetValue}
        onActionMap={{}}
      />
    );
    const btn = getByTestId("my-btn");
    expect(btn).toBeDisabled();
  });
});
