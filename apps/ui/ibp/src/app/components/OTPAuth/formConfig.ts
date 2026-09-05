import { FormFieldConfig } from "@ui/ui-lib/commonComponents/FormComponent/types";

// Phone Number Form Configuration
export const createPhoneOTPFormConfig = (
  onPhoneNumberChange?: (value: string) => void
): FormFieldConfig[] => [
  {
    key: "phoneNumber",
    name: "phoneNumber",
    label: "Phone Number",
    type: "text",
    rules: {
      required: {
        value: true,
        message: "Phone number is required",
      },
      pattern: {
        value: /^\+91\d{10}$/,
        message: "Please enter a valid 10-digit phone number",
      },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter your phone number (e.g. 9876543210)",
      onInput: (e: any) => {
        let value = e.target.value;
        
        // Always ensure +91 prefix
        if (!value.startsWith('+91')) {
          value = '+91' + value.replace(/\D/g, '');
        } else {
          // Extract only digits after +91
          const digitsAfter91 = value.slice(3).replace(/\D/g, '');
          // Limit to 10 digits
          value = '+91' + digitsAfter91.slice(0, 10);
        }
        
        e.target.value = value;
        
        // Call the onChange callback for real-time tracking
        onPhoneNumberChange?.(value);
      },
      onKeyDown: (e: any) => {
        const cursorPos = e.target.selectionStart;
        const isControlKey = e.ctrlKey || e.altKey || e.metaKey;
        
        // Prevent deletion of +91 prefix
        if ((e.key === 'Backspace' || e.key === 'Delete') && cursorPos <= 3) {
          e.preventDefault();
          return;
        }
        
        // Allow only digits and control keys
        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key) && !isControlKey) {
          e.preventDefault();
        }
      },
      onFocus: (e: any) => {
        // Ensure +91 is always present
        if (!e.target.value || !e.target.value.startsWith('+91')) {
          e.target.value = '+91';
          onPhoneNumberChange?.('+91');
        }
        // Set cursor after +91 if field is just +91
        setTimeout(() => {
          if (e.target.value === '+91') {
            e.target.setSelectionRange(3, 3);
          }
        }, 0);
      },
      onClick: (e: any) => {
        // Prevent cursor from going before +91
        const cursorPos = e.target.selectionStart;
        if (cursorPos < 3) {
          setTimeout(() => {
            e.target.setSelectionRange(3, 3);
          }, 0);
        }
      },
      enableCopyPaste: true,
      onChange: (e: any) => {
        // This will be handled by onInput, but keeping for compatibility
        onPhoneNumberChange?.(e.target.value);
      },
      sx: {
        "&.MuiTextField-root .MuiOutlinedInput-root": {
          backgroundColor: "transparent",
          borderRadius: "6px",
        },
      },
    },
  },
];

// OTP Form Configuration
export const OTP_FORM_CONFIG: FormFieldConfig[] = [
  {
    key: "otp",
    name: "otp",
    label: "OTP",
    type: "text",
    rules: {
      required: {
        value: true,
        message: "OTP is required",
      },
      minLength: {
        value: 6,
        message: "OTP must be 6 digits",
      },
      maxLength: {
        value: 6,
        message: "OTP must be 6 digits",
      },
      pattern: {
        value: /^[0-9]{6}$/,
        message: "OTP must be exactly 6 digits",
      },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter 6-digit OTP",
      onInput: (e: any) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
      },
      enableCopyPaste: true,
      sx: {
        "&.MuiTextField-root .MuiOutlinedInput-root": {
          backgroundColor: "transparent",
          borderRadius: "6px",
        },
      },
    },
  },
];

// Initial data
export const initialPhoneOTPData = {
  phoneNumber: "+91",
};

export const initialOTPData = {
  otp: "",
};
