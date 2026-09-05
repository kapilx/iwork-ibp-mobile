import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import DetailsCard from "./index";

// Mock styled components and utils
jest.mock("./styles", () => ({
  DetailsStyledCard: (props: any) => (
    <div data-testid="styled-card">{props.children}</div>
  ),
  DetailsCardStyledCardContent: (props: any) => (
    <div data-testid="styled-card-content">{props.children}</div>
  ),
  StyledCardHeader: (props: any) => (
    <div data-testid="styled-card-header">
      {props.title}
      {props.action}
      {props.children}
    </div>
  ),
  StyledEditIcon: () => <button data-testid="edit-icon">Edit</button>,
}));

jest.mock("../../utils/richTextUtils", () => ({
  getTextFromHtml: (v: string) => v.replace(/<[^>]+>/g, ""),
}));

jest.mock("../../utils/DateFormat", () => ({
  formatDate: (v: string) => (v === "2023-01-01" ? "Jan 1, 2023" : v),
  isValidDate: (v: string) => v === "2023-01-01",
}));

describe("DetailsCard Component", () => {
  const baseData = {
    id: 1,
    name: "John Doe",
    remarks: "<b>Important</b>",
    date: "2023-01-01",
    IsPrimary: true,
  };
  const baseProps = {
    title: "Test Card",
    data: baseData,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  it("renders title and data except id", () => {
    render(<DetailsCard {...baseProps} />);
    expect(screen.getByText("Test Card")).toBeInTheDocument();
    expect(screen.getByText(/Name:/)).toBeInTheDocument();
    expect(screen.getByText(/Remarks:/)).toBeInTheDocument();
    expect(screen.getByText(/Date:/)).toBeInTheDocument();
    expect(screen.getByText(/IsPrimary:/)).toBeInTheDocument();
    expect(screen.queryByText(/Id:/i)).not.toBeInTheDocument();
  });

  it("formats remarks and date fields", () => {
    render(<DetailsCard {...baseProps} />);
    expect(screen.getByText("Important")).toBeInTheDocument();
    expect(screen.getByText("Jan 1, 2023")).toBeInTheDocument();
  });

  it("calls onEdit when edit icon is clicked", () => {
    render(<DetailsCard {...baseProps} />);
    const editBtn = screen.getByTestId("edit-icon");
    fireEvent.click(editBtn);
    expect(baseProps.onEdit).toHaveBeenCalled();
  });

it("renders boolean IsPrimary as string", () => {
  render(<DetailsCard {...baseProps} />);
  expect(screen.getByText(/IsPrimary:/)).toBeInTheDocument();
  expect(screen.getByText("true")).toBeInTheDocument();
});

it("renders false boolean IsPrimary correctly", () => {
  const propsWithFalse = {
    ...baseProps,
    data: { ...baseProps.data, IsPrimary: false },
  };
  render(<DetailsCard {...propsWithFalse} />);
  expect(screen.getByText(/IsPrimary:/)).toBeInTheDocument();
  expect(screen.getByText("false")).toBeInTheDocument();
});

  it("renders correctly with minimal data", () => {
    render(
      <DetailsCard
        title="Minimal"
        data={{ name: "A" }}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText("Minimal")).toBeInTheDocument();
    expect(screen.getByText(/Name:/)).toBeInTheDocument();
  });
});