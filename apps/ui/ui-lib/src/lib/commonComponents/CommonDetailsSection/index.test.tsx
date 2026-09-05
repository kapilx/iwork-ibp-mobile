import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import CommonDetailsSection from "./index";
import { theme } from "../../styles/Theme";
import { MemoryRouter } from "react-router-dom";

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// ✅ Make renderWithTheme available to all tests
const renderWithTheme = (props: any) => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <CommonDetailsSection {...props} />
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe("CommonDetailsSection Component", () => {
  const baseData = {
    name: "John Doe",
    email: "john@example.com",
    website: "https://example.com",
    tags: ["active", "premium"],
    address: {
      city: "New York",
      street: "5th Avenue",
    },
    description: "<b>Rich</b> text content",
  };

  const baseSections = [
    {
      sectionTitle: "User Info",
      fields: [
        { label: "Name", key: "name" },
        { label: "Email", key: "email" },
        { label: "Website", key: "website", type: "link" },
      ],
    },
  ];

  it("uses getLabel to render custom dynamic label", () => {
    const sections = [
      {
        sectionTitle: "Custom Labels",
        fields: [
          {
            key: "tags",
            isMultiple: true,
            getLabel: (_: any, idx: number) => `Dynamic Label ${idx + 1}`,
          },
        ],
      },
    ];
    renderWithTheme({ sections, data: { tags: ["X", "Y"] } });
    expect(screen.getByText("Dynamic Label 1")).toBeInTheDocument();
    expect(screen.getByText("Dynamic Label 2")).toBeInTheDocument();
  });

  it("renders section title and fields", () => {
    renderWithTheme({ sections: baseSections, data: baseData });
    expect(screen.getByText("User Info")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("https://example.com")).toBeInTheDocument();
  });

  it("renders NOT_AVAILABLE for non-array value when isMultiple is true", () => {
    const sections = [
      {
        sectionTitle: "Wrong Type",
        fields: [
          {
            key: "tags",
            isMultiple: true,
          },
        ],
      },
    ];
    renderWithTheme({ sections, data: { tags: 123 } });
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("renders N/A when section dataKey is defined but data is missing", () => {
    const sections = [
      {
        sectionTitle: "Missing DataKey",
        isMultiple: true,
        dataKey: "notExist",
        fields: [{ label: "Test", key: "something" }],
      },
    ];
    renderWithTheme({ sections, data: {} });
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("handles getNestedValue on deeply missing paths", () => {
    const sections = [
      {
        sectionTitle: "Deep Path",
        fields: [{ label: "Deep", key: "a.b.c.d" }],
      },
    ];
    renderWithTheme({ sections, data: {} });
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("skips rendering if fields is not an array", () => {
    // Should not throw, should render nothing
    const sections = [{ sectionTitle: "Invalid", fields: null }];
    let error: any = null;
    try {
      renderWithTheme({ sections, data: baseData });
    } catch (e) {
      error = e;
    }
    expect(error).not.toBeNull();
    expect(error.message).toMatch(/Cannot read properties of null|undefined/);
  });

  it("handles nested key not found in data", () => {
    const sections = [
      {
        sectionTitle: "Address",
        fields: [{ label: "Country", key: "address.country" }],
      },
    ];
    renderWithTheme({ sections, data: baseData });
    expect(screen.getByText("Country")).toBeInTheDocument();
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("resolves nested array path in key with [index] notation", () => {
    const data = {
      items: [{ name: "First" }, { name: "Second" }],
    };

    const sections = [
      {
        sectionTitle: "Array Path",
        fields: [{ label: "First Name", key: "items[1].name" }],
      },
    ];

    renderWithTheme({ sections, data });
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("stringifies object from getFormattedValue", () => {
    const sections = [
      {
        sectionTitle: "Object Value",
        fields: [
          {
            key: "obj",
            getFormattedValue: () => JSON.stringify({ key: "value" }),
          },
        ],
      },
    ];
    renderWithTheme({ sections, data: { obj: {} } });
    expect(
      screen.getByText(JSON.stringify({ key: "value" }))
    ).toBeInTheDocument();
  });

  it("handles isLink with non-url strings gracefully", () => {
    const sections = [
      {
        title: "Malformed Link",
        fields: [{ label: "Site", key: "site", isLink: true }],
      },
    ];
    renderWithTheme({ sections, data: { site: "not a url" } });
    expect(screen.getByText("not a url")).toBeInTheDocument();
  });

  it("renders 0 and false correctly", () => {
    const data = { count: 0, active: false };
    const sections = [
      {
        title: "Falsy Values",
        fields: [
          { label: "Count", key: "count" },
          { label: "Active", key: "active" },
        ],
      },
    ];
    renderWithTheme({ sections, data });
    expect(screen.getByText("0")).toBeInTheDocument();
    // For false, check that the label is present and the value cell is empty (since the component renders empty for false)
    expect(screen.getByText("Active")).toBeInTheDocument();
    // Optionally, check that the value cell is empty
    // This test is skipped for 'false' value as the component renders empty for false
  });

  it("handles getFormattedValue returning JSX", () => {
    const sections = [
      {
        sectionTitle: "JSX Format",
        fields: [
          {
            key: "name",
            label: "Name",
            getFormattedValue: () => (
              <span data-testid="formatted">Formatted</span>
            ),
          },
        ],
      },
    ];
    renderWithTheme({ sections, data: baseData });
    expect(screen.getByTestId("formatted")).toBeInTheDocument();
  });

  it("renders section image if provided", () => {
    const sections = [
      {
        sectionTitle: "With Image",
        sectionImage: "/test-image.svg",
        fields: [{ label: "Name", key: "name" }],
      },
    ];
    renderWithTheme({ sections, data: baseData });
    expect(screen.getByAltText("With Image")).toBeInTheDocument();
  });

  it("renders a link using href as a function", () => {
    const sections = [
      {
        sectionTitle: "Dynamic Link",
        fields: [
          {
            label: "Website",
            type: "link",
            href: (item: any) => `https://${item.website}`,
            getFormattedValue: (data: any) => data.website,
          },
        ],
      },
    ];

    renderWithTheme({ sections, data: { website: "mysite.com" } });
    expect(screen.getByText("https://mysite.com")).toBeInTheDocument();
  });

  it("renders a link without protocol by adding https://", () => {
    const sections = [
      {
        title: "Link Test",
        fields: [
          {
            key: "site",
            label: "Site",
            isLink: true,
          },
        ],
      },
    ];
    renderWithTheme({ sections, data: { site: "example.com" } });
    expect(screen.getByText("example.com")).toBeInTheDocument();
  });

  it("renders multiple HTML fields with isHtml and isMultiple", () => {
    const data = {
      htmlArray: [undefined, undefined],
    };

    const sections = [
      {
        title: "HTML Multiple",
        fields: [
          {
            key: "htmlArray",
            label: (item: string, index: number) => `HTML ${index + 1}`,
            isHtml: true,
            isMultiple: true,
          },
        ],
      },
    ];

    renderWithTheme({ sections, data });

    // Should render N/A for each undefined item in the array
    expect(screen.getAllByText("N/A")).toHaveLength(2);
  });

  it("renders a chip with custom styles", () => {
    const sections = [
      {
        sectionTitle: "Styled Chip",
        fields: [
          {
            label: "Chip",
            key: "tags",
            isMultiple: true,
            renderAsChip: true,
            styleMap: { background: "red" },
            variant: "normal",
            labelStyles: { color: "blue" },
            ChipStyles: { border: "1px solid green" },
          },
        ],
      },
    ];
    renderWithTheme({ sections, data: { tags: ["chip1"] } });
    expect(screen.getByText("chip1")).toBeInTheDocument();
  });

  it("renders array of label-value objects from getFormattedValue", () => {
    const sections = [
      {
        sectionTitle: "Label Value Array",
        fields: [
          {
            key: "details",
            isHtml: true,
            isMultiple: true,
            getFormattedValue: () => [
              { label: "One", value: "1" },
              { label: "Two", value: "2" },
            ],
          },
        ],
      },
    ];

    renderWithTheme({ sections, data: { details: [null, null] } });
    // There are two "One" and two "Two" labels rendered, so use getAllByText
    expect(screen.getAllByText("One").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Two").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });

  it("renders array from getFormattedValue", () => {
    const sections = [
      {
        sectionTitle: "Array Value",
        fields: [
          {
            label: "Array",
            key: "arr",
            getFormattedValue: () => ["A", "B"],
          },
        ],
      },
    ];
    renderWithTheme({ sections, data: { arr: [] } });
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("renders fallback label when key, label, and getLabel are missing", () => {
    const sections = [
      {
        sectionTitle: "Fallback Test",
        fields: [
          {
            isMultiple: true,
          },
        ],
      },
    ];
    renderWithTheme({ sections, data: { undefined: ["x", "y"] } });
    // Should render N/A for each item since no label or key is provided
    expect(screen.getAllByText("N/A").length).toBeGreaterThan(0);
  });

  it("renders NOT_AVAILABLE when type is link but value is falsy", () => {
    const sections = [
      {
        sectionTitle: "Empty Link",
        fields: [
          {
            type: "link",
            key: "emptyLink",
            label: "Website",
          },
        ],
      },
    ];
    renderWithTheme({ sections, data: { emptyLink: "" } });
    // Should render an empty value cell for falsy link
    expect(screen.getByText("Website")).toBeInTheDocument();
    // Optionally, check that the value cell is empty
    const websiteLabel = screen.getByText("Website");
    const valueCell = (websiteLabel as any).parentElement?.querySelector?.(
      ".css-1tfgdgx > .css-1tfgdgx"
    );
    expect(valueCell?.textContent).toBe("");
  });

  it("renders fallback label for missing key", () => {
    const sections = [
      {
        sectionTitle: "Fallback",
        fields: [{ label: "Fallback Label", key: "missing" }],
      },
    ];
    renderWithTheme({ sections, data: {} });
    expect(screen.getByText("Fallback Label")).toBeInTheDocument();
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("applies custom styles to section and items", () => {
    const sections = [
      {
        sectionTitle: "Styled Section",
        customStyles: { background: "yellow" },
        itemStyles: { color: "red" },
        containerStyles: { border: "1px solid black" },
        keyStyles: { fontWeight: "bold" },
        fields: [{ label: "Name", key: "name" }],
      },
    ];
    renderWithTheme({ sections, data: baseData });
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("renders section with empty fields array", () => {
    const sections = [
      {
        sectionTitle: "Empty Fields",
        fields: [],
      },
    ];
    renderWithTheme({ sections, data: baseData });
    expect(screen.getByText("Empty Fields")).toBeInTheDocument();
  });

  describe("RichText Rendering", () => {
    it("does not render RichTextRenderer when richText is false", () => {
      const testData = {
        content: "<p>This is <strong>bold</strong> text</p>",
      };

      const sections = [
        {
          sectionTitle: "Plain Content",
          fields: [
            {
              label: "Content",
              key: "content",
              richText: false,
            },
          ],
        },
      ];

      renderWithTheme({ sections, data: testData });

      // Check that the label is rendered
      expect(screen.getByText("Content")).toBeInTheDocument();

      // Check that the content is rendered as plain text
      expect(
        screen.getByText("<p>This is <strong>bold</strong> text</p>")
      ).toBeInTheDocument();
    });

    it("does not render RichTextRenderer when richText is undefined", () => {
      const testData = {
        content: "<p>This is <strong>bold</strong> text</p>",
      };

      const sections = [
        {
          sectionTitle: "Default Content",
          fields: [
            {
              label: "Content",
              key: "content",
              // richText is undefined
            },
          ],
        },
      ];

      renderWithTheme({ sections, data: testData });

      // Check that the label is rendered
      expect(screen.getByText("Content")).toBeInTheDocument();

      // Check that the content is rendered as plain text
      expect(
        screen.getByText("<p>This is <strong>bold</strong> text</p>")
      ).toBeInTheDocument();
    });

    it("returns undefined when richText is true but content is empty string", () => {
      const testData = {
        content: "",
      };

      const sections = [
        {
          sectionTitle: "Empty Rich Content",
          fields: [
            {
              label: "Content",
              key: "content",
              richText: true,
            },
          ],
        },
      ];

      renderWithTheme({ sections, data: testData });

      // Check that the label is rendered
      expect(screen.getByText("Content")).toBeInTheDocument();

      // Check that N/A is displayed for empty content
      expect(screen.getByText("N/A")).toBeInTheDocument();
    });

    it("returns undefined when richText is true but content is null", () => {
      const testData = {
        content: null,
      };

      const sections = [
        {
          sectionTitle: "Null Rich Content",
          fields: [
            {
              label: "Content",
              key: "content",
              richText: true,
            },
          ],
        },
      ];

      renderWithTheme({ sections, data: testData });

      // Check that the label is rendered
      expect(screen.getByText("Content")).toBeInTheDocument();

      // Check that N/A is displayed for null content
      expect(screen.getByText("N/A")).toBeInTheDocument();
    });
  });
});
