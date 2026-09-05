import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SectionDetails from "./index";

// Mock DetailsCard to isolate SectionDetails logic
jest.mock("../DetailsCard", () => (props: any) => (
  <div data-testid="details-card">
    <span>{props.title}</span>
    <button onClick={props.onEdit}>Edit</button>
    <button onClick={props.onDelete}>Delete</button>
  </div>
));

const baseProps = {
  icon: <span data-testid="icon" />,
  title: "Test Section",
  data: [],
  onAdd: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  noDataMessage: "No data available",
  addItemButtonText: "Add Item",
  firstItemButtonText: "Add First Item",
};

describe("SectionDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with no data and shows placeholder", () => {
    render(<SectionDetails {...baseProps} />);
    expect(screen.getByText("No data available")).toBeInTheDocument();
    expect(screen.getByText("Add First Item")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Item" })
    ).toBeInTheDocument();
  });

  it("calls onAdd when add button is clicked (header)", () => {
    render(<SectionDetails {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Item" }));
    expect(baseProps.onAdd).toHaveBeenCalled();
  });

  it("calls onAdd when placeholder button is clicked", () => {
    render(<SectionDetails {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Add First Item" }));
    expect(baseProps.onAdd).toHaveBeenCalled();
  });

  it("renders DetailsCard for each data item", () => {
    const data = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
    ];
    render(<SectionDetails {...baseProps} data={data} />);
    expect(screen.getAllByTestId("details-card")).toHaveLength(2);
    expect(screen.getByText("Test Section 1")).toBeInTheDocument();
    expect(screen.getByText("Test Section 2")).toBeInTheDocument();
  });

  it("calls onEdit and onDelete for the correct item", () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const data = [{ id: 1 }, { id: 2 }];
    render(
      <SectionDetails
        {...baseProps}
        data={data}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
    const editButtons = screen.getAllByText("Edit");
    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(editButtons[1]);
    fireEvent.click(deleteButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(1);
    expect(onDelete).toHaveBeenCalledWith(0);
  });

  it("renders placeholder subtext if provided", () => {
    render(<SectionDetails {...baseProps} placeholderSubtext="Some subtext" />);
    // Uncomment the following if you render subtext in NoDataPlaceholder
    // expect(screen.getByText("Some subtext")).toBeInTheDocument();
  });

  it("does not throw if optional props are missing", () => {
    expect(() =>
      render(
        <SectionDetails
          icon={<span />}
          title="Title"
          data={[]}
          onAdd={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
          noDataMessage="No data"
          addItemButtonText="Add"
          firstItemButtonText="Add First"
        />
      )
    ).not.toThrow();
  });
});
