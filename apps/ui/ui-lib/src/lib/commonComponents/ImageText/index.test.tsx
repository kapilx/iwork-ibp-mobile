import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import ImageText from "./index";
import { theme } from "@ui/ui-lib/styles";

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

describe("ImageText Component", () => {
  const renderWithTheme = (props) => {
    return render(
      <ThemeProvider theme={theme}>
        <ImageText {...props} />
      </ThemeProvider>
    );
  };

  it("renders the section title", () => {
    renderWithTheme({ sectionTitle: "Test Title" });
    const title = screen.getByText("Test Title");
    expect(title).toBeInTheDocument();
  });

  it("renders the image when sectionImage is provided", () => {
    renderWithTheme({ sectionTitle: "With Image", sectionImage: "test.png" });
    const img = screen.getByAltText("With Image");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "test.png");
  });

  it("does not render an image if sectionImage is not provided", () => {
    renderWithTheme({ sectionTitle: "No Image" });
    const img = screen.queryByRole("img");
    expect(img).not.toBeInTheDocument();
  });

  it("applies custom containerStyles, imageStyles, and titleStyles", () => {
    const containerStyles = { backgroundColor: "red" };
    const imageStyles = { borderRadius: "50%" };
    const titleStyles = { color: "blue" };
    renderWithTheme({
      sectionTitle: "Styled Title",
      sectionImage: "styled.png",
      containerStyles,
      imageStyles,
      titleStyles,
    });
    const container = screen.getByText("Styled Title").parentElement;
    expect(container).toHaveStyle({ backgroundColor: "red" });
    const img = screen.getByAltText("Styled Title");
    expect(img).toHaveStyle({ borderRadius: "50%" });
    const title = screen.getByText("Styled Title");
    expect(title).toHaveStyle({ color: "blue" });
  });
});
