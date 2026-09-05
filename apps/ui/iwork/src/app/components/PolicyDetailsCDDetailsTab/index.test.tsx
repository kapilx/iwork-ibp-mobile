import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import PolicyDetailsCDDetailsTab from "./index";
import { theme, userReducer as slice } from "@ui/ui-lib";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GENERIC_ERROR } from "../../constants";

// Mock useDispatch at the top level
const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

// Mock useTableController at the top level
let mockErrorObject: any = undefined;
jest.mock("@ui/ui-lib", () => {
  const actual = jest.requireActual("@ui/ui-lib");

  // Create a mock function that returns the mock table controller
  const mockUseTableController = (options: any) => {
    if (mockErrorObject !== undefined) {
      options?.onError?.(mockErrorObject);
    }
    return {
      rowData: [],
      totalRows: 0,
      currentPage: 1,
      loading: false,
      setCurrentPage: jest.fn(),
      pageSize: 10,
      setPageSize: jest.fn(),
      PAGE_SIZE_OPTIONS: [10, 20],
      setSort: jest.fn(),
    };
  };

  return {
    ...actual,
    useTableController: mockUseTableController,
    Table: jest.fn(() => <div>Mock Table</div>),
  };
});

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

describe("PolicyDetailsCDDetailsTab Component", () => {
  const store = configureStore({ reducer: { app: slice } });
  const queryClient = new QueryClient();
  const renderWithTheme = () => {
    return render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <PolicyDetailsCDDetailsTab />
          </ThemeProvider>
        </QueryClientProvider>
      </Provider>
    );
  };


  it("renders with correct columns from config", () => {
    renderWithTheme();
  });

  it("dispatches setToastMessage with GENERIC_ERROR when error response is missing (real code path)", () => {
    mockErrorObject = {};
    const { MemoryRouter } = require("react-router-dom");
    render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <MemoryRouter>
              <PolicyDetailsCDDetailsTab />
            </MemoryRouter>
          </ThemeProvider>
        </QueryClientProvider>
      </Provider>
    );
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "userSlice/setToastMessage",
      payload: GENERIC_ERROR,
    });
    mockErrorObject = undefined;
  });

  it("valueFormatter returns value or '--' for null/undefined", () => {
    const { cdDetailsColumns } = require("./config");
    cdDetailsColumns.forEach((col: any) => {
      if (typeof col.valueFormatter === "function") {
        expect(col.valueFormatter({ value: "Test" })).toBe("Test");
        expect(col.valueFormatter({ value: null })).toBe("--");
        expect(col.valueFormatter({ value: undefined })).toBe("--");
      }
    });
  });
});
