import React, { useEffect, useRef, useState } from "react";
import "react-quill/dist/quill.snow.css";
import { Box, Typography, FormHelperText } from "@mui/material";
import { FieldComponentProps } from "../types";
import { ControlledField } from "../utils";
import {
  getTextFromHtml,
  isHtmlEmpty,
  normalizeEmptyParagraphs,
} from "@ui/ui-lib/utils/richTextUtils";
import { sanitizeHtml } from "@ui/ui-lib/utils/sanitizeHtml";
import ReactQuill, { Quill } from "react-quill";

import undoIcon from "../../../assets/svgs/undo.svg";
import redoIcon from "../../../assets/svgs/redo.svg";
import linkIcon from "../../../assets/svgs/link.svg";
import unlinkIcon from "../../../assets/svgs/unlink.svg";
import largeSmall from "../../../assets/svgs/a-large-small.svg";
import bold from "../../../assets/svgs/bold.svg";
import italic from "../../../assets/svgs/italic.svg";
import underline from "../../../assets/svgs/underline.svg";
import center from "../../../assets/svgs/align-center.svg";
import justify from "../../../assets/svgs/align-justify.svg";
import right from "../../../assets/svgs/align-left.svg";
import list from "../../../assets/svgs/list.svg";
import bullet from "../../../assets/svgs/list-ordered.svg";
import decreaseIndent from "../../../assets/svgs/indent-decrease.svg";
import increaseIndent from "../../../assets/svgs/indent-increase.svg";
import baseLine from "../../../assets/svgs/baseline.svg";
import {
  imageStyles,
  FormFieldStyledButton,
  StyledQuillEditorWrapper,
  MaxLengthStyles,
  StyledTypography,
  StyledRichTextContainer,
  StyledReadOnlyRichText,
} from "./styles";
import { isCopyPasteAllowedForOrg } from "@ui/ui-lib/environment";

const Clipboard = Quill.import("modules/clipboard") as any;
const CONVERT_PATCHED = "__quillStringConvertPatched";

if (Clipboard?.prototype && !Clipboard.prototype[CONVERT_PATCHED]) {
  const originalConvert = Clipboard.prototype.convert;
  Clipboard.prototype.convert = function (
    arg: string | { html?: string; text?: string },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formats?: Record<string, any>
  ) {
    return originalConvert.call(
      this,
      typeof arg === "string" ? { html: arg } : arg,
      formats
    );
  };
  Clipboard.prototype[CONVERT_PATCHED] = true;
}

// Replace Quill icons with custom SVGs
const icons = Quill.import("ui/icons");
const setQuillIcon = (name: string, icon: string) => {
  icons[name] = `<img class="${imageStyles}" src="${icon}" alt="${name}"/>`;
};

const Font = Quill.import("formats/font");
Font.whitelist = ["sans-serif", "serif", "monospace"];
Quill.register(Font, true);

if (typeof window !== "undefined" && typeof document !== "undefined") {
  const styleId = "quill-font-style-inject";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      .ql-font-sans-serif { font-family: sans-serif; }
      .ql-font-serif { font-family: serif; }
      .ql-font-monospace { font-family: monospace; }
    `;
    document.head.appendChild(style);
  }
}

const SizeClass = Quill.import("attributors/class/size");
SizeClass.whitelist = ["small", "normal", "large", "huge"];
Quill.register(SizeClass, true);

if (typeof window !== "undefined" && typeof document !== "undefined") {
  const styleId = "quill-size-class-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      .ql-size-small { font-size: 0.8125rem !important; }
      .ql-size-normal { font-size: 1rem !important; }
      .ql-size-large { font-size: 1.25rem !important; }
      .ql-size-huge { font-size: 2.125rem !important; }
    `;
    document.head.appendChild(style);
  }
}

const historyHandler = (action: string) =>
  function (this: any) {
    this.quill.history[action]();
  };

