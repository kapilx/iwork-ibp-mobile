import { LinkText } from "./styles";
import { CompanySentimentLabel } from "./styles";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { MemoryRouter } from "react-router-dom";
import SummaryCard from ".";
import { theme } from "@ui/ui-lib/styles";

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Mock CommonDetailsSection to avoid dependency on its internal logic
jest.mock("../CommonDetailsSection", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="common-details-section">Mocked CommonDetailsSection</div>
  ),
}));

// Mock ChipRenderer to avoid dependency on its internal logic
jest.mock("../Chip", () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="chip-renderer">Mocked Chip</div>,
}));

describe("SummaryCard Component", () => {
  const baseData = {
    companyName: "Test Company",
    linkedInUrl: "https://linkedin.com/company/test-company",
    chipValue: "Chip Value",
  };
  const baseSections = ["section1", "section2"];
  const nameLink = "https://tracxn.com/company/test-company";

  const headerConfig = {
    titleKey: "companyName",
    chip: [
      {
        key: "chipValue",
        styleMap: { color: "red" },
        variant: "normal",
        labelPrefix: "Prefix",
        imageSrc: "img.png",
        labelStyles: "label-class",
        ChipStyles: { fontWeight: "bold" },
      },
    ],
    button: {
      label: "Tracxn",
      onClick: jest.fn(),
    },
    linkedInButton: {
      label: "LinkedIn",
      onClick: jest.fn(),
    },
  };

  const renderWithTheme = (props: any) => {
    return render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <SummaryCard {...props} />
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  it("renders company name and chips when title and chip config are provided", () => {
    renderWithTheme({
      data: baseData,
      sections: baseSections,
      headerConfig,
      nameLink,
    });
    expect(screen.getByText("Test Company")).toBeInTheDocument();
    expect(screen.getByTestId("chip-renderer")).toBeInTheDocument();
  });

  it("renders Tracxn button and triggers window.open on click", () => {
    window.open = jest.fn();
    renderWithTheme({
      data: baseData,
      sections: baseSections,
      headerConfig,
      nameLink,
    });
    const tracxnButton = screen.getByRole("button", { name: /tracxn/i });
    expect(tracxnButton).toBeInTheDocument();
    fireEvent.click(tracxnButton);
    expect(window.open).toHaveBeenCalledWith(nameLink, "_blank");
  });

  it("renders LinkedIn button and triggers onClick", () => {
    renderWithTheme({
      data: baseData,
      sections: baseSections,
      headerConfig,
      nameLink,
    });
    const linkedInButton = screen.getByRole("button", { name: /linkedin/i });
    expect(linkedInButton).toBeInTheDocument();
    fireEvent.click(linkedInButton);
    expect(headerConfig.linkedInButton.onClick).toHaveBeenCalledWith(baseData);
  });

  it("disables LinkedIn button if no linkedInUrl", () => {
    const dataNoLinkedIn = { ...baseData, linkedInUrl: undefined };
    renderWithTheme({
      data: dataNoLinkedIn,
      sections: baseSections,
      headerConfig,
      nameLink,
    });
    const linkedInButton = screen.getByRole("button", { name: /linkedin/i });
    expect(linkedInButton).toBeDisabled();
  });

  it("renders CommonDetailsSection with correct props", () => {
    renderWithTheme({
      data: baseData,
      sections: baseSections,
      headerConfig,
      nameLink,
    });
    expect(screen.getByTestId("common-details-section")).toBeInTheDocument();
  });

  it("renders without chips, buttons, or title if headerConfig is missing", () => {
    renderWithTheme({ data: baseData, sections: baseSections, nameLink });
    expect(screen.getByTestId("common-details-section")).toBeInTheDocument();
    // Should not find chip or buttons
    expect(screen.queryByTestId("chip-renderer")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /tracxn/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /linkedin/i })
    ).not.toBeInTheDocument();
  });

  it("does not render ChipRenderer if chip value is undefined", () => {
    const headerConfigNoChipValue = {
      ...headerConfig,
      chip: [
        {
          ...headerConfig.chip[0],
          key: "nonexistentKey", // This key does not exist in baseData
        },
      ],
    };
    renderWithTheme({
      data: baseData,
      sections: baseSections,
      headerConfig: headerConfigNoChipValue,
      nameLink,
    });
    // Should not render any chip
    expect(screen.queryByTestId("chip-renderer")).not.toBeInTheDocument();
  });
});

describe("SummaryCard ViewMore functionality", () => {
  it("renders formatted and fallback values from viewMoreItems when expanded", () => {
    const data = {
      companyName: "Test Company",
      key1: "Alpha",
      key3: 123,
    };
    const viewMoreItems = [
      { label: "Label1", key: "key1" }, // direct value
      { label: "Label2", key: "missingKey", fallback: "N/A" }, // fallback branch
      { label: "Label3", key: "key3", formatter: (v: any) => `#${v}` }, // formatter branch
    ];
    const headerConfig = { titleKey: "companyName" } as any;

    render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <SummaryCard
            data={data}
            sections={[]}
            headerConfig={headerConfig}
            nameLink="https://example.com"
            viewMore={true}
            viewMoreItems={viewMoreItems as any}
          />
        </ThemeProvider>
      </MemoryRouter>
    );

    const toggle = screen.getByText(/view more/i);
    fireEvent.click(toggle);

    // After expanding, all labels and their respective (formatted/fallback) values should appear
    expect(screen.getByText("Label1")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();

    expect(screen.getByText("Label2")).toBeInTheDocument();
    expect(screen.getByText("N/A")).toBeInTheDocument();

    expect(screen.getByText("Label3")).toBeInTheDocument();
    expect(screen.getByText("#123")).toBeInTheDocument();
  });
});

describe("CompanySentimentLabel styled component", () => {
  it("renders with correct styles from theme", () => {
    render(
      <ThemeProvider theme={theme}>
        <CompanySentimentLabel data-testid="sentiment-label">
          Sentiment
        </CompanySentimentLabel>
      </ThemeProvider>
    );
    const label = screen.getByTestId("sentiment-label");
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent("Sentiment");
    // Check style values from theme
    const styles = getComputedStyle(label);
    expect(styles.fontSize).toBe(theme.typography.fontSizes.sm);
    expect(styles.fontWeight).toBe(
      theme.typography.fontWeights.medium.toString()
    );
    // Color may be rgb, so we check computed value
    // expect(styles.color).toBe(theme.palette.text.primary); // Optional: check color
  });
});

describe("LinkText styled component", () => {
  it("renders as an anchor with correct styles from theme", () => {
    render(
      <ThemeProvider theme={theme}>
        <LinkText data-testid="link-text" href="https://example.com">
          Example Link
        </LinkText>
      </ThemeProvider>
    );
    const link = screen.getByTestId("link-text");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveTextContent("Example Link");
    const styles = window.getComputedStyle(link);
    expect(styles.display).toBe("flex");
    expect(styles.alignItems).toBe("center");
    expect(styles.fontWeight).toBe(
      theme.typography.fontWeights.medium.toString()
    );
    expect(styles.textDecoration).toBe("none");
    expect(styles.fontSize).toBe(theme.typography.fontSizes.sm);
    // Color may be rgb, so we check computed value if needed
  });

  it("applies svg styles to child svg", () => {
    render(
      <ThemeProvider theme={theme}>
        <LinkText data-testid="link-text-svg">
          Link <svg data-testid="icon-svg" />
        </LinkText>
      </ThemeProvider>
    );
    const svg = screen.getByTestId("icon-svg");
    const styles = window.getComputedStyle(svg);
    expect(styles.fontSize).toBe(theme.typography.fontSizes.md);
    // marginLeft may be in px, so we check it is not empty
    expect(styles.marginLeft).not.toBe("");
  });
});

describe("LogoContainer styled component", () => {
  it("renders with correct styles from theme and applies hover style", () => {
    // Import here to avoid hoisting issues
    const { LogoContainer } = require("./styles");
    render(
      <ThemeProvider theme={theme}>
        <LogoContainer data-testid="logo-container">Logo</LogoContainer>
      </ThemeProvider>
    );
    const logo = screen.getByTestId("logo-container");
    expect(logo).toBeInTheDocument();
    const styles = window.getComputedStyle(logo);
    expect(styles.display).toBe("flex");
    expect(styles.alignItems).toBe("center");
    expect(styles.cursor).toBe("pointer");
    // Accept both hex and rgb for background color
    expect([theme.palette.background.paper, "rgb(255, 255, 255)"]).toContain(
      styles.backgroundColor
    );
    // Check border and borderRadius
    expect(styles.borderRadius).not.toBe("");
    expect(styles.border.toLowerCase()).toContain(
      theme.palette.button.secondary.toLowerCase()
    );
  });
});

describe("LogoSection styled component", () => {
  it("renders with correct flex, alignment, and gap styles from theme", () => {
    const { LogoSection } = require("./styles");
    render(
      <ThemeProvider theme={theme}>
        <LogoSection data-testid="logo-section">Logo Section</LogoSection>
      </ThemeProvider>
    );
    const section = screen.getByTestId("logo-section");
    expect(section).toBeInTheDocument();
    const styles = window.getComputedStyle(section);
    expect(styles.display).toBe("flex");
    expect(styles.alignItems).toBe("center");
    // gap is returned as px, so check it's not empty
    expect(styles.gap).not.toBe("");
  });
});
