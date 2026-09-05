import React from "react";
import { render, screen } from "@testing-library/react";
import PermissionInitializer from "./PermissionInitializer";

// Mocks
jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock("../redux/permissionSlice", () => ({
  fetchPermissions: jest.fn(),
  selectPermissions: jest.fn(),
}));

jest.mock("@mui/material", () => ({
  CircularProgress: () => <div data-testid="circular-progress" />,
}));
jest.mock("../styles", () => ({
  LoaderOverlay: (props: any) => (
    <div data-testid="permission-loader">{props.children}</div>
  ),
}));

describe("PermissionInitializer", () => {
  const DummyChild = () => <div data-testid="dummy-child">Loaded</div>;
  const useSelector = require("react-redux").useSelector;
  const { fetchPermissions } = require("../redux/permissionSlice");

  beforeEach(() => {
    jest.clearAllMocks();
    // reset sessionStorage mock
    const store: Record<string, string | null> = {};
    jest
      .spyOn(window.sessionStorage.__proto__, "getItem")
      .mockImplementation((key: string) => store[key] || null);
    jest
      .spyOn(window.sessionStorage.__proto__, "setItem")
      .mockImplementation((key: string, value: string) => {
        store[key] = value;
      });
  });

  it("shows loader when no user in sessionStorage", () => {
    useSelector.mockReturnValue(null); // permissions null
    render(
      <PermissionInitializer>
        <DummyChild />
      </PermissionInitializer>
    );
    expect(screen.getByTestId("permission-loader")).toBeTruthy();
    expect(screen.getByTestId("circular-progress")).toBeTruthy();
    expect(screen.queryByTestId("dummy-child")).toBeNull();
  });

  it("dispatches fetch and shows loader when user exists but permissions null", () => {
    sessionStorage.setItem("user", JSON.stringify({ id: 1 }));
    useSelector.mockReturnValue(null);
    render(
      <PermissionInitializer>
        <DummyChild />
      </PermissionInitializer>
    );
    expect(fetchPermissions).toHaveBeenCalled();
    expect(screen.getByTestId("permission-loader")).toBeTruthy();
  });

  it("renders children when permissions loaded and user present", () => {
    sessionStorage.setItem("user", JSON.stringify({ id: 1 }));
    useSelector.mockReturnValue(["perm1"]);
    render(
      <PermissionInitializer>
        <DummyChild />
      </PermissionInitializer>
    );
    expect(screen.getByTestId("dummy-child")).toBeTruthy();
    expect(screen.queryByTestId("permission-loader")).toBeNull();
  });
});