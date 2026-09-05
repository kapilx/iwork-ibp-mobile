import React from "react";
import { render, screen } from "@testing-library/react";
import PermissionGuard from "./PermissionGuard";
import type { FeatureKey } from "./permissionMap";

// Mocks
const mockUseHasPermission = jest.fn();
jest.mock("./useHasPermission", () => ({
    __esModule: true,
    default: (...args: any[]) => mockUseHasPermission(...args),
}));
jest.mock("react-router-dom", () => ({
    Navigate: (props: any) => <div data-testid="navigate" {...props} />,
}));

describe("PermissionGuard", () => {
    const DummyChild = () => <div data-testid="dummy-child">Allowed</div>;
    const featureKey: FeatureKey = "FEATURE_X";

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("renders children when permission is granted", () => {
        mockUseHasPermission.mockReturnValue(true);

        render(
            <PermissionGuard feature={featureKey}>
                <DummyChild />
            </PermissionGuard>
        );
        expect(screen.getByTestId("dummy-child")).toBeTruthy();
        expect(screen.queryByTestId("navigate")).toBeNull();
    });

    it("redirects to /unauthorized when permission is denied", () => {
        mockUseHasPermission.mockReturnValue(false);

        render(
            <PermissionGuard feature={featureKey}>
                <DummyChild />
            </PermissionGuard>
        );
        expect(screen.getByTestId("navigate")).toBeTruthy();
        expect(screen.queryByTestId("dummy-child")).toBeNull();
    });
});
