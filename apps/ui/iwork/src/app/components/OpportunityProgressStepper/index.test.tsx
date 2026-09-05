import '@testing-library/jest-dom';
import { render, screen } from "@testing-library/react";
import OpportunityCard from "./index";
import { OpportunityHeaderDetails } from "./opportunityCardTypes";

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));
jest.mock("./OpportunityStepperBreadCrumb/index.js", () => () => (
  <div data-testid="breadcrumbs" />
));
jest.mock(
  "./OpportunityLineProgress/index.js",
  () =>
    ({ progress, startDate, endDate }: any) =>
      (
        <div data-testid="progress-bar">
          {progress}-{startDate}-{endDate}
        </div>
      )
);
jest.mock("./OpportunityProgessHeader", () => (props: any) => (
  <div data-testid="progress-header" {...props} />
));
jest.mock(
  "../../pages/OpportunityActivities/Constants/activityConstants",
  () => ({
    useTransformedActivities: jest.fn(),
  })
);

const mockOpportunityDetails: OpportunityHeaderDetails = {
  id: "1",
  name: "Test Opportunity",
} as any;

describe("OpportunityCard", () => {
  const useTransformedActivities =
    require("../../pages/OpportunityActivities/Constants/activityConstants").useTransformedActivities;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state", () => {
    useTransformedActivities.mockReturnValue({
      transformedActivities: [],
      isLoading: true,
    });
    render(
      <OpportunityCard
        opportunityDetails={mockOpportunityDetails}
        breadCumbSep={0}
        setBreadCumbStep={jest.fn()}
        setSubmittedBreadCumb={jest.fn()}
      />
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders OpportunityCard with progress bar and breadcrumbs", () => {
    useTransformedActivities.mockReturnValue({
      transformedActivities: [
        { activityStatus: "OPEN", title: "BD_PLANNING", isPlanned: "PLANNED" },
        {
          activityStatus: "CLOSED",
          title: "ISG_PLANNING",
          isPlanned: "PLANNED",
        },
      ],
      isLoading: false,
    });
    render(
      <OpportunityCard
        opportunityDetails={mockOpportunityDetails}
        breadCumbSep={0}
        setBreadCumbStep={jest.fn()}
        setSubmittedBreadCumb={jest.fn()}
      />
    );
    expect(screen.getByTestId("progress-header")).toBeInTheDocument();
    expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
  });

});
