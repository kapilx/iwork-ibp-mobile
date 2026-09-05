import React from "react";
import mapArrow from "../../assets/svgs/map-arrow.svg";
import navigateIcon from "../../assets/svgs/navigate-icon.svg";
import {
  BREADCRUMB_KEYS,
  DETAILS_LABELS,
  GOOGLE_MAPS,
  GOOGLE_MAPS_LINK,
  NOT_AVAILABLE,
} from "../../constants";
import { formatDate, isValidDate } from "@ui/ui-lib/utils/DateFormat";
import { sanitizeUrl } from "@ui/ui-lib/utils/sanitizeUrl";
import ChipRenderer from "../Chip";
import RichTextRenderer from "../RichtextRenderer";
import { LinkText } from "../SummaryCard/styles";
import {
  ItemContainer,
  ItemKey,
  ItemLabel,
  ItemsWrapper,
  LinkData,
  MapLink,
  SectionContainer,
  SectionImageContainer,
  SectionImageIcon,
  CommonDetailsSectionTitle,
  SectionWrapper,
} from "./styles";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Typography } from "@mui/material";
import {
  buildBreadcrumbState,
  createBreadcrumbEntry,
  getBreadcrumbsFromState,
} from "@ui/ui-lib/utils";

type NestedObject = {
  [key: string]:
    | string
    | number
    | NestedObject
    | (string | number | NestedObject)[];
};

enum DetailFieldType {
  TEXT = "text",
  LINK = "link",
}

type DetailField = {
  label?: string;
  key?: string;
  type?: DetailFieldType;
  href?: string | ((data: NestedObject) => string);
  isMapLink?: boolean;
  richText?: boolean;
  isHtml?: boolean;
  isMultiple?: boolean;
  getFormattedValue?: (data: NestedObject | undefined) => string | string[];
  renderAsChip?: boolean;
  getLabel?: (data: NestedObject | undefined, index?: number) => string;
  styleMap?: Record<string, any>;
  variant?: string;
  labelStyles?: React.CSSProperties;
  ChipStyles?: React.CSSProperties;
};

type Section<T = NestedObject> = {
  sectionTitle: string;
  sectionImage?: string;
  fields: DetailField[] | ((data: T) => DetailField[]);
  backgroundColor?: string;
  textColor?: string;
  hideTitle?: boolean;
  customStyles?: React.CSSProperties;
  itemStyles?: React.CSSProperties;
  isMultiple?: boolean; // Added isMultiple at section level
  dataKey?: string; // Added dataKey at section level
  containerStyles?: React.CSSProperties;
  keyStyles?: React.CSSProperties;
};

type CommonDetailsSectionProps<T extends NestedObject> = {
  sections?: Section[];
  data: T;
};

const renderLabel = (field: DetailField, item: NestedObject, index?: number) =>
  typeof field.getLabel === "function"
    ? field.getLabel(item, index)
    : field.label
    ? field.isMultiple && index !== undefined
      ? `${field.label} ${index + 1}`
      : field.label
    : `Label ${index != null ? index + 1 : ""}`;

