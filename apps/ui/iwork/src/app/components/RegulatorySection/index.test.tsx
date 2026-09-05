import React from "react";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import RegulatorySection from "./index";

// Mocks
jest.mock("./styles", () => ({
    SectionContainer: (props: any) => <div data-testid="section-container">{props.children}</div>,
    Image: (props: any) => <img data-testid="section-image" src={props.src} alt={props.alt} />,
    Heading: (props: any) => <h2 data-testid="section-heading">{props.children}</h2>,
    Subheading: (props: any) => <p data-testid="section-subheading">{props.children}</p>,
    SectionCard: (props: any) => <div data-testid="section-card">{props.children}</div>,
    SectionCardsContainer: (props: any) => <div data-testid="section-cards-container">{props.children}</div>,
}));
jest.mock("@ui/ui-lib", () => ({
    __esModule: true,
    default: (props: any) => (
        <div data-testid="image-text">
            <span>{props.sectionTitle}</span>
            <img src={props.sectionImage} alt="section" />
        </div>
    ),
}));
jest.mock("@ui/ui-lib", () => ({
    caseConvertor: (str: string) => str && str.toUpperCase(),
}));

describe("RegulatorySection", () => {
    const mockData = [
        {
            id: 1,
            imageSrc: "img1.png",
            heading: "heading one",
            subheading: "subheading one",
        },
        {
            id: 2,
            imageSrc: "img2.png",
            heading: "heading two",
            subheading: "subheading two",
        },
    ];

    it("renders section container", () => {
        render(<RegulatorySection data={mockData} />);
        expect(screen.getByTestId("section-container")).toBeInTheDocument();
    });

    it("renders section cards for each data item", () => {
        render(<RegulatorySection data={mockData} />);
        const cards = screen.getAllByTestId("section-card");
        expect(cards.length).toBe(2);
    });

    it("renders headings and subheadings in uppercase", () => {
        render(<RegulatorySection data={mockData} />);
        expect(screen.getByText("HEADING ONE")).toBeInTheDocument();
        expect(screen.getByText("subheading one")).toBeInTheDocument();
        expect(screen.getByText("HEADING TWO")).toBeInTheDocument();
        expect(screen.getByText("subheading two")).toBeInTheDocument();
    });

    it("renders SectionCardsContainer", () => {
        render(<RegulatorySection data={mockData} />);
        expect(screen.getByTestId("section-cards-container")).toBeInTheDocument();
    });
});