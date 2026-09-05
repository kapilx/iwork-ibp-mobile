import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import Rating from "./index";

// Capture props to inspect them in tests
const ratingProps: Record<string, any> = {};

jest.mock("./styles", () => ({
  StyledRating: (props: any) => {
    Object.assign(ratingProps, props);
    return <div data-testid="styled-rating" />;
  },
}));

describe("Rating Component", () => {
  beforeEach(() => {
    // Reset captured props before each test
    for (const key in ratingProps) {
      delete ratingProps[key];
    }
  });

  it("renders with value (controlled)", () => {
    render(<Rating value={3} max={5} readOnly />);
    const rating = screen.getByTestId("styled-rating");
    expect(rating).toBeInTheDocument();
    expect(ratingProps.value).toBe(3);
    expect(ratingProps.max).toBe(5);
    expect(ratingProps.readOnly).toBe(true);
  });

  it("renders with defaultValue (uncontrolled)", () => {
    render(<Rating defaultValue={2} max={5} />);
    const rating = screen.getByTestId("styled-rating");
    expect(rating).toBeInTheDocument();
  });

  it("passes custom className and starSize", () => {
    render(<Rating value={4} className="custom-class" starSize={32} />);
    expect(ratingProps.className).toBe("custom-class");
    expect(ratingProps.starSize).toBe(32);
  });

  it("throws error if neither value nor defaultValue is provided", () => {
    expect(() => render(<Rating max={5} />)).toThrow(
      "Either 'value' or 'defaultValue' is required for Rating component."
    );
  });

  it("passes other props (max, precision, size)", () => {
    render(
      <Rating value={2.5} max={10} precision={0.5} size="large" readOnly />
    );
    expect(ratingProps.value).toBe(2.5);
    expect(ratingProps.max).toBe(10);
    expect(ratingProps.precision).toBe(0.5);
    expect(ratingProps.size).toBe("large");
  });

  it("handles edge case: missing props except value", () => {
    render(<Rating value={1} />);
    expect(ratingProps.value).toBe(1);
  });

  it("uses default starSize when not provided", () => {
    render(<Rating value={2} />);
    expect(ratingProps.starSize).toBe(24);
  });
});
