import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import OpportunitySuccessContent from "./index";

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
  MODAL_CONTENT: "Test Opportunity Success Message",
}));

describe("OpportunitySuccessContent", () => {
  it("renders the Typography with MODAL_CONTENT", () => {
    render(<OpportunitySuccessContent />);
    expect(
      screen.getByText("Test Opportunity Success Message")
    ).toBeInTheDocument();
  });

});
