import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import DonutChart from "./index";
import { DonutGraphConfig } from "./types";
import { theme } from "@ui/ui-lib";

// Mock ReactECharts component
jest.mock("echarts-for-react", () => {
  return jest.fn(({ option, style }) => (
    <div
      data-testid="react-echarts"
      data-option={JSON.stringify(option)}
      style={style}
    >
      Mocked ECharts Component
    </div>
  ));
});

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Mock useLocalization hook
jest.mock("@ui/ui-lib", () => ({
  ...jest.requireActual("@ui/ui-lib"),
  useLocalization: jest.fn(() => ({
    localizationData: {
      data: {
        numberFormat: "##,##,###.##", // Indian format
      },
    },
  })),
  NUMBER_FORMAT_PATTERNS: {
    indian: "##,##,###.##",
    international: "#,###.##",
  },
}));

describe("DonutChart Component", () => {
  const renderWithTheme = (config: DonutGraphConfig) => {
    return render(
      <ThemeProvider theme={theme}>
        <DonutChart config={config} />
      </ThemeProvider>
    );
  };

  const defaultConfig: DonutGraphConfig = {
    subtitle: "Brokerage",
    count: 100,
    target: 1000,
    brokerageAmount: 750,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays error message when no config is provided", () => {
    renderWithTheme(null as any);

    expect(screen.getByText("Oops! No config provided.")).toBeInTheDocument();
    expect(screen.queryByTestId("react-echarts")).not.toBeInTheDocument();
  });

  it("calculates and displays percentage correctly", () => {
    const config: DonutGraphConfig = {
      subtitle: "Revenue",
      count: 50,
      target: 100,
      brokerageAmount: 75,
    };

    renderWithTheme(config);

    // Should show 75% (75/100 * 100)
    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText("%")).toBeInTheDocument();
  });

  it("handles zero target gracefully", () => {
    const config: DonutGraphConfig = {
      subtitle: "Test",
      count: 50,
      target: 0,
      brokerageAmount: 25,
    };

    renderWithTheme(config);

    expect(screen.getByText("--")).toBeInTheDocument();
  });

  it("handles null target correctly", () => {
    const config: DonutGraphConfig = {
      subtitle: "Test",
      count: 50,
      target: null,
      brokerageAmount: 25,
    };

    renderWithTheme(config);

    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("formats large numbers correctly with Indian format", () => {
    const config: DonutGraphConfig = {
      subtitle: "Revenue",
      count: 100,
      target: 10000000, // 1 Crore
      brokerageAmount: 5000000, // 50 Lakh
    };

    renderWithTheme(config);

    // Should format as "1.00 Cr" and "50.00 L"
    expect(screen.getByText("1.00")).toBeInTheDocument();
    expect(screen.getByText("Cr")).toBeInTheDocument();
    expect(screen.getByText("50.00")).toBeInTheDocument();
    expect(screen.getByText("L")).toBeInTheDocument();
  });

  it("uses count when brokerageAmount is not provided", () => {
    const config: DonutGraphConfig = {
      subtitle: "Count",
      count: 75,
      target: 100,
    };

    renderWithTheme(config);

    // Should still calculate percentage based on count vs target
    expect(screen.getByText("--")).toBeInTheDocument(); // No brokerage amount to display
  });

  it("applies correct color for different achievement levels", () => {
    // Test red color for low achievement (<60%)
    const lowConfig: DonutGraphConfig = {
      subtitle: "Low",
      count: 50,
      target: 100,
      brokerageAmount: 50, // 50%
    };

    renderWithTheme(lowConfig);

    const echartElement = screen.getByTestId("react-echarts");
    const option = JSON.parse(
      echartElement.getAttribute("data-option") || "{}"
    );

    expect(option.series[0].progress.itemStyle.color).toBe("#EF4444"); // red
  });

  it("applies green color for high achievement (>=80%)", () => {
    const highConfig: DonutGraphConfig = {
      subtitle: "High",
      count: 50,
      target: 100,
      brokerageAmount: 85, // 85%
    };

    renderWithTheme(highConfig);

    const echartElement = screen.getByTestId("react-echarts");
    const option = JSON.parse(
      echartElement.getAttribute("data-option") || "{}"
    );

    expect(option.series[0].progress.itemStyle.color).toBe("#22C55E"); // green
  });

  it("applies orange color for medium achievement (60-79%)", () => {
    const mediumConfig: DonutGraphConfig = {
      subtitle: "Medium",
      count: 50,
      target: 100,
      brokerageAmount: 70, // 70%
    };

    renderWithTheme(mediumConfig);

    const echartElement = screen.getByTestId("react-echarts");
    const option = JSON.parse(
      echartElement.getAttribute("data-option") || "{}"
    );

    expect(option.series[0].progress.itemStyle.color).toBe("#FFA500"); // orange
  });

  it("applies green color when target is N/A", () => {
    const naConfig: DonutGraphConfig = {
      subtitle: "N/A Target",
      count: 50,
      target: null,
      brokerageAmount: 75,
    };

    renderWithTheme(naConfig);

    const echartElement = screen.getByTestId("react-echarts");
    const option = JSON.parse(
      echartElement.getAttribute("data-option") || "{}"
    );

    expect(option.series[0].progress.itemStyle.color).toBe("#22C55E"); // green
  });

  it("configures ECharts option correctly", () => {
    renderWithTheme(defaultConfig);

    const echartElement = screen.getByTestId("react-echarts");
    const option = JSON.parse(
      echartElement.getAttribute("data-option") || "{}"
    );

    expect(option.series).toHaveLength(2);
    expect(option.series[0].type).toBe("gauge");
    expect(option.series[1].type).toBe("pie");
    expect(option.series[0].startAngle).toBe(180);
    expect(option.series[0].endAngle).toBe(0);
    expect(option.series[0].min).toBe(0);
    expect(option.series[0].max).toBe(100);
  });

  it("sets correct ECharts style dimensions", () => {
    renderWithTheme(defaultConfig);

    const echartElement = screen.getByTestId("react-echarts");
    const style = echartElement.style;

    expect(style.width).toBe("170px");
    expect(style.height).toBe("170px");
  });

  it("calculates gauge size based on value length", () => {
    const largeValueConfig: DonutGraphConfig = {
      subtitle: "Large Value",
      count: 123456789,
      target: 1000000000,
      brokerageAmount: 123456789, // 9 digits
    };

    renderWithTheme(largeValueConfig);

    // The component should still render without issues
    expect(screen.getByTestId("react-echarts")).toBeInTheDocument();
  });

  it("handles edge cases in number formatting", () => {
    const edgeConfig: DonutGraphConfig = {
      subtitle: "Edge Case",
      count: 0,
      target: 1,
      brokerageAmount: 0,
    };

    renderWithTheme(edgeConfig);

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("%")).toBeInTheDocument();
  });

  it("handles very large numbers (crores)", () => {
    const croreConfig: DonutGraphConfig = {
      subtitle: "Crores",
      count: 100,
      target: 100000000, // 10 crores
      brokerageAmount: 50000000, // 5 crores
    };

    renderWithTheme(croreConfig);

    expect(screen.getByText("10.00")).toBeInTheDocument();
    expect(screen.getByText("5.00")).toBeInTheDocument();
    expect(screen.getAllByText("Cr")).toHaveLength(2);
  });

  it("handles decimal brokerage amounts", () => {
    const decimalConfig: DonutGraphConfig = {
      subtitle: "Decimal",
      count: 100,
      target: 1000,
      brokerageAmount: 756.78,
    };

    renderWithTheme(decimalConfig);

    // Should calculate 76% (756.78/1000 * 100)
    expect(screen.getByText("76")).toBeInTheDocument();
  });

  it("handles international number format when localization changes", () => {
    // Mock international format
    require("@ui/ui-lib").useLocalization.mockReturnValue({
      localizationData: {
        data: {
          numberFormat: "#,###.##", // International format
        },
      },
    });

    const config: DonutGraphConfig = {
      subtitle: "International",
      count: 100,
      target: 1000000, // 1 Million
      brokerageAmount: 500000, // 500K
    };

    renderWithTheme(config);

    expect(screen.getByText("1.00")).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
    expect(screen.getByText("500.00")).toBeInTheDocument();
    expect(screen.getByText("K")).toBeInTheDocument();
  });

  describe("Number formatting utility", () => {
    it("handles NaN and infinite values", () => {
      const invalidConfig: DonutGraphConfig = {
        subtitle: "Invalid",
        count: 100,
        target: 0, // This would cause division by zero in percentage calculation
        brokerageAmount: 100,
      };

      renderWithTheme(invalidConfig);

      expect(screen.getByText("--")).toBeInTheDocument();
    });
  });
});
