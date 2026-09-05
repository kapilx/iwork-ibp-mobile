import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import MultipleSections, { IMultipleSectionsHandle } from "./index";
import { FormFieldConfig } from "@ui/ui-lib/commonComponents/FormComponent/types";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../styles/Theme";

// Mock react-hook-form
jest.mock("react-hook-form", () => {
  const originalModule = jest.requireActual("react-hook-form");
  return {
    ...originalModule,
    useForm: jest.fn(),
    useFieldArray: jest.fn(),
    FormProvider: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Mock the icon imports
jest.mock("../../assets/svgs/add-card.svg", () => "add-icon");
jest.mock("../../assets/svgs/remove-card.svg", () => "remove-icon");

// Mock the DynamicFormMultipleCases component
jest.mock(
  "@ui/ui-lib/commonComponents/FormComponent/DynamicFormMultipleCases",
  () => {
    return function MockDynamicFormMultipleCases({
      prefix,
      formConfig,
      disableAllFields,
    }: any) {
      return (
        <div data-testid={`dynamic-form-${prefix}`}>
          <span>Form Config Length: {formConfig.length}</span>
          <span>Disabled: {disableAllFields.toString()}</span>
          <span>Prefix: {prefix}</span>
        </div>
      );
    };
  }
);

// Mock the CustomModal component
jest.mock("@ui/ui-lib/commonComponents/Modal", () => {
  return function MockCustomModal({
    open,
    handleClose,
    heading,
    buttons,
    children,
  }: any) {
    if (!open) return null;
    return (
      <div data-testid="custom-modal">
        <h2>{heading}</h2>
        <div>{children}</div>
        {buttons.map((button: any, index: number) => (
          <button
            key={index}
            data-testid={`modal-button-${button.label.toLowerCase()}`}
            onClick={button.onClick}
          >
            {button.label}
          </button>
        ))}
        <button data-testid="modal-close" onClick={handleClose}>
          Close
        </button>
      </div>
    );
  };
});

// Mock MUI components
jest.mock("@mui/material", () => {
  const originalModule = jest.requireActual("@mui/material");
  return {
    ...originalModule,
    Box: jest.fn(({ children, ...props }) => (
      <div data-testid="mui-box" {...props}>
        {children}
      </div>
    )),
  };
});

// Mock FormSectionCard styles
jest.mock("@ui/ui-lib/commonComponents/FormSectionCard/styles", () => ({
  ActionButton: jest.fn(({ children, onClick, "data-testid": testId }) => (
    <button data-testid={testId} onClick={onClick}>
      {children}
    </button>
  )),
  FormSectionHeader: jest.fn(({ children }) => (
    <div data-testid="form-section-header">{children}</div>
  )),
  SectionDivider: jest.fn(() => <div data-testid="section-divider" />),
}));

describe("MultipleSections", () => {
  const mockFormConfig: FormFieldConfig[] = [
    {
      key: "field1",
      name: "field1",
      label: "Field 1",
      type: "text",
    },
    {
      key: "field2",
      name: "field2",
      label: "Field 2",
      type: "text",
    },
  ];
  const mockInitialValues = [
    { field1: "value1", field2: "value2" },
    { field1: "value3", field2: "value4" },
  ];

  const mockDefaultValues = { field1: "", field2: "" };
  const defaultProps = {
    initialValues: mockInitialValues,
    title: (index: number) => `Section ${index}`,
    defaultValues: mockDefaultValues,
    formConfig: mockFormConfig,
    key: "test-key",
  };

  // Default mock implementations
  const defaultMockUseForm = {
    control: {},
    handleSubmit: jest.fn(() => jest.fn()),
    reset: jest.fn(),
    trigger: jest.fn(),
    getValues: jest.fn(() => mockInitialValues),
    watch: jest.fn(() => ({ unsubscribe: jest.fn() })),
    setValue: jest.fn(),
  };

  const defaultMockUseFieldArray = {
    fields: mockInitialValues.map((_, index) => ({ id: `field-${index}` })),
    append: jest.fn(),
    remove: jest.fn(),
  };

  // Test wrapper component with theme
  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default mocks
    const mockUseForm = jest.requireMock("react-hook-form");
    mockUseForm.useForm.mockReturnValue(defaultMockUseForm);
    mockUseForm.useFieldArray.mockReturnValue(defaultMockUseFieldArray);
  });

  describe("Form Configuration", () => {
    it("handles dynamic form configuration function", () => {
      const dynamicFormConfig = (index: number): FormFieldConfig[] => [
        {
          key: `dynamicField${index}`,
          name: `dynamicField${index}`,
          label: `Dynamic Field ${index}`,
          type: "text",
        },
      ];
      const propsWithDynamicConfig = {
        ...defaultProps,
        formConfig: dynamicFormConfig,
      };
      render(
        <TestWrapper>
          <MultipleSections {...propsWithDynamicConfig} />
        </TestWrapper>
      );
      expect(screen.getByTestId("dynamic-form-retArray.0")).toBeInTheDocument();
      expect(screen.getByTestId("dynamic-form-retArray.1")).toBeInTheDocument();
    });
  });

  describe("Remove Section Functionality", () => {
    it("shows remove button for each section when there are multiple sections", () => {
      render(
        <TestWrapper>
          <MultipleSections {...defaultProps} />
        </TestWrapper>
      );

      const removeButtons = screen.getAllByTestId(/remove-button-/);
      expect(removeButtons).toHaveLength(2);
    });

    it("removes section after confirming in modal", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <MultipleSections {...defaultProps} />
        </TestWrapper>
      );

      const removeButton = screen.getAllByTestId(/remove-button-/)[0];
      await user.click(removeButton);

      const modalRemoveButton = screen.getByTestId("modal-button-remove");
      await user.click(modalRemoveButton);
    });

    it("closes modal without removing section when close button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <MultipleSections {...defaultProps} />
        </TestWrapper>
      );

      const removeButton = screen.getAllByTestId(/remove-button-/)[0];
      await user.click(removeButton);

      const modalCloseButton = screen.getByTestId("modal-close");
      await user.click(modalCloseButton);

      expect(screen.queryByTestId("custom-modal")).not.toBeInTheDocument();
      expect(screen.getByText("Section 1")).toBeInTheDocument();
    });
  });

  describe("Dynamic Calculated Fields", () => {
    it("calculates fields based on watched values and triggers setValue", async () => {
      const mockSetValue = jest.fn();
      const mockWatch = jest.fn();
      const mockSubscription = { unsubscribe: jest.fn() };

      // Mock react-hook-form's watch to return a subscription
      mockWatch.mockImplementation((callback) => {
        const mockValues = {
          retArray: [
            { field1: "10", field2: "20", calculatedField: null },
            { field1: "5", field2: "15", calculatedField: null },
          ],
        };
        callback(mockValues);
        return mockSubscription;
      });

      const dynamicCalculatedFields = [
        {
          watchFields: ["field1", "field2"],
          setField: "calculatedField",
          calculate: (values: Record<string, any>) => {
            const val1 = parseFloat(values.field1) || 0;
            const val2 = parseFloat(values.field2) || 0;
            return val1 + val2;
          },
        },
      ];

      // Mock useForm hook
      const mockUseForm = jest.requireMock("react-hook-form");
      mockUseForm.useForm = jest.fn(() => ({
        ...defaultMockUseForm,
        watch: mockWatch,
        setValue: mockSetValue,
      }));

      const propsWithDynamicFields = {
        ...defaultProps,
        dynamicCalculatedFields,
      };

      const { unmount } = render(
        <TestWrapper>
          <MultipleSections {...propsWithDynamicFields} />
        </TestWrapper>
      );

      // Verify watch was called
      expect(mockWatch).toHaveBeenCalled();

      // Verify setValue was called with calculated values
      await waitFor(() => {
        expect(mockSetValue).toHaveBeenCalledWith(
          "retArray.0.calculatedField",
          30,
          { shouldValidate: true }
        );
        expect(mockSetValue).toHaveBeenCalledWith(
          "retArray.1.calculatedField",
          20,
          { shouldValidate: true }
        );
      });

      // Test cleanup - verify subscription is unsubscribed
      unmount();
      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe("Imperative Handle (Ref Methods)", () => {
    it("submit method resolves with retArray data on successful submission", async () => {
      const mockHandleSubmit = jest.fn();
      const mockRetArrayData = [{ field1: "test1", field2: "test2" }];

      // Mock handleSubmit to call success callback
      mockHandleSubmit.mockImplementation((onSuccess, onError) => {
        return () => {
          onSuccess({ retArray: mockRetArrayData });
        };
      });

      const mockUseForm = jest.requireMock("react-hook-form");
      mockUseForm.useForm = jest.fn(() => ({
        ...defaultMockUseForm,
        handleSubmit: mockHandleSubmit,
      }));

      const ref = React.createRef<IMultipleSectionsHandle>();
      render(
        <TestWrapper>
          <MultipleSections {...defaultProps} ref={ref} />
        </TestWrapper>
      );

      await waitFor(async () => {
        if (ref.current?.submit) {
          const result = await ref.current.submit();
          expect(result).toEqual(mockRetArrayData);
          expect(mockHandleSubmit).toHaveBeenCalled();
        }
      });
    });

    it("submit method rejects with errors on failed submission", async () => {
      const mockHandleSubmit = jest.fn();
      const mockErrors = { field1: { message: "Required field" } };

      mockHandleSubmit.mockImplementation((onSuccess, onError) => {
        return () => {
          onError(mockErrors);
        };
      });

      const mockUseForm = jest.requireMock("react-hook-form");
      mockUseForm.useForm = jest.fn(() => ({
        ...defaultMockUseForm,
        handleSubmit: mockHandleSubmit,
      }));

      const ref = React.createRef<IMultipleSectionsHandle>();
      render(
        <TestWrapper>
          <MultipleSections {...defaultProps} ref={ref} />
        </TestWrapper>
      );

      await waitFor(async () => {
        if (ref.current?.submit) {
          try {
            await ref.current.submit();
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toEqual(mockErrors);
            expect(mockHandleSubmit).toHaveBeenCalled();
          }
        }
      });
    });

    it("trigger method calls form trigger without name parameter", async () => {
      const mockTrigger = jest.fn().mockResolvedValue(true);

      const mockUseForm = jest.requireMock("react-hook-form");
      mockUseForm.useForm = jest.fn(() => ({
        ...defaultMockUseForm,
        trigger: mockTrigger,
      }));

      const ref = React.createRef<IMultipleSectionsHandle>();
      render(
        <TestWrapper>
          <MultipleSections {...defaultProps} ref={ref} />
        </TestWrapper>
      );

      await waitFor(async () => {
        if (ref.current?.trigger) {
          const result = await ref.current.trigger();
          expect(result).toBe(true);
          expect(mockTrigger).toHaveBeenCalledWith(undefined);
        }
      });
    });

    it("getValues method returns retArray from form", () => {
      const mockRetArrayValues = [
        { field1: "value1", field2: "value2" },
        { field1: "value3", field2: "value4" },
      ];
      const mockGetValues = jest.fn().mockReturnValue(mockRetArrayValues);

      const mockUseForm = jest.requireMock("react-hook-form");
      mockUseForm.useForm = jest.fn(() => ({
        ...defaultMockUseForm,
        getValues: mockGetValues,
      }));

      const ref = React.createRef<IMultipleSectionsHandle>();
      render(
        <TestWrapper>
          <MultipleSections {...defaultProps} ref={ref} />
        </TestWrapper>
      );

      if (ref.current?.getValues) {
        const result = ref.current.getValues();
        expect(result).toEqual(mockRetArrayValues);
        expect(mockGetValues).toHaveBeenCalledWith("retArray");
      }
    });

    it("reset method calls form reset with new retArray values", () => {
      const mockReset = jest.fn();
      const newValues = [{ field1: "newValue1", field2: "newValue2" }];

      const mockUseForm = jest.requireMock("react-hook-form");
      mockUseForm.useForm = jest.fn(() => ({
        ...defaultMockUseForm,
        reset: mockReset,
      }));

      const ref = React.createRef<IMultipleSectionsHandle>();
      render(
        <TestWrapper>
          <MultipleSections {...defaultProps} ref={ref} />
        </TestWrapper>
      );

      if (ref.current?.reset) {
        ref.current.reset(newValues);
        expect(mockReset).toHaveBeenCalledWith({ retArray: newValues });
      }
    });
  });
});
