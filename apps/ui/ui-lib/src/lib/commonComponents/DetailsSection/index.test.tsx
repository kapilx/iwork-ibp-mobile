import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import DetailsSection from "./index";

// Mock utils and constants
jest.mock("../../utils/richTextUtils", () => ({
  getTextFromHtml: (html: string) => html.replace(/<[^>]+>/g, ""),
}));
jest.mock("../../utils/DateFormat", () => ({
  formatDate: (date: string) => `formatted-${date}`,
  isValidDate: (date: string) => date.startsWith("202"),
}));
jest.mock("../../constants", () => ({
  INVALID_DATE: "Invalid Date",
  NOT_AVAILABLE: "N/A",
}));

const theme = createTheme({
  typography: { fontFamily: "Arial", fontSizes: { sm: 14 } },
  palette: {
    text: { primary: "#000", secondary: "#fff" },
    background: { paper: "#fff" },
    primary: { main: "#1976d2", light: "#e3f2fd" },
    action: { hover: "#f5f5f5" },
  },
  shape: {
    borderRadii: { normal: "8px", small: "4px" },
  },
  spacing: (...args: number[]) => args.map((n) => `${n * 4}px`).join(" "),
  shadows: Array(25).fill("none"),
});

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe("DetailsSection", () => {
  const baseFields = [
    { label: "Name", key: "name" },
    { label: "Age", key: "age" },
    { label: "Bio", key: "bio", richText: true },
    { label: "Joined", key: "joined", richText: false },
    { label: "Website", key: "website", isLink: true },
  ];
  const baseData = {
    name: "John",
    age: 30,
    bio: "<b>Developer</b>",
    joined: "2024-01-01",
    website: "https://example.com",
  };

  it("renders title, fields, and values", () => {
    renderWithTheme(
      <DetailsSection title="User Info" fields={baseFields} data={baseData} />
    );
    expect(screen.getByText("User Info")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("John")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("Bio")).toBeInTheDocument();
    expect(screen.getByText("Developer")).toBeInTheDocument();
    expect(screen.getByText("Joined")).toBeInTheDocument();
    expect(screen.getByText("formatted-2024-01-01")).toBeInTheDocument();
    expect(screen.getByText("Website")).toBeInTheDocument();
    expect(screen.getByText("https://example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "https://example.com" })
    ).toHaveAttribute("href", "https://example.com");
  });

  it("renders NOT_AVAILABLE for missing data", () => {
    renderWithTheme(
      <DetailsSection
        title="Missing"
        fields={[{ label: "Missing", key: "missing" }]}
        data={{}}
      />
    );
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("renders without title if hideTitle is true", () => {
    renderWithTheme(
      <DetailsSection
        title="Hidden"
        hideTitle
        fields={baseFields}
        data={baseData}
      />
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("renders button field and calls onFieldClick", () => {
    const onFieldClick = jest.fn();
    renderWithTheme(
      <DetailsSection
        title="Button"
        fields={[
          {
            label: "Action",
            key: "name",
            renderAsButton: true,
            fieldButtonText: "Click Me",
            onFieldClick,
          },
        ]}
        data={baseData}
      />
    );
    const btn = screen.getByRole("button", { name: "Click Me" });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onFieldClick).toHaveBeenCalledWith("John");
  });

  it("renders section button and calls onClick", () => {
    const onClick = jest.fn();
    renderWithTheme(
      <DetailsSection
        title="Section"
        fields={[{ label: "Name", key: "name" }]}
        data={baseData}
        buttonText="Edit"
        onClick={onClick}
      />
    );
    const btn = screen.getByRole("button", { name: "Edit" });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalled();
  });

  it("renders nested and array data", () => {
    const fields = [
      { label: "First Hobby", key: "hobbies[0].name" },
      { label: "Nested", key: "profile.info" },
    ];
    const data = {
      hobbies: [{ name: "Reading" }, { name: "Coding" }],
      profile: { info: "Nested Info" },
    };
    renderWithTheme(
      <DetailsSection title="Nested" fields={fields} data={data} />
    );

    expect(screen.getByText("First Hobby")).toBeInTheDocument();
    expect(screen.getByText("Reading")).toBeInTheDocument();
    expect(screen.getByText("Nested Info")).toBeInTheDocument();
    expect(screen.getAllByText("Nested").length).toBeGreaterThanOrEqual(1);
  });

  it("renders N/A for invalid nested key", () => {
    const fields = [{ label: "Invalid Nested", key: "invalid.key" }];
    const data = {};
    renderWithTheme(<DetailsSection title="Test" fields={fields} data={data} />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("renders raw value if not a valid date", () => {
    const fields = [{ label: "Invalid Date", key: "joined" }];
    const data = { joined: "Not a real date" };
    renderWithTheme(<DetailsSection title="Test" fields={fields} data={data} />);
    expect(screen.getByText("Not a real date")).toBeInTheDocument();
  });

  it("renders button with fallback text when value is missing", () => {
    const onFieldClick = jest.fn();
    renderWithTheme(
      <DetailsSection
        title="Fallback"
        fields={[
          {
            label: "Action",
            key: "missing",
            renderAsButton: true,
            onFieldClick,
          },
        ]}
        data={{}}
      />
    );
    expect(screen.getByRole("button")).toHaveTextContent("N/A");
  });
});
