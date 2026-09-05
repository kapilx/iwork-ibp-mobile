import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SwitchField from "./SwitchField";
import { useForm } from "react-hook-form";
import "@testing-library/jest-dom";

const renderWithForm = (fieldProps: any, defaultValues = {}) => {
  const Wrapper = () => {
    const { control } = useForm({ defaultValues });

    return <SwitchField field={fieldProps} control={control} />;
  };

  return render(<Wrapper />);
};

describe("SwitchField", () => {
  it("renders the switch with label", () => {
    renderWithForm({
      name: "toggleFeature",
      label: "Enable Feature",
      type: "switch",
      componentProps: {},
    });

    expect(screen.getByLabelText("Enable Feature")).toBeInTheDocument();
  });

  it("switch is checked when default value is true", () => {
    renderWithForm(
      {
        name: "featureEnabled",
        label: "Feature Enabled",
        type: "switch",
        componentProps: {},
      },
      { featureEnabled: true }
    );

    const switchEl = screen.getByRole("checkbox");
    expect(switchEl).toBeChecked();
  });

  it("switch toggles value on click", () => {
    renderWithForm(
      {
        name: "featureToggle",
        label: "Toggle It",
        type: "switch",
        componentProps: {},
      },
      { featureToggle: false }
    );

    const switchEl = screen.getByRole("checkbox");
    expect(switchEl).not.toBeChecked();

    fireEvent.click(switchEl);
    expect(switchEl).toBeChecked(); // simulate controlled behavior
  });
});
