import { Button, Container } from "@mui/material";
import { getTextFromHtml } from "@ui/ui-lib/utils/richTextUtils";
import { sanitizeUrl } from "@ui/ui-lib/utils/sanitizeUrl";
import {
  CardContainer,
  ContainerHeader,
  DetailRow,
  DetailsSectionLabel,
  LinkStyle,
  DetailsSectionStyledButton,
  DetailsSectionValue,
} from "./styles";
import { formatDate, isValidDate } from "@ui/ui-lib/utils/DateFormat";
import { INVALID_DATE, NOT_AVAILABLE } from "../../constants";

type NestedObject = {
  [key: string]:
    | string
    | number
    | NestedObject
    | (string | number | NestedObject)[];
};

interface SectionProps<T extends NestedObject> {
  title: string | undefined;
  hideTitle?: boolean;
  fields: {
    label: string;
    key: string;
    renderAsButton?: boolean;
    fieldButtonText?: string;
    onFieldClick?: (value: string) => void;
    hideLabel?: boolean;
    richText?: boolean;
    isLink?: boolean;
  }[];
  data: T;
  buttonText?: string;
  onClick?: () => void;
  backgroundColor?: string;
  textColor?: string;
}

const DetailsSection = <T extends NestedObject>({
  title,
  hideTitle,
  fields,
  data,
  buttonText,
  onClick,
  backgroundColor,
  textColor,
}: SectionProps<T>) => {
  const getNestedValue = (
    obj: T,
    path: string,
    richText = false
  ): string | number | undefined => {
    const parts = path.split(".");
    let current: NestedObject | undefined = obj;

    for (const part of parts) {
      if (!current) return undefined;
      if (part === "__proto__" || part === "constructor" || part === "prototype") {
        return undefined;
      }

      if (part.includes("[")) {
        const [arrKey, index] = part.replace("]", "").split("[");
        const array = current[arrKey];
        if (Array.isArray(array)) {
          current = array[+index] as NestedObject | undefined;
        } else {
          return undefined;
        }
      } else {
        current = current[part] as NestedObject | undefined;
      }
    }

    if (richText && typeof current === "string") {
      return getTextFromHtml(current);
    }

    if (typeof current === "string" && isValidDate(current)) {
      const formattedValue = formatDate(current);
      return formattedValue === current
        ? current
        : formattedValue ?? INVALID_DATE;
    }

    return current as string | number | undefined;
  };

  const renderFields = () =>
    fields.map(
      ({
        label,
        key,
        renderAsButton,
        fieldButtonText,
        onFieldClick,
        hideLabel,
        richText,
        isLink, // New boolean prop
      }) => {
        const value = getNestedValue(data, key, richText);

        return (
          <DetailRow key={key}>
            {!hideLabel && <DetailsSectionLabel>{label}</DetailsSectionLabel>}
            {renderAsButton ? (
              <DetailsSectionStyledButton
                variant="contained"
                color="primary"
                onClick={() => {
                  if (onFieldClick && typeof value === "string") {
                    onFieldClick(String(value ?? ""));
                  }
                }}
              >
                {fieldButtonText ?? value ?? NOT_AVAILABLE}
              </DetailsSectionStyledButton>
            ) : isLink && typeof value === "string" ? ( // Check if isLink is true
              <DetailsSectionValue>
                <LinkStyle
                  href={sanitizeUrl(value)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {value}
                </LinkStyle>
              </DetailsSectionValue>
            ) : (
              <DetailsSectionValue>
                {value ?? NOT_AVAILABLE}
              </DetailsSectionValue>
            )}
          </DetailRow>
        );
      }
    );

  const isButtonOnlySection =
    fields.length === 1 && fields[0].renderAsButton === true;

  return (
    <Container>
      {isButtonOnlySection ? (
        <>
          <ContainerHeader className="container-header">
            {!hideTitle && <h3>{title}</h3>}
            {buttonText && (
              <DetailsSectionStyledButton
                variant="contained"
                color="primary"
                onClick={onClick}
              >
                {buttonText}
              </DetailsSectionStyledButton>
            )}
          </ContainerHeader>
          {renderFields()}
        </>
      ) : (
        <CardContainer backgroundColor={backgroundColor} textColor={textColor}>
          <ContainerHeader className="container-header">
            {!hideTitle && <h3>{title}</h3>}
            {buttonText && (
              <DetailsSectionStyledButton
                variant="contained"
                color="primary"
                onClick={onClick}
              >
                {buttonText}
              </DetailsSectionStyledButton>
            )}
          </ContainerHeader>
          {renderFields()}
        </CardContainer>
      )}
    </Container>
  );
};

export default DetailsSection;
