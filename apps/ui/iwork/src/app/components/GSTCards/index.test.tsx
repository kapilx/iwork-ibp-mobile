import { render, screen } from "@ui/ui-lib/utils";
import GstSection from "./index";

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

describe("GstSection", () => {
  it("Field styled component is defined and renders without crashing", () => {
    const { Field } = require("./styles");
    expect(Field).toBeDefined();
    const { container } = render(<Field>Test Field</Field>);
    expect(container.textContent).toBe("Test Field");
  });

  it("CardWrapper styled component is defined and renders without crashing", () => {
    const { CardWrapper } = require("./styles");
    expect(CardWrapper).toBeDefined();
    const { container } = render(<CardWrapper>Test CardWrapper</CardWrapper>);
    expect(container.textContent).toBe("Test CardWrapper");
  });

  it("Card styled component is defined and renders without crashing", () => {
    const { Card } = require("./styles");
    expect(Card).toBeDefined();
    const { container } = render(<Card>Test Card</Card>);
    expect(container.textContent).toBe("Test Card");
  });
  it("renders nothing if data is empty", () => {
    const { container } = render(<GstSection data={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows NOT_AVAILABLE for missing fields", () => {
    const incompleteData = [{ gstNumber: "", gstCategory: {}, state: {} }];
    render(<GstSection data={incompleteData} />);
    expect(screen.getAllByText("N/A").length).toBeGreaterThan(0);
  });
});
