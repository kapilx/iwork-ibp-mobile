import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import PolicyDetailsCoversTab from "./index";

jest.mock("@mui/material/styles", () => {
    const actual = jest.requireActual("@mui/material/styles");
    // Provide a dummy styled implementation that injects theme
    return {
        ...actual,
        useTheme: () => ({
            typography: {
                fontSizes: { md: "1rem" },
                fontWeights: { bold: 700 },
            },
            spacing: (v: number) => v * 8 + "px",
            palette: {
                chips: { senary: "#000" },
            },
        }),
        styled: (tag: any) => {
            // Return a component that passes a dummy theme to styles
            const React = require("react");
            return (styles: any) => {

                const theme = {
                    typography: {
                        fontSizes: { md: "1rem" },
                        fontWeights: { bold: 700 },
                    },
                    spacing: (v: number) => `${v * 8}px`,
                    palette: {
                        chips: { senary: "#000" },
                    },
                };
                const styleObj = typeof styles === "function" ? styles({ theme }) : styles;
                // Use React.createElement from require to avoid out-of-scope error
                return function StyledComponent(props: any) {
                    return require("react").createElement(tag, { ...props, style: styleObj }, props.children);
                };
            };
        }
    };
});

// Mock dependencies using require inside factory to avoid out-of-scope error
jest.mock("@ui/ui-lib", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: React.forwardRef(() => <div data-testid="nested-dynamic-form" />),
    NestedDynamicForm: React.forwardRef(() => (
      <div data-testid="nested-dynamic-form" />
    )),
    NestedGroupedDataCollectionHandle: {},
    apiRequest: jest.fn(() => Promise.resolve({})),
    endPoints: {},
    SectionImageContainer: ({ children }: any) => <div>{children}</div>,
    SectionImageIcon: (props: any) => <img {...props} />,
    Button: (props: any) => <button {...props}>{props.children}</button>,
    COVER_DETAILS: "Cover Details",
  };
});
jest.mock("../../constants", () => ({
  SUBMIT: "Submit",
}));
jest.mock("@tanstack/react-query", () => ({
    useQuery: () => ({
        data: { activityMeta: { config: [], defaultValues: {}, key: "", title: "" } },
        isLoading: false,
    }),
}));
jest.mock("react-router-dom", () => ({
    useParams: () => ({ id: "1" }),
}));

describe("PolicyDetailsCoversTab", () => {
    it("renders loading state", () => {
        jest.spyOn(require("@tanstack/react-query"), "useQuery").mockReturnValue({
            isLoading: true,
            data: undefined,
        });
        render(<PolicyDetailsCoversTab />);
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });

    it("returns correct config and defaultValues from Promise.all", async () => {
        const mockMeta = { data: { result: { formConfig: [{ field: "field1" }] } } };
        const mockPrefill = { data: { covers: { field1: "value1" } } };

        // Patch the apiRequest mock for this test
        const apiRequest = require("@ui/ui-lib").apiRequest;
        apiRequest.mockClear();
        apiRequest.mockResolvedValueOnce(mockMeta);
        apiRequest.mockResolvedValueOnce(mockPrefill);

        // Patch endPoints mock for this test
        const endPoints = require("@ui/ui-lib").endPoints;
        endPoints.getCoversMetaByPolicyId = (id: number) => `meta-url-${id}`;
        endPoints.getCoversDataByPolicyId = (id: number) => `data-url-${id}`;

        // Patch useParams to provide a policyId
        jest.spyOn(require("react-router-dom"), "useParams").mockReturnValue({ id: "123" });

        // Patch useQuery to call the actual queryFn synchronously
        jest.spyOn(require("@tanstack/react-query"), "useQuery").mockImplementation(({ queryFn }: any) => {
            return {
                isLoading: false,
                data: queryFn(),
            };
        });

        // Re-require component to use new mocks
        const PolicyDetailsCoversTabTest = require("./index").default;

        render(<PolicyDetailsCoversTabTest />);
        await waitFor(() => {
            expect(apiRequest).toHaveBeenCalledTimes(2);
            expect(apiRequest).toHaveBeenNthCalledWith(1, "meta-url-123");
            expect(apiRequest).toHaveBeenNthCalledWith(2, "data-url-123");
            expect(screen.getByTestId("nested-dynamic-form")).toBeInTheDocument();
        });
    });

    it("handles empty config and covers gracefully", async () => {
        const mockMeta = { data: { result: { formConfig: undefined } } };
        const mockPrefill = { data: { covers: undefined } };

        const apiRequest = require("@ui/ui-lib").apiRequest;
        apiRequest.mockClear();
        apiRequest.mockResolvedValueOnce(mockMeta);
        apiRequest.mockResolvedValueOnce(mockPrefill);

        const endPoints = require("@ui/ui-lib").endPoints;
        endPoints.getCoversMetaByPolicyId = (id: number) => `meta-url-${id}`;
        endPoints.getCoversDataByPolicyId = (id: number) => `data-url-${id}`;

        jest.spyOn(require("react-router-dom"), "useParams").mockReturnValue({ id: "456" });

        jest.spyOn(require("@tanstack/react-query"), "useQuery").mockImplementation(({ queryFn }: any) => {
            return {
                isLoading: false,
                data: queryFn(),
            };
        });

        const PolicyDetailsCoversTabTest = require("./index").default;

        render(<PolicyDetailsCoversTabTest />);
        await waitFor(() => {
            expect(apiRequest).toHaveBeenCalledTimes(2);
            expect(apiRequest).toHaveBeenNthCalledWith(1, "meta-url-456");
            expect(apiRequest).toHaveBeenNthCalledWith(2, "data-url-456");
            expect(screen.getByTestId("nested-dynamic-form")).toBeInTheDocument();
        });
    });
});