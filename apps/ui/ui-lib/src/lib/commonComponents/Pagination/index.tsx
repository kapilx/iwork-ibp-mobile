import { PaginationItem } from "@mui/material";
import { StyledPaginationIcon, StyledPagination } from "./styles";
import paginationIcon from "../../assets/svgs/pagination-left.svg";

interface PaginationProps {
  totalRecords: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  pageSize: number;
}

const Pagination: React.FC<PaginationProps> = ({
  totalRecords,
  currentPage,
  onPageChange,
  pageSize,
}) => {
  return (
    <StyledPagination
      count={Math.ceil(totalRecords / pageSize)}
      page={currentPage}
      onChange={(_, page) => onPageChange(page)}
      color="primary"
      data-testid={"pagination-nav-pages-info"}
      renderItem={(item) => (
        <PaginationItem
          components={{ previous: "div", next: "div" }}
          slots={{
            previous: () => <img src={paginationIcon} alt="Previous" />,
            next: () => (
              <StyledPaginationIcon src={paginationIcon} alt="Next" />
            ),
          }}
          {...item}
        />
      )}
    />
  );
};

export default Pagination;