const CommonDetailsSection = <T extends NestedObject>({
  sections,
  data,
}: CommonDetailsSectionProps<T>) => {
  const navigate = useNavigate();
  const getNestedValue = (
    obj: NestedObject,
    path: string,
    richText = false
  ): string | number | React.ReactNode | undefined => {
    const parts = path.split(".");
    let current: NestedObject | string | number | undefined = obj;

    for (const part of parts) {
      if (current == null) return undefined;
      if (part === "__proto__" || part === "constructor" || part === "prototype") {
        return undefined;
      }
      if (part.includes("[")) {
        const [arrKey, index] = part.replace(/\]/g, "").split("[");
        const array = (current as NestedObject)[arrKey];
        if (Array.isArray(array)) {
          current = array[+index];
        } else {
          current = undefined;
        }
      } else {
        current = (current as NestedObject)[part];
      }
    }
    if (richText && typeof current === "string") {
      return current ? <RichTextRenderer htmlContent={current} /> : undefined;
    }

    if (typeof current === "string" && isValidDate(current)) {
      const formatted = formatDate(current);
      return formatted === current ? current : formatted || "Invalid Date";
    }
    return current;
  };

  const location = useLocation();
  const { id: contactId } = useParams();
  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const companyBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: DETAILS_LABELS.CONTACT,
            path: `/contacts/${contactId}`,
            key: BREADCRUMB_KEYS.CONTACT_DETAILS,
          }),
        ];

  const handleClickOnCompanyName = (companyId: number, companyName: string, entityType?: string ) => {
    navigate(`/companies/${companyId}`);
    let basePath = `/companies/${companyId}`;
    if (entityType === "insurer") {
      basePath = `/insurer/${companyId}`;
    } else if (entityType === "broker") {
      basePath = `/broker/${companyId}`;
    } else if (entityType === "tpa") {
      basePath = `/tpa/${companyId}`;
    }
    const destinationConfig = {
      label: companyName,
      path: basePath,
      key: BREADCRUMB_KEYS.COMPANY_DETAILS,
    };
    const destinationState = buildBreadcrumbState({
      breadcrumbs: companyBreadcrumb,
      crumb: destinationConfig,
    });

    navigate(destinationConfig.path, {
      state: destinationState,
    });
  };

  return (
    <SectionWrapper data-testid="details-section">
      {sections?.map((section, sectionIdx) => {
        const renderedFields =
          typeof section.fields === "function"
            ? section.fields(data)
            : section.fields;

        // Handle section level isMultiple and dataKey
        const sectionData =
          section.isMultiple && section.dataKey
            ? (getNestedValue(data, section.dataKey) as NestedObject[]) ?? []
            : [data];
        return (
          <SectionContainer
            key={sectionIdx}
            customStyles={section.customStyles}
          >
            {!section.hideTitle && section.sectionTitle && (
              <SectionImageContainer>
                {section.sectionImage && (
                  <SectionImageIcon
                    src={section.sectionImage}
                    alt={section.sectionTitle}
                  />
                )}
                <CommonDetailsSectionTitle data-testid="section-title">
                  {section.sectionTitle}
                </CommonDetailsSectionTitle>
              </SectionImageContainer>
            )}
            {sectionData.length === 0 && (
              <ItemsWrapper itemStyles={section.itemStyles}>
                {renderedFields.map((field, idx) => (
                  <ItemContainer key={idx} style={section.containerStyles}>
                    <ItemLabel>{field.label || "No Data Available"}</ItemLabel>{" "}
                    {/* Render each field's label */}
                    <ItemKey style={section.keyStyles}>
                      {NOT_AVAILABLE} {/* Fallback value */}
                    </ItemKey>
                  </ItemContainer>
                ))}
              </ItemsWrapper>
            )}
            {sectionData.map((item, itemIndex) => (
              <ItemsWrapper
                itemStyles={section.itemStyles}
                key={itemIndex}
                data-testid="section-details"
              >
                {renderedFields.map((field, idx) => {
                  const keyBase = `${idx}-${itemIndex}`;
                  if (field.isHtml && field.isMultiple && field.key) {
                    const arrayData = getNestedValue(item, field.key);
                    const items = Array.isArray(arrayData) ? arrayData : [];

                    return items.map((nestedItem, index) => {
                      const valueArray = field.getFormattedValue
                        ? field.getFormattedValue(nestedItem)
                        : nestedItem;

                      return (
                        <ItemContainer
                          key={`${keyBase}-html-${index}`}
                          style={section.containerStyles}
                        >
                          <ItemLabel>
                            {renderLabel(field, nestedItem, index)}
                          </ItemLabel>
                          <ItemKey style={section.keyStyles}>
                            {Array.isArray(valueArray)
                              ? valueArray.map((each, idx) => (
                                  <ItemContainer
                                    key={`${keyBase}-html-item-${idx}`}
                                    style={section.containerStyles}
                                  >
                                    <ItemLabel>{each.label}</ItemLabel>
                                    <ItemKey style={section.keyStyles}>
                                      <span>{each.value ?? NOT_AVAILABLE}</span>
                                    </ItemKey>
                                  </ItemContainer>
                                ))
                              : NOT_AVAILABLE}
                          </ItemKey>
                        </ItemContainer>
                      );
                    });
                  }

                  if (field.isMultiple && field.key) {
                    const arrayData = getNestedValue(item, field.key);
                    const items = Array.isArray(arrayData) ? arrayData : [];

                    if (items.length === 0) {
                      return (
                        <ItemContainer
                          key={keyBase}
                          style={section.containerStyles}
                        >
                          <ItemLabel>{field.label}</ItemLabel>
                          <ItemKey style={section.keyStyles}>
                            {NOT_AVAILABLE}
                          </ItemKey>
                        </ItemContainer>
                      );
                    }

                    return items.map((nestedItem, index) => {
                      const value = field.getFormattedValue
                        ? field.getFormattedValue(nestedItem)
                        : nestedItem;
                      return (
                        <ItemContainer
                          key={`${keyBase}-multi-${index}`}
                          style={section.containerStyles}
                        >
                          <ItemLabel>
                            {renderLabel(field, nestedItem, index)}
                          </ItemLabel>
                          <ItemKey style={section.keyStyles}>
                            <span>{value ?? `${NOT_AVAILABLE}`}</span>
                            {field.isMapLink && typeof value === "string" && (
                              <MapLink
                                href={`${GOOGLE_MAPS_LINK}${encodeURIComponent(
                                  value
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Open in Google Maps"
                              >
                                <span>{GOOGLE_MAPS}</span>
                                <img src={mapArrow} alt="arrow mark" />
                              </MapLink>
                            )}
                          </ItemKey>
                        </ItemContainer>
                      );
                    });
                  }

                  const rawValue = field.getFormattedValue
                    ? field.getFormattedValue(item)
                    : getNestedValue(item, field.key || "", field.richText);

                  const values = Array.isArray(rawValue)
                    ? rawValue
                    : [rawValue];

                  return (
                    <ItemContainer
                      key={keyBase}
                      style={section.containerStyles}
                    >
                      {field.label && (
                        <ItemLabel>
                          {renderLabel(field, item, itemIndex)}
                        </ItemLabel>
                      )}
                      <ItemKey style={section.keyStyles}>
                        {values.map((val, i) => {
                          if (field.renderAsChip && val) {
                            // Render ChipRenderer if specified
                            return (
                              <ChipRenderer
                                key={i}
                                value={val.toString()}
                                styleMap={field.styleMap}
                                variant={field.variant || "normal"}
                                labelClass={field.labelStyles}
                                ChipStyles={field.ChipStyles}
                              />
                            );
                          }

                          if (
                            field.type === DetailFieldType.LINK &&
                            field.href
                          ) {
                            const hrefValue =
                              typeof field.href === "function"
                                ? field.href(item)
                                : field.href;

                            return (
                              <LinkText
                                key={i}
                                href={
                                  hrefValue &&
                                  hrefValue.trim().toLowerCase() !== "n/a" &&
                                  (hrefValue.startsWith("http://") ||
                                    hrefValue.startsWith("https://"))
                                    ? hrefValue
                                    : hrefValue &&
                                      hrefValue.trim().toLowerCase() !== "n/a"
                                    ? `https://${hrefValue}`
                                    : undefined // Prevent link creation if hrefValue is invalid
                                }
                                target={
                                  hrefValue &&
                                  hrefValue.trim().toLowerCase() !== "n/a"
                                    ? "_blank"
                                    : undefined
                                }
                                rel={
                                  hrefValue &&
                                  hrefValue.trim().toLowerCase() !== "n/a"
                                    ? "noopener noreferrer"
                                    : undefined
                                }
                              >
                                {hrefValue &&
                                hrefValue.trim() &&
                                hrefValue.trim().toLowerCase() !== "n/a" ? (
                                  <>
                                    <LinkData>{hrefValue}</LinkData>
                                    <img src={navigateIcon} alt="navigate" />
                                  </>
                                ) : (
                                  NOT_AVAILABLE
                                )}
                              </LinkText>
                            );
                          }
                          if (field.key === "company" && val) {
                            return typeof val === "object" ? (
                              <LinkText
                                key={i}
                                onClick={() =>
                                  handleClickOnCompanyName(
                                    val.companyId,
                                    val.companyName,
                                    val.entityType
                                  )
                                }
                                style={{ cursor: "pointer", color: "blue" }}
                              >
                                {val.companyName}
                              </LinkText>
                            ) : (
                              <Typography>{val}</Typography>
                            );
                          }
                          const URL_REGEX = /^https?:\/\/[^\s]+$/i;
                          const isUrl =
                            typeof val === "string" && URL_REGEX.test(val);
                          return (
                            <ItemKey key={i} style={section.keyStyles}>
                              {val == null ? (
                                NOT_AVAILABLE
                              ) : isUrl ? (
                                <LinkText href={sanitizeUrl(val)} target="_blank">
                                  {val}
                                  <img src={navigateIcon} alt="navigate" />
                                </LinkText>
                              ) : (
                                val
                              )}
                            </ItemKey>
                          );
                        })}

                        {/* Render the map link separately */}
                        {/* {field.isMapLink &&
                          values.length > 0 &&
                          typeof values[0] === "string" &&
                          values[0] !== NOT_AVAILABLE && (
                            <MapLink
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                values[0]
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Open in Google Maps"
                            >
                              <span>{GOOGLE_MAPS}</span>
                              <img src={mapArrow} alt="arrow mark" />
                            </MapLink>
                          )} */}
                      </ItemKey>
                    </ItemContainer>
                  );
                })}
              </ItemsWrapper>
            ))}
          </SectionContainer>
        );
      })}
    </SectionWrapper>
  );
};

export default CommonDetailsSection;