setQuillIcon("undo", undoIcon);
setQuillIcon("redo", redoIcon);
setQuillIcon("link", linkIcon);
setQuillIcon("unLink", unlinkIcon);
setQuillIcon("AaIcon", largeSmall);
setQuillIcon("bold", bold);
setQuillIcon("italic", italic);
setQuillIcon("underline", underline);
setQuillIcon("color", baseLine);
icons.align[
  "center"
] = `<img src="${center}" alt="center" class="${imageStyles}" />`;
icons.align[
  "justify"
] = `<img src="${justify}" alt="justify" class="${imageStyles}" />`;
icons.align[
  "right"
] = `<img src="${right}" alt="right" class="${imageStyles}" />`;
icons.list[
  "ordered"
] = `<img src="${bullet}" alt="ordered" class="${imageStyles}" />`;
icons.list[
  "bullet"
] = `<img src="${list}" alt="bullet" class="${imageStyles}" />`;
icons.indent[
  "-1"
] = `<img src="${decreaseIndent}" alt="decreaseIndent" class="${imageStyles}" />`;
icons.indent[
  "+1"
] = `<img src="${increaseIndent}" alt="increaseIndent" class="${imageStyles}" />`;

const modules = {
  toolbar: {
    container: [
      ["undo", "redo"],
      ["bold", "italic", "underline"],
      [
        { align: "" },
        { align: "center" },
        { align: "justify" },
        { align: "right" },
      ],
      [{ list: "bullet" }, { list: "ordered" }],
      [{ indent: "-1" }, { indent: "+1" }],
      ["link", "unLink"],
      [{ color: [] }],
      ["AaIcon"],
      [{ font: [] }],
      [{ size: [] }],
    ],
    handlers: {
      undo: historyHandler("undo"),
      redo: historyHandler("redo"),
      unLink: function (this: any) {
        const range = this.quill.getSelection();
        if (range) {
          this.quill.format("link", false);
        }
      },
      AaIcon: function (this: any) {
        const range = this.quill.getSelection();
        if (range && range.length > 0) {
          const cursorIndex = range.index;
          const text = this.quill.getText(cursorIndex, range.length);
          const isUpperCase = text === text.toUpperCase();
          const toggledText = isUpperCase
            ? text.toLowerCase()
            : text.toUpperCase();
          this.quill.deleteText(cursorIndex, range.length);
          this.quill.insertText(cursorIndex, toggledText, "user");
          this.quill.setSelection(cursorIndex + toggledText.length, 0);
        }
      },
    },
  },
};

const truncateHtml = (html: string, maxLength: number): string => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  let currentLength = 0;

  const truncateNode = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (currentLength >= maxLength) {
        node.textContent = "";
        return false;
      }
      if (currentLength + text.length > maxLength) {
        node.textContent = text.slice(0, maxLength - currentLength);
        currentLength = maxLength;
        return false;
      }
      currentLength += text.length;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        if (!truncateNode(child)) break;
      }
    }
    return true;
  };

  truncateNode(doc.body);
  return doc.body.innerHTML;
};

