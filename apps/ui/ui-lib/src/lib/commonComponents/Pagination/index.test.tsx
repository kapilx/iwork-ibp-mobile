import React from "react";
import "@testing-library/jest-dom";
import Pagination from ".";
import { fireEvent, render, screen } from "@ui/ui-lib/utils/renderWithTheme";

describe("Pagination", () => {
  const setup = (props = {}) => {
    const defaultProps = {
      totalRecords: 50,
      currentPage: 2,
      onPageChange: jest.fn(),
      pageSize: 10,
      ...props,
    };

    render(<Pagination {...defaultProps} />);
    return defaultProps;
  };

  test("renders pagination with correct number of pages", () => {
    setup();

    // 50 records / 10 per page = 5 pages
    expect(
      screen.getByRole("button", { name: "Go to page 1" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go to page 5" })
    ).toBeInTheDocument();
  });

  test("highlights the current page", () => {
    setup({ currentPage: 3 });

    const currentPageButton = screen.getByRole("button", { name: "page 3" });
    expect(currentPageButton).toHaveAttribute("aria-current", "page");
  });

  test("calls onPageChange when page is clicked", () => {
    const { onPageChange } = setup();

    const pageButton = screen.getByRole("button", { name: "Go to page 4" });
    fireEvent.click(pageButton);

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  test("renders custom previous and next icons", () => {
    setup();

    // Check if image alt text is found
    expect(screen.getAllByAltText("Previous")[0]).toBeInTheDocument();
    expect(screen.getAllByAltText("Next")[0]).toBeInTheDocument();
  });
});
