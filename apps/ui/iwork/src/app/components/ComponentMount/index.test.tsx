import React from "react";
import { render, screen } from "@testing-library/react";
import ComponentMount from ".";
import {
  applyRegexLocalization,
  useLocalization,
  useApiMutation,
  endPoints,
  setLookupValues,
  setResolvedLookupIds,
  selectPermissions,
  fetchPermissions,
} from "@ui/ui-lib";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "../../providers/AuthProvider";

// ---- Mock dependencies ----
jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));
jest.mock("../../providers/AuthProvider", () => ({
  useAuth: jest.fn(),
}));
jest.mock("@ui/ui-lib", () => ({
  ...jest.requireActual("@ui/ui-lib"),
  applyRegexLocalization: jest.fn(),
  useLocalization: jest.fn(),
  useApiMutation: jest.fn(),
  endPoints: { lookUpValuesByName: "/lookup" },
  setLookupValues: jest.fn(() => ({ type: "SET_LOOKUP_VALUES" })),
  setResolvedLookupIds: jest.fn(() => ({ type: "SET_RESOLVED_IDS" })),
  selectPermissions: jest.fn(),
  fetchPermissions: jest.fn(() => ({ type: "FETCH_PERMISSIONS" })),
}));

const mockDispatch = jest.fn();

describe("ComponentMount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);

    // Default selector for lookup state
    (useSelector as jest.Mock).mockImplementation((sel) =>
      sel({
        user: {
          lookupValues: { data: {} },
          lookupReady: true,
        },
      })
    );

    // Default auth state
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1 },
      loading: false,
    });

    // Default localization state
    (useLocalization as jest.Mock).mockReturnValue({
      localizationData: {},
      isLocalizationLoading: false,
    });

    // Default mutation mock
    (useApiMutation as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
    });

    // Default permissions selector
    (selectPermissions as jest.Mock).mockReturnValue(["READ"]);
  });

  const renderWithChildren = (child = <div>child</div>) =>
    render(<ComponentMount>{child}</ComponentMount>);

  it("fetches lookups when lookupReady is false", () => {
    const mutateMock = jest.fn();
    (useApiMutation as jest.Mock).mockReturnValue({ mutate: mutateMock });

    (useSelector as jest.Mock).mockImplementation((sel) =>
      sel({
        user: { lookupValues: { data: {} }, lookupReady: false },
      })
    );

    renderWithChildren();
    expect(mutateMock).toHaveBeenCalledWith({
      endpoint: endPoints.lookUpValuesByName,
      method: "POST",
      data: expect.any(Object),
    });
  });

  it("sets resolved lookup IDs when data is present", () => {
    (useSelector as jest.Mock).mockImplementation((sel) =>
      sel({
        user: {
          lookupValues: {
            data: {
              GROUP_COMPANY: [{ lookUpKey: "GROUP_COMPANY", id: 42 }],
            },
          },
          lookupReady: true,
        },
      })
    );
    renderWithChildren();
    expect(setResolvedLookupIds).toHaveBeenCalledWith({
      GROUP_COMPANY: 42,
    });
  });

  it("handles lookup fetch error without crashing", () => {
    (useApiMutation as jest.Mock).mockImplementation(({ config }) => ({
      mutate: () => config.onError("error"),
    }));
    (useSelector as jest.Mock).mockImplementation((sel) =>
      sel({
        user: { lookupValues: { data: {} }, lookupReady: false },
      })
    );
    renderWithChildren();
    // No assertion, just ensuring no crash
  });

  it("applies regex localization when localization data exists", () => {
    (useLocalization as jest.Mock).mockReturnValue({
      localizationData: { data: { pattern: "xyz" } },
      isLocalizationLoading: false,
    });
    renderWithChildren();
    expect(applyRegexLocalization).toHaveBeenCalledWith({ pattern: "xyz" });
  });

  it("dispatches fetchPermissions when permissions are null and user exists", () => {
    (selectPermissions as jest.Mock).mockReturnValue(null);
    renderWithChildren();
    expect(mockDispatch).toHaveBeenCalledWith(fetchPermissions());
  });
});
