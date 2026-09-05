import { FieldComponentProps } from "../types";
import { ControlledField } from "../utils";
import { Box, Fade, FormControl, Typography } from "@mui/material";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";
import dayjs from "dayjs";
import {
  StyledDatePickerWrapper,
  StyledDateTimePickerWrapper,
  StyledHelperText,
  StyledTypography,
  StyledSubLabel,
  TimePickerWrapperStyles,
} from "./styles";
import {
  DATE_FIELD_TYPES,
  DATE_FORMATS,
  DATE_WITH_TIME_FORMATS,
  TIME_FORMATS,
  TIME_TYPES,
} from "../../../constants";

export const AddCardIcon = (props: SvgIconProps) => {
  return (
    <SvgIcon {...props} viewBox="0 0 20 20">
      <path
        d="M4.45326 17.8417L4.74715 17.4372L4.45326 17.8417ZM3.49459 16.883L3.89909 16.5891L3.49459 16.883ZM17.4394 16.883L17.0349 16.5891L17.4394 16.883ZM16.4807 17.8417L16.1868 17.4372L16.4807 17.8417ZM16.4807 3.89686L16.1868 4.30137L16.4807 3.89686ZM17.4394 4.85553L17.0349 5.14943L17.4394 4.85553ZM4.45326 3.89686L4.74715 4.30137L4.45326 3.89686ZM3.49459 4.85553L3.89909 5.14943L3.49459 4.85553ZM12.567 3.93594C12.567 4.21208 12.7908 4.43594 13.067 4.43594C13.3431 4.43594 13.567 4.21208 13.567 3.93594H12.567ZM13.567 1.33594C13.567 1.0598 13.3431 0.835938 13.067 0.835938C12.7908 0.835938 12.567 1.0598 12.567 1.33594H13.567ZM7.36699 3.93594C7.36699 4.21208 7.59085 4.43594 7.86699 4.43594C8.14313 4.43594 8.36699 4.21208 8.36699 3.93594H7.36699ZM8.36699 1.33594C8.36699 1.0598 8.14313 0.835938 7.86699 0.835938C7.59085 0.835938 7.36699 1.0598 7.36699 1.33594H8.36699ZM18.2419 13.4693L18.7416 13.4864L18.2419 13.4693ZM13.067 18.6442L13.0499 18.1445L13.067 18.6442ZM2.69206 8.26927L2.19236 8.25215L2.69206 8.26927ZM18.2419 8.26927L18.7416 8.25215L18.2419 8.26927ZM10.467 18.6693V18.1693C8.83097 18.1693 7.64412 18.1686 6.72247 18.0687C5.81019 17.9699 5.21725 17.7787 4.74715 17.4372L4.45326 17.8417L4.15936 18.2462C4.82835 18.7322 5.61739 18.9549 6.61476 19.0629C7.60277 19.17 8.85325 19.1693 10.467 19.1693V18.6693ZM2.66699 10.8693H2.16699C2.16699 12.483 2.16631 13.7335 2.27335 14.7215C2.38141 15.7189 2.60403 16.5079 3.09008 17.1769L3.49459 16.883L3.89909 16.5891C3.55754 16.119 3.36637 15.5261 3.26753 14.6138C3.16768 13.6921 3.16699 12.5053 3.16699 10.8693H2.66699ZM4.45326 17.8417L4.74715 17.4372C4.42172 17.2007 4.13553 16.9145 3.89909 16.5891L3.49459 16.883L3.09008 17.1769C3.38819 17.5872 3.74904 17.9481 4.15936 18.2462L4.45326 17.8417ZM17.4394 16.883L17.0349 16.5891C16.7985 16.9145 16.5123 17.2007 16.1868 17.4372L16.4807 17.8417L16.7746 18.2462C17.1849 17.9481 17.5458 17.5872 17.8439 17.1769L17.4394 16.883ZM16.4807 3.89686L16.1868 4.30137C16.5123 4.53781 16.7985 4.824 17.0349 5.14943L17.4394 4.85553L17.8439 4.56164C17.5458 4.15132 17.1849 3.79047 16.7746 3.49236L16.4807 3.89686ZM4.45326 3.89686L4.15936 3.49236C3.74904 3.79047 3.38819 4.15132 3.09008 4.56164L3.49459 4.85553L3.89909 5.14943C4.13553 4.824 4.42172 4.53781 4.74715 4.30137L4.45326 3.89686ZM18.267 10.8693H17.767C17.767 11.8851 17.7669 12.7308 17.7422 13.4522L18.2419 13.4693L18.7416 13.4864C18.7671 12.7442 18.767 11.8796 18.767 10.8693H18.267ZM18.2419 13.4693L17.7422 13.4522C17.6871 15.0616 17.5081 15.9378 17.0349 16.5891L17.4394 16.883L17.8439 17.1769C18.5099 16.2602 18.6861 15.1082 18.7416 13.4864L18.2419 13.4693ZM10.467 18.6693V19.1693C11.4773 19.1693 12.342 19.1693 13.0841 19.1439L13.067 18.6442L13.0499 18.1445C12.3285 18.1692 11.4828 18.1693 10.467 18.1693V18.6693ZM13.067 18.6442L13.0841 19.1439C14.7059 19.0883 15.8579 18.9122 16.7746 18.2462L16.4807 17.8417L16.1868 17.4372C15.5355 17.9104 14.6593 18.0893 13.0499 18.1445L13.067 18.6442ZM2.66699 10.8693H3.16699C3.16699 9.85343 3.16705 9.00777 3.19177 8.28639L2.69206 8.26927L2.19236 8.25215C2.16693 8.9943 2.16699 9.85897 2.16699 10.8693H2.66699ZM2.69206 8.26927L3.19177 8.28639C3.24691 6.67694 3.42591 5.80071 3.89909 5.14943L3.49459 4.85553L3.09008 4.56164C2.42406 5.47834 2.24792 6.63035 2.19236 8.25215L2.69206 8.26927ZM2.69206 8.26927V8.76927H18.2419V8.26927V7.76927H2.69206V8.26927ZM18.267 10.8693H18.767C18.767 9.85897 18.7671 8.9943 18.7416 8.25215L18.2419 8.26927L17.7422 8.28639C17.7669 9.00777 17.767 9.85343 17.767 10.8693H18.267ZM18.2419 8.26927L18.7416 8.25215C18.6861 6.63035 18.5099 5.47834 17.8439 4.56164L17.4394 4.85553L17.0349 5.14943C17.5081 5.80071 17.6871 6.67694 17.7422 8.28639L18.2419 8.26927ZM13.067 3.93594H13.567V3.09434H13.067H12.567V3.93594H13.067ZM13.067 3.09434H13.567V1.33594H13.067H12.567V3.09434H13.067ZM10.467 3.06927V3.56927C11.4828 3.56927 12.3285 3.56933 13.0499 3.59405L13.067 3.09434L13.0841 2.59464C12.342 2.56921 11.4773 2.56927 10.467 2.56927V3.06927ZM13.067 3.09434L13.0499 3.59405C14.6593 3.64919 15.5355 3.82818 16.1868 4.30137L16.4807 3.89686L16.7746 3.49236C15.8579 2.82634 14.7059 2.6502 13.0841 2.59464L13.067 3.09434ZM7.86699 3.93594H8.36699V3.09434H7.86699H7.36699V3.93594H7.86699ZM7.86699 3.09434H8.36699V1.33594H7.86699H7.36699V3.09434H7.86699ZM10.467 3.06927V2.56927C9.45669 2.56927 8.59202 2.56921 7.84987 2.59464L7.86699 3.09434L7.88411 3.59405C8.60549 3.56933 9.45116 3.56927 10.467 3.56927V3.06927ZM7.86699 3.09434L7.84987 2.59464C6.22807 2.6502 5.07606 2.82634 4.15936 3.49236L4.45326 3.89686L4.74715 4.30137C5.39844 3.82818 6.27466 3.64919 7.88411 3.59405L7.86699 3.09434Z"
        fill="#0A73E9"
      />
    </SvgIcon>
  );
};
export const AddTimeSvgIcon = (props: SvgIconProps) => {
  return (
    <svg {...props} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0ZM8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1ZM8 3.33594C8.27614 3.33594 8.5 3.5598 8.5 3.83594V8.33594H12.167L12.2676 8.3457C12.4954 8.39235 12.667 8.59433 12.667 8.83594C12.667 9.07754 12.4954 9.27952 12.2676 9.32617L12.167 9.33594H8C7.72386 9.33594 7.5 9.11208 7.5 8.83594V3.83594C7.5 3.5598 7.72386 3.33594 8 3.33594Z"
        fill="#007DD8"
      />
    </svg>
  );
};