const RichText: React.FC<FieldComponentProps> = ({
  field,
  control,
  watch,
  setValue,
  buttonText,
  onClick,
}) => {
  const [focused, setFocused] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const hasDefaultValueApplied = useRef(false);
  const isDisabled =
    (field.componentProps as { disabled?: boolean })?.disabled ?? false;
  const quillRef = useRef<ReactQuill | null>(null);
  const onChangeRef = useRef<((value: string) => void) | null>(null);

  const maxLength =
    typeof field.rules?.maxLength === "number"
      ? field.rules.maxLength
      : field.rules?.maxLength?.value ??
      field.componentProps?.showCharCountLimit;

  const maxLengthMessage =
    typeof field.rules?.maxLength === "object"
      ? field.rules.maxLength.message
      : "Maximum character limit exceeded.";

  useEffect(() => {
    if (focused && quillRef.current) {
      requestAnimationFrame(() => {
        const editor = quillRef.current?.getEditor();
        if (editor) {
          const length = editor.getLength();
          editor.focus();
          editor.setSelection(length, 0);
        }
      });
    }
  }, [focused]);

  const handleTrimContent = (sharedPropsOnChange: (value: string) => void) => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      const text = editor.getText();
      const trimmedText = text.trim();

      if (!trimmedText || trimmedText === "\n") {
        // If empty after trimming, clear the field
        sharedPropsOnChange("");
      } else if (text !== trimmedText) {
        // If trimming changed the content, update the editor
        const currentLength = editor.getLength();

        // Remove trailing whitespace/newlines
        let endPos = currentLength - 1;
        while (endPos > 0) {
          const char = editor.getText(endPos - 1, 1);
          if (char.trim() === "") {
            endPos--;
          } else {
            break;
          }
        }

        // Remove leading whitespace/newlines
        let startPos = 0;
        while (startPos < endPos) {
          const char = editor.getText(startPos, 1);
          if (char.trim() === "") {
            startPos++;
          } else {
            break;
          }
        }

        if (startPos > 0 || endPos < currentLength - 1) {
          // Get the trimmed content with formatting
          const delta = editor.getContents(startPos, endPos - startPos);
          editor.setContents(delta);

          // Update the form value
          const trimmedHtml = editor.root.innerHTML;
          sharedPropsOnChange(trimmedHtml);
        }
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        editorRef.current &&
        !editorRef.current.contains(e.target as Node) &&
        focused
      ) {
        if (onChangeRef.current) {
          handleTrimContent(onChangeRef.current);
        }
        setFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [focused]);

  useEffect(() => {
    if (hasDefaultValueApplied.current || !field.defaultValue) return;

    const currentValue =
      typeof watch === "function" ? watch(field.name) : undefined;
    if (!currentValue || isHtmlEmpty(currentValue)) {
      setValue(field.name, field.defaultValue, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }

    hasDefaultValueApplied.current = true;
  }, [field.defaultValue, field.name, setValue, watch]);

  return (
    <ControlledField
      field={field}
      control={control}
      render={(sharedProps) => {
        // Store onChange in ref so it's accessible in event handlers
        onChangeRef.current = sharedProps.onChange;

        const handleOnChange = (value: string) => {
          sharedProps.onChange(value);
        };

        const finalValue =
          sharedProps.value && !isHtmlEmpty(sharedProps.value)
            ? sharedProps.value
            : field.defaultValue || "";
        const sanitizedHtml = {
          __html: sanitizeHtml(normalizeEmptyParagraphs(finalValue) || ""),
        };

        const plainText = getTextFromHtml(sharedProps.value || "");
        return (
          <StyledRichTextContainer>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <StyledTypography variant="body2">
                {field.rules?.required ? `${field.label} *` : field.label}
              </StyledTypography>
              {field?.componentProps?.buttonText && (
                <FormFieldStyledButton onClick={onClick}>
                  {field?.componentProps?.buttonText}
                </FormFieldStyledButton>
              )}
            </Box>
{/* nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml */}
                {/* HTML is sanitized using DOMPurify via sanitizeHtml() before rendering */}
            {!focused ? (
              <StyledReadOnlyRichText
                ref={editorRef}
                onClick={() => !isDisabled && setFocused(true)}
                onPaste={(e) => {
                  if (!isCopyPasteAllowedForOrg()) {
                    e.preventDefault();
                  }
                }}
                isDisabled={isDisabled}
                hasText={!!plainText}
                dangerouslySetInnerHTML={sanitizedHtml}
              />
            ) : (
              <StyledQuillEditorWrapper
                ref={editorRef}
                onPasteCapture={(e) => {
                  if (!isCopyPasteAllowedForOrg()) {
                    e.preventDefault();
                  }
                }}
              >
                <ReactQuill
                  ref={quillRef}
                  value={normalizeEmptyParagraphs(finalValue)}
                  onChange={handleOnChange}
                  onBlur={() => {
                    const checkFocus = () => {
                      const activeEl = document.activeElement;
                      if (
                        editorRef.current &&
                        !editorRef.current.contains(activeEl)
                      ) {
                        setFocused(false);
                      }
                    };

                    requestAnimationFrame(() =>
                      requestAnimationFrame(checkFocus)
                    );
                  }}
                  readOnly={isDisabled}
                  modules={modules}
                />
              </StyledQuillEditorWrapper>
            )}

            <MaxLengthStyles>
              {maxLength && (
                <Typography variant="caption">
                  {plainText.length}/{maxLength}
                </Typography>
              )}
              {typeof maxLength === "number" &&
                plainText.length > maxLength &&
                maxLengthMessage && (
                  <FormHelperText error>{maxLengthMessage}</FormHelperText>
                )}
            </MaxLengthStyles>
          </StyledRichTextContainer>
        );
      }}
    />
  );
};

export default RichText;