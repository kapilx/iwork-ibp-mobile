import {
  useEffect,
  useId,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { Close } from "@mui/icons-material";
import { environment } from "@ui/ui-lib";
import {
  ChatInputContainer,
  TextAreaWrapper,
  StyledTextArea,
  ErrorText,
  VisuallyHiddenLabel,
  SendButton,
  CrossIconButton,
  SendIcon,
  AnimatedPlaceholder,
} from "./styles.js";

export interface ChatInputProps {
  maxLength?: number;
  isSubmitting?: boolean;
  onSend(message: string): void;
  onCancel?(): void;
  onInputClear?(): void;
  examples?: string[];
}

export interface ChatInputRef {
  setValue: (value: string) => void;
  focus: () => void;
  triggerSend: () => void;
}

const DEFAULT_EXAMPLES = [
  "List all policies with their type and status",
  "Show all policies for companies containing 'Life'",
  "List all the active policies",
];

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(
  (
    {
      maxLength = 1024,
      isSubmitting = false,
      onSend,
      onCancel,
      onInputClear,
      examples = DEFAULT_EXAMPLES,
    },
    ref
  ) => {
    const [value, setValue] = useState("");
    const [exampleIndex, setExampleIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const baseId = useId();
    const errorId = `${baseId}-error`;

    // Cycle through examples array for rotating placeholder text with animation
    const rotateExamples = useCallback(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setExampleIndex((prev) => (prev + 1) % examples.length);
        setIsTransitioning(false);
      }, 300);
    }, [examples.length]);

    useEffect(() => {
      const interval = setInterval(rotateExamples, 3000);
      return () => clearInterval(interval);
    }, [rotateExamples]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      if (newValue.trim().length === 0 && onInputClear) {
        onInputClear();
      }
    };

    const overLimit = value.trim().length > maxLength;
    const canSend = value.trim().length > 0 && !overLimit && !isSubmitting;

    const sendMessage = () => {
      const trimmed = value.trim();
      if (!trimmed || overLimit) return;
      onSend(trimmed);
      setValue("");
      textareaRef.current?.focus();
    };

    const clearInput = () => {
      setValue("");
      textareaRef.current?.focus();
      if (onInputClear) {
        onInputClear();
      }
    };

    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
      setValue: (newValue: string) => {
        setValue(newValue);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
          }
        }, 10);
      },
      focus: () => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      },
      triggerSend: () => {
        if (canSend) {
          sendMessage();
        }
      },
    }));

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (canSend) {
          sendMessage();
        }
      } else if (e.key === "Escape") {
        textareaRef.current?.blur();
      }
    };

    const showPlaceholder = value.length === 0 && examples.length > 0;
    const isUserInputDisabled = !environment.nl2sqlFlag.isEnableUserInput;
    const placeholderText = isUserInputDisabled
      ? "Select one of the following queries and click enter"
      : examples[exampleIndex];

    return (
      <ChatInputContainer>
        <TextAreaWrapper>
          <VisuallyHiddenLabel htmlFor={`${baseId}-textarea`}>
            Ask a question
          </VisuallyHiddenLabel>
          {showPlaceholder && (
            <AnimatedPlaceholder isTransitioning={isTransitioning}>
              {placeholderText}
            </AnimatedPlaceholder>
          )}
          <StyledTextArea
            id={`${baseId}-textarea`}
            multiline
            minRows={1}
            maxRows={3}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            {...(overLimit && { "aria-describedby": errorId })}
            slotProps={{
              input: {
                readOnly: isUserInputDisabled,
                endAdornment: value.trim().length > 0 &&
                  !isUserInputDisabled && (
                    <CrossIconButton
                      onClick={clearInput}
                      size="small"
                      aria-label="Clear input"
                    >
                      <Close fontSize="small" />
                    </CrossIconButton>
                  ),
              },
            }}
          />
          {overLimit && (
            <ErrorText id={errorId} aria-live="polite" role="alert">
              Message exceeds {maxLength} characters
            </ErrorText>
          )}
        </TextAreaWrapper>
        <SendButton
          onClick={sendMessage}
          disabled={!canSend}
          size="large"
          aria-label="Send message"
          aria-busy={isSubmitting}
        >
          <SendIcon />
        </SendButton>
      </ChatInputContainer>
    );
  }
);

ChatInput.displayName = "ChatInput";

export default ChatInput;
