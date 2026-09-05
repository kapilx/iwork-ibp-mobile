import { renderHook, act } from "@testing-library/react";
import { useApiSelectField } from "./useApiSelectField";
import useApi from "./useApi";
import { UseFormWatch } from "react-hook-form";
import { useSelector } from "react-redux";

jest.mock("../environment", () => ({
  environment: {
    VITE_API_URL: "http://localhost",
  },
}));

jest.mock("./useApi");
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

const mockUseApi = useApi as jest.MockedFunction<typeof useApi>;
const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

describe("useApiSelectField", () => {
  const mockDoFetch = jest.fn();
  const mockWatch: UseFormWatch<any> = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApi.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      doFetch: mockDoFetch,
    });
    mockUseSelector.mockReturnValue({});
  });

  it("fetches data when endpoint is a string", () => {
    const apiDependencies = { endPoint: "/api/endpoint" };

    renderHook(() =>
      useApiSelectField({
        apiDependencies,
        watch: mockWatch,
        fieldName: "testField",
      })
    );

    expect(mockDoFetch).toHaveBeenCalledWith("/api/endpoint", { method: "GET" });
  });

  it("fetches data when endpoint is a function and dependentField is provided", () => {
    mockWatch.mockReturnValue("dependentValue");
    const apiDependencies = {
      endPoint: (value: string) => `/api/endpoint/${value}`,
      dependentField: "dependentField",
    };

    renderHook(() =>
      useApiSelectField({
        apiDependencies,
        watch: mockWatch,
        fieldName: "testField",
      })
    );

    expect(mockDoFetch).toHaveBeenCalledWith("/api/endpoint/dependentValue", {
      method: "GET",
    });
  });

  it("does not fetch data if dependentField is not set in watch", () => {
    mockWatch.mockReturnValue(undefined);
    const apiDependencies = {
      endPoint: (value: string) => `/api/endpoint/${value}`,
      dependentField: "dependentField",
    };

    renderHook(() =>
      useApiSelectField({
        apiDependencies,
        watch: mockWatch,
        fieldName: "testField",
      })
    );

    expect(mockDoFetch).not.toHaveBeenCalled();
  });

  it("sets options using utilityFunction when provided", () => {
    const mockUtilityFunction = jest.fn().mockReturnValue([
      { label: "Option 1", value: 1 },
      { label: "Option 2", value: 2 },
    ]);
    const apiDependencies = {
      utilityFunction: mockUtilityFunction,
    };

    mockUseApi.mockReturnValue({
      data: { data: [] },
      loading: false,
      error: null,
      doFetch: mockDoFetch,
    });

    const { result } = renderHook(() =>
      useApiSelectField({
        apiDependencies,
        watch: mockWatch,
        fieldName: "testField",
      })
    );

    act(() => {
      result.current.options;
    });

    expect(mockUtilityFunction).toHaveBeenCalled();
    expect(result.current.options).toEqual([
      { label: "Option 1", value: 1 },
      { label: "Option 2", value: 2 },
    ]);
  });

  it("sets options for smart search when isSmartSearch is true", () => {
    const apiDependencies = { isSmartSearch: true };
    mockUseApi.mockReturnValue({
      data: {
        data: [
          { lookUpValue: "Option 1" },
          { lookUpValue: "Option 2" },
        ],
      },
      loading: false,
      error: null,
      doFetch: mockDoFetch,
    });

    const { result } = renderHook(() =>
      useApiSelectField({
        apiDependencies,
        watch: mockWatch,
        fieldName: "testField",
      })
    );

    expect(result.current.options).toEqual([
      { label: "Option 1", value: "Option 1" },
      { label: "Option 2", value: "Option 2" },
    ]);
  });

  it("sets options for default lookup when isSmartSearch is false", () => {
    const apiDependencies = { isSmartSearch: false };
    mockUseApi.mockReturnValue({
      data: {
        data: [
          { lookUpValue: "Option 1", id: 1 },
          { lookUpValue: "Option 2", id: 2 },
        ],
      },
      loading: false,
      error: null,
      doFetch: mockDoFetch,
    });

    const { result } = renderHook(() =>
      useApiSelectField({
        apiDependencies,
        watch: mockWatch,
        fieldName: "testField",
      })
    );

    expect(result.current.options).toEqual([
      { label: "Option 1", value: 1 },
      { label: "Option 2", value: 2 },
    ]);
  });

  it("handles utilityDependent changes", () => {
    mockWatch.mockReturnValue("utilityValue");
    const mockUtilityFunction = jest.fn().mockReturnValue([
      { label: "Option 1", value: 1 },
    ]);
    const apiDependencies = {
      utilityFunction: mockUtilityFunction,
      utilityDependent: "utilityDependent",
    };

    mockUseApi.mockReturnValue({
      data: { data: [] },
      loading: false,
      error: null,
      doFetch: mockDoFetch,
    });

    const { result } = renderHook(() =>
      useApiSelectField({
        apiDependencies,
        watch: mockWatch,
        fieldName: "testField",
      })
    );

    act(() => {
      result.current.options;
    });

    expect(mockUtilityFunction).toHaveBeenCalledWith(
      { data: [] },
      "utilityValue"
    );
    expect(result.current.options).toEqual([{ label: "Option 1", value: 1 }]);
  });
});