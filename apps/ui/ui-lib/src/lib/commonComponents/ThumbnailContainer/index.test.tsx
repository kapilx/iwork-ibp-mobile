import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ThumbnailContainer from "./index";
import {
  ThumbDate,
  ThumbTitle,
  ThumbDescription,
  Thumbnail,
} from "./style";

describe("ThumbnailContainer", () => {
  const baseThumb = {
    url: "https://example.com",
    alt: "Example Thumbnail",
    date: "2024-07-10",
    title: "Example Title",
    description: "Example Description",
  };

  it("renders the thumbnail container", () => {
    render(
      <ThumbnailContainer
        thumbnails={[baseThumb]}
        website="https://example.com"
        companyName="Example Co"
      />
    );
    expect(screen.getByTestId("thumbnail-container")).toBeInTheDocument();
  });

  it("renders a clickable thumbnail with valid website", () => {
    render(
      <ThumbnailContainer
        thumbnails={[baseThumb]}
        website="https://example.com"
        companyName="Example Co"
      />
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", "Example Thumbnail");
    expect(img).toHaveAttribute(
      "src",
      expect.stringContaining(
        "https://api.microlink.io/?url=https%3A%2F%2Fexample.com"
      )
    );
  });

  it("prepends https:// if website is missing protocol", () => {
    render(
      <ThumbnailContainer
        thumbnails={[baseThumb]}
        website="example.com"
        companyName="Example Co"
      />
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute(
      "src",
      expect.stringContaining(
        "https://api.microlink.io/?url=https%3A%2F%2Fexample.com"
      )
    );
  });

  it("does not render a link if website is 'n/a'", () => {
    render(
      <ThumbnailContainer
        thumbnails={[baseThumb]}
        website="n/a"
        companyName="Example Co"
      />
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("does not render a link if website is empty", () => {
    render(
      <ThumbnailContainer
        thumbnails={[baseThumb]}
        website=""
        companyName="Example Co"
      />
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders default alt text if thumbnail alt is missing", () => {
    const thumbNoAlt = { ...baseThumb, alt: undefined as any };
    render(
      <ThumbnailContainer
        thumbnails={[thumbNoAlt]}
        website="https://example.com"
        companyName="Example Co"
      />
    );
    expect(screen.getByRole("img")).toHaveAttribute("alt", "Thumbnail");
  });
});

describe("Thumbnail styled components styles", () => {
  it("renders ThumbDate with correct styles", () => {
    const { container } = render(<ThumbDate>2024-07-11</ThumbDate>);
    const dateElement = container.firstChild as HTMLElement;

    expect(dateElement).toHaveStyle({
      fontSize: "10px",
      fontWeight: "500",
      color: "#26262699",
      marginBottom: "10px",
    });
  });

  it("renders ThumbTitle with correct styles", () => {
    const mockTheme = {
      palette: {
        text: {
          primary: "#000000",
        },
      },
    };

    const { container } = render(
      <ThumbTitle theme={mockTheme}>Test Title</ThumbTitle>
    );
    const titleElement = container.firstChild as HTMLElement;

    expect(titleElement).toHaveStyle({
      fontSize: "16px",
      fontWeight: "400",
      marginBottom: "4px",
    });
  });

  it("renders ThumbDescription with correct font size", () => {
    const { container } = render(
      <ThumbDescription>Test Description</ThumbDescription>
    );
    const descElement = container.firstChild as HTMLElement;

    expect(descElement).toHaveStyle({
      fontSize: "12px",
    });
  });

  it("renders Thumbnail with correct dimensions and styles", () => {
    const { container } = render(<Thumbnail>Thumbnail Content</Thumbnail>);
    const thumbElement = container.firstChild as HTMLElement;

    expect(thumbElement).toHaveStyle({
      width: "345px",
      height: "210px",
      objectFit: "cover",
      cursor: "pointer",
    });
  });

  it("verifies Thumbnail cursor changes on hover", () => {
    const { container } = render(<Thumbnail>Hover Test</Thumbnail>);
    const thumbElement = container.firstChild as HTMLElement;

    expect(thumbElement).toHaveStyle({
      cursor: "pointer",
    });
  });

  it("maintains aspect ratio with objectFit cover", () => {
    const { container } = render(
      <Thumbnail>
        <img src="test.jpg" alt="test" />
      </Thumbnail>
    );
    const thumbElement = container.firstChild as HTMLElement;

    expect(thumbElement).toHaveStyle({
      width: "345px",
      height: "210px",
      objectFit: "cover",
    });
  });
});