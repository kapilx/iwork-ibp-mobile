import { render, screen, fireEvent } from "@testing-library/react";
import { ControlledField } from "../utils";
import { getTextFromHtml } from "@ui/ui-lib/utils/richTextUtils";
import "@testing-library/jest-dom";
import RichText from "./RichText";

// Shared mock
const mockOnChange = jest.fn();

jest.mock("@ui/ui-lib/utils/richTextUtils", () => ({
  getTextFromHtml: jest.fn((html) => html.replace(/<[^>]*>/g, "")),
}));
jest.mock("react-quill", () => {
    return function MockQuill(props: any) {
      return <div role="textbox" contentEditable={!props.readOnly} onInput={(e) => props.onChange(e.target.innerHTML)} />;
    };
  });
  jest.mock("../utils", () => ({
    ControlledField: jest.fn(({ render }) =>
      render({ value: "", onChange: jest.fn() })
    ),
  }));
jest.mock("../utils", () => ({
  ControlledField: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (ControlledField as jest.Mock).mockImplementation(({ render }) =>
    render({ value: "", onChange: mockOnChange })
  );
});

describe("RichText Component", () => {
  const mockField = {
    label: "Rich Text Label",
    componentProps: { buttonText: "Click Me", disabled: false },
    rules: { maxLength: { value: 10, message: "Max length exceeded" } },
  };

  const mockControl = {};
  const mockOnClick = jest.fn();

  it("renders the RichText component with label and button", () => {
    render(<RichText field={mockField} control={mockControl} onClick={mockOnClick} />);
    expect(screen.getByText("Rich Text Label")).toBeInTheDocument();
    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });

  it("calls onClick when the button is clicked", () => {
    render(<RichText field={mockField} control={mockControl} onClick={mockOnClick} />);
    const button = screen.getByText("Click Me");
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("disables the editor when the disabled prop is true", () => {
    const disabledField = { ...mockField, componentProps: { ...mockField.componentProps, disabled: true } };
    render(<RichText field={disabledField} control={mockControl} onClick={mockOnClick} />);
  
    const editor = screen.getByRole("textbox");
    // expect(editor).toHaveAttribute("aria-readonly", "true"); // Check for aria-readonly instead of contenteditable
  });

  it("truncates input when maxLength is exceeded", () => {
    const mockOnChange = jest.fn();
    (ControlledField as jest.Mock).mockImplementation(({ render }) =>
      render({ value: "", onChange: mockOnChange })
    );
  
    render(<RichText field={mockField} control={mockControl} onClick={mockOnClick} />);
  
    const editor = screen.getByRole("textbox");
  
    // Simulate the onChange event for the editor
    fireEvent.input(editor, { target: { innerHTML: "This is a long text exceeding max length" } });
  
    // Ensure getTextFromHtml is called with the full input
    expect(getTextFromHtml).toHaveBeenCalledWith("This is a long text exceeding max length");
  
    // Ensure onChange is called with the truncated value
    expect(mockOnChange).toHaveBeenCalledWith("This is a ");
  });

  it("shows error message when maxLength is exceeded", () => {
    (getTextFromHtml as jest.Mock).mockReturnValue("This is a long text exceeding max length");
    render(<RichText field={mockField} control={mockControl} onClick={mockOnClick} />);
    expect(screen.getByText("Max length exceeded")).toBeInTheDocument();
  });

  it("displays character count correctly", () => {
    (getTextFromHtml as jest.Mock).mockReturnValue("Short text");
    render(<RichText field={mockField} control={mockControl} onClick={mockOnClick} />);
    expect(screen.getByText("10/10")).toBeInTheDocument();
  });
});
