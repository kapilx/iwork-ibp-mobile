import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import RatingField from "./RatingField";

// 🔧 Default mock render props
let mockRenderProps: any = {
  name: "testRating",
  value: 0,
  onChange: jest.fn(),
  onBlur: jest.fn(),
  error: false,
  helperText: "",
  label: "Test Rating",
};

jest.mock("../utils", () => ({
  ControlledField: ({ render }: any) => render(mockRenderProps),
}));

describe("RatingField", () => {
  beforeEach(() => {
    mockRenderProps = {
      name: "testRating",
      value: 0,
      onChange: jest.fn(),
      onBlur: jest.fn(),
      error: false,
      helperText: "",
      label: "Test Rating",
    };
  });

  it("renders the Rating component", () => {
    render(
      <RatingField
        field={{ name: "testRating", label: "Test Rating" }}
        control={{}}
      />
    );

    const stars = screen.getAllByRole("radio");
    expect(stars.length).toBeGreaterThan(0);
  });

  it("calls onChange when a star is clicked", () => {
    render(
      <RatingField
        field={{ name: "testRating", label: "Test Rating" }}
        control={{}}
      />
    );

    const thirdStar = screen.getAllByRole("radio")[2]; // 3rd star (value = 3)
    fireEvent.click(thirdStar);
    expect(mockRenderProps.onChange).toHaveBeenCalled();
  });

  it("displays helper text on validation error", () => {
    mockRenderProps.error = true;
    mockRenderProps.helperText = "Rating is required";

    render(
      <RatingField
        field={{ name: "testRating", label: "Test Rating" }}
        control={{}}
      />
    );

    expect(screen.getByText("Rating is required")).toBeInTheDocument();
  });
});
