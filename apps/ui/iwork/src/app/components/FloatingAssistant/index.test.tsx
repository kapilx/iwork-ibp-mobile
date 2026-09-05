import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "@mui/material/styles";
import FloatingAssistant from "./index";
import { theme } from "@ui/ui-lib";
import { SMART_ASSISTANT, SMARTASSISTANT_MENUITEMS } from "../../constants";
import { useNavigate } from "react-router-dom";

// Mock navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));
jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Mock smart icon import
jest.mock("../../assets/svgs/smart.svg", () => "smart-icon.svg");

const renderWithTheme = (component: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);

describe("FloatingAssistant Component", () => {
  let iconRef: React.RefObject<HTMLImageElement>;
  let cardRef: React.RefObject<HTMLDivElement>;

  beforeEach(() => {
    mockNavigate.mockClear();
    iconRef = React.createRef<HTMLImageElement>();
    cardRef = React.createRef<HTMLDivElement>();
  });

  it("should render the floating smart icon", () => {
    renderWithTheme(<FloatingAssistant iconRef={iconRef} cardRef={cardRef} />);
    const icon = screen.getByAltText("smart-icon");
    expect(icon).toBeInTheDocument();
  });

  it("should toggle assistant card on icon click", () => {
    renderWithTheme(<FloatingAssistant iconRef={iconRef} cardRef={cardRef} />);
    const icon = screen.getByAltText("smart-icon");
    fireEvent.click(icon);
    expect(screen.getByText(SMART_ASSISTANT)).toBeInTheDocument();
  });

  it("should hide assistant card on second icon click", () => {
    renderWithTheme(<FloatingAssistant iconRef={iconRef} cardRef={cardRef} />);
    const icon = screen.getByAltText("smart-icon");
    fireEvent.click(icon); // open
    fireEvent.click(icon); // close
    expect(screen.queryByText(SMART_ASSISTANT)).not.toBeInTheDocument();
  });

  it("should close assistant when clicked outside", () => {
    renderWithTheme(
      <>
        <FloatingAssistant iconRef={iconRef} cardRef={cardRef} />
        <div data-testid="outside">Outside</div>
      </>
    );
    const icon = screen.getByAltText("smart-icon");
    fireEvent.click(icon); // open
    expect(screen.getByText(SMART_ASSISTANT)).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId("outside")); // simulate outside click
    expect(screen.queryByText(SMART_ASSISTANT)).not.toBeInTheDocument();
  });

  it("should navigate to correct route on menu item click", () => {
    renderWithTheme(<FloatingAssistant iconRef={iconRef} cardRef={cardRef} />);
    fireEvent.click(screen.getByAltText("smart-icon"));

    const approvalItem = screen.getByText(
      SMARTASSISTANT_MENUITEMS.DO_I_HAVE_ANYTHING_TO_APPROVE_TODAY
    );
    fireEvent.click(approvalItem);

    const taskItem = screen.getByText(
      SMARTASSISTANT_MENUITEMS.WHAT_ARE_THE_TASKS_I_NEED_TO_WORK_ON_TODAY
    );
    fireEvent.click(taskItem);

    const knowledgeItem = screen.getByText(
      SMARTASSISTANT_MENUITEMS.WHERE_CAN_I_FIND_SALES_DOCUMENTS_AND_RESOURCES
    );
    fireEvent.click(knowledgeItem);

    const createCompanyItem = screen.getByText(
      SMARTASSISTANT_MENUITEMS.HELP_ME_TO_ADD_A_COMPANY_CONTACT_OPPORTUNITY
    );
    fireEvent.click(createCompanyItem);

    expect(mockNavigate).toHaveBeenNthCalledWith(1, "/engagements/approval", {
      state: { tab: "approval" },
    });

    expect(mockNavigate).toHaveBeenNthCalledWith(2, "/engagements/tasks", {
      state: { tab: "task" },
    });

    expect(mockNavigate).toHaveBeenNthCalledWith(3, "/knowledge-central");

    expect(mockNavigate).toHaveBeenNthCalledWith(4, "/create", {
      state: {
        pageTitle: "company",
        cta: "createCompany",
        originPath: "/companies",
      },
    });
  });

  it("should render menu items even when all are enabled", () => {
    renderWithTheme(<FloatingAssistant iconRef={iconRef} cardRef={cardRef} />);
    fireEvent.click(screen.getByAltText("smart-icon"));
    Object.values(SMARTASSISTANT_MENUITEMS).forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});