const DateField = ({
  field,
  control,
  trigger,
  setValue,
  popperDetails,
}: FieldComponentProps) => {
  return (
    <ControlledField
      field={field}
      control={control}
      render={(sharedProps) => {
        const { label, value, onChange, ...rest } = sharedProps;
        const shouldShowAge = Boolean(field.componentProps?.showAge);
        const ageValue =
          value && dayjs(value).isValid()
            ? dayjs().diff(dayjs(value), "year")
            : null;

        return (
          <FormControl fullWidth>
            {field.label && (
              <StyledTypography
                variant="body2"
                id={`${field.name}-label`}
                error={!!rest.error}
              >
                {label}
              </StyledTypography>
            )}
            {field.subLabel && (
              <StyledSubLabel variant="body2">{field.subLabel}</StyledSubLabel>
            )}
            {(() => {
              switch (field.type) {
                case DATE_FIELD_TYPES.DATE:
                  return (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Box  sx={{
                            flex: 1,
                            minWidth: field.componentProps?.minWidth || "200px",
                            "@media (max-width:1366px)": {
                                minWidth: "150px"
                            }
                        }}>
                        <StyledDatePickerWrapper
                          error={!!rest.error}
                          format={DATE_FORMATS.DATE_MONTH_YEAR}
                          minDate={(field.componentProps as any)?.minDate}
                          maxDate={(field.componentProps as any)?.maxDate}
                          slots={{
                            openPickerIcon: AddCardIcon,
                          }}
                          slotProps={{
                            popper: popperDetails ??
                              field.componentProps?.popperDetails ?? {
                                modifiers: [], // Optional: add popper modifiers if needed
                              },
                            paper: {
                              TransitionComponent: Fade,
                            },
                          }}
                          value={
                            value
                              ? dayjs(value, [
                                  DATE_FORMATS.YEAR_MONTH_DATE,
                                  DATE_FORMATS.DATE_MONTH_YEAR,
                                ])
                              : null
                          }
                          onChange={(newDate: dayjs.Dayjs | null) => {
                            const formatted = newDate
                              ? dayjs(newDate).format(
                                  DATE_FORMATS.YEAR_MONTH_DATE
                                )
                              : "";
                            if (field.componentProps?.onChange) {
                              field.componentProps.onChange(newDate);
                            }
                            const updatedValue = formatted
                              ? formatted
                              : newDate;
                            if (field.syncFieldName) {
                              setValue(field.syncFieldName, updatedValue, {
                                shouldDirty: true,
                                shouldTouch: true,
                                shouldValidate: true,
                              });
                            }
                            onChange(updatedValue);
                            trigger && trigger(field.name);
                            if (
                              field?.apiDependencies?.clearFieldsOnChange
                                ?.length
                            ) {
                              field?.apiDependencies.clearFieldsOnChange.forEach(
                                (fieldName) => {
                                  setValue(fieldName, null);
                                }
                              );
                            }
                          }}
                          {...rest}
                        />
                      </Box>
                      {shouldShowAge && ageValue !== null && (
                          <Typography
                            variant="body2"
                            sx={{
                              whiteSpace: "nowrap",
                              color: "text.main",
                              minWidth: "fit-content",
                              flexShrink: 0,
                            }}
                          >
                            Age: {ageValue}
                          </Typography>
                      )}
                    </Box>
                  );
                case DATE_FIELD_TYPES.DATE_TIME:
                case "datetime":
                  return (
                    <StyledDateTimePickerWrapper
                      error={!!rest.error}
                      format={DATE_WITH_TIME_FORMATS.DATE_MONTH_YEAR__TIME}
                      slots={{
                        openPickerIcon: AddCardIcon,
                      }}
                      slotsProps={{
                        popper: {
                          modifiers: [], // Optional: add popper modifiers if needed
                        },
                        paper: {
                          TransitionComponent: Fade,
                        },
                      }}
                      value={value ? dayjs(value) : null}
                      onChange={(newDateTime: dayjs.Dayjs | null) => {
                        const formatted = newDateTime
                          ? dayjs(newDateTime).format(
                              DATE_WITH_TIME_FORMATS.ISO_WITH_MILLISECONDS
                            )
                          : "";
                        if (field.componentProps?.onChange) {
                          field.componentProps.onChange(newDateTime);
                        }
                        onChange(formatted ? formatted : newDateTime);
                        trigger && trigger(field.name);
                        if (
                          field?.apiDependencies?.clearFieldsOnChange?.length
                        ) {
                          field?.apiDependencies.clearFieldsOnChange.forEach(
                            (fieldName) => {
                              setValue(fieldName, null);
                            }
                          );
                        }
                      }}
                      {...rest}
                    />
                  );
                case DATE_FIELD_TYPES.TIME:
                  return (
                    <TimePickerWrapperStyles
                      format={TIME_FORMATS.HOUR_MINUTE_SECOND}
                      views={[
                        TIME_TYPES.HOURS,
                        TIME_TYPES.MINUTES,
                        TIME_TYPES.SECONDS,
                      ]}
                      value={
                        value
                          ? dayjs(
                              value.toString(),
                              TIME_FORMATS.HOUR_MINUTE_SECOND
                            )
                          : null
                      }
                      slots={{
                        openPickerIcon: AddTimeSvgIcon,
                      }}
                      onChange={(newTime: dayjs.Dayjs | null) => {
                        const formatted =
                          newTime && newTime.isValid()
                            ? newTime.format(TIME_FORMATS.HOUR_MINUTE_SECOND)
                            : "";
                        onChange(formatted ? formatted : newTime);
                        trigger && trigger(field.name);
                      }}
                      {...rest}
                    />
                  );
                case DATE_FIELD_TYPES.MONTH_YEAR:
                  return (
                    <StyledDatePickerWrapper
                      {...rest}
                      format={DATE_FORMATS.MONTH_YEAR}
                      views={["year", "month"]}
                      openTo="month"
                      localeText={{ fieldMonthPlaceholder: () => "MMM" }}
                      slotsProps={{
                        popper: {
                          modifiers: [],
                        },
                        paper: {
                          TransitionComponent: Fade,
                        },
                      }}
                      value={
                        value &&
                        dayjs(value.toString(), DATE_FORMATS.MONTH_YEAR).isValid()
                          ? dayjs(value.toString(), DATE_FORMATS.MONTH_YEAR)
                          : null
                      }
                      onChange={(newDate: dayjs.Dayjs | null) => {
                        const formatted =
                          newDate && newDate.isValid()
                            ? newDate.format(DATE_FORMATS.MONTH_YEAR)
                            : "";
                        onChange(formatted);
                        trigger && trigger(field.name);
                      }}
                    />
                  );
                case DATE_FIELD_TYPES.YEAR:
                  return (
                    <StyledDatePickerWrapper
                      {...rest}
                      format={DATE_FORMATS.YEAR}
                      views={[DATE_FIELD_TYPES.YEAR]}
                      slotsProps={{
                        popper: {
                          modifiers: [], // Optional: add popper modifiers if needed
                        },
                        paper: {
                          TransitionComponent: Fade,
                        },
                      }}
                      value={
                        value &&
                        dayjs(value.toString(), DATE_FORMATS.YEAR).isValid()
                          ? dayjs(value.toString(), DATE_FORMATS.YEAR)
                          : null
                      }
                      onChange={(newDate: dayjs.Dayjs | null) => {
                        const formatted =
                          newDate && newDate.isValid()
                            ? newDate.format(DATE_FORMATS.YEAR)
                            : "";
                        onChange(formatted);
                        trigger && trigger(field.name);
                      }}
                    />
                  );
                default:
                  return null;
              }
            })()}
            {rest.helperText && (
              <StyledHelperText error={!!rest.error}>
                {rest.helperText}
              </StyledHelperText>
            )}
          </FormControl>
        );
      }}
    />
  );
};

export default DateField;
