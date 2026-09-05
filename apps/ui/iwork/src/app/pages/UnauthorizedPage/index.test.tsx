import React from "react";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import Unauthorized from "./index";

// Mocks
jest.mock("./styles", () => ({
    UnauthorizedContainer: (props: any) => <div data-testid="unauthorized-container">{props.children}</div>,
    UnauthorizedImage: (props: any) => <img data-testid="unauthorized-image" {...props} />,
    UnauthorizedTitle: (props: any) => <h1 data-testid="unauthorized-title">{props.children}</h1>,
    UnauthorizedText: (props: any) => <p data-testid="unauthorized-text">{props.children}</p>,
}));
jest.mock("../../constants", () => ({
    UNAUTHORIZED_PAGE: {
        IMAGE_ALT: "Unauthorized Image",
        TITLE: "Access Denied",
        DESCRIPTION: "You do not have permission to view this page.",
    },
}));
jest.mock("../../../app/assets/svgs/workin-progress.svg", () => "workin-progress.svg");

describe("Unauthorized Page", () => {
    it("renders container, image, title, and description", () => {
        render(<Unauthorized />);
        expect(screen.getByTestId("unauthorized-container")).toBeTruthy();
        expect(screen.getByTestId("unauthorized-image")).toBeTruthy();
        expect(screen.getByTestId("unauthorized-title")).toHaveTextContent("Access Denied");
        expect(screen.getByTestId("unauthorized-text")).toHaveTextContent("You do not have permission to view this page.");
        expect(screen.getByTestId("unauthorized-image")).toHaveAttribute("src", "workin-progress.svg");
        expect(screen.getByTestId("unauthorized-image")).toHaveAttribute("alt", "Unauthorized Image");
    });
});
