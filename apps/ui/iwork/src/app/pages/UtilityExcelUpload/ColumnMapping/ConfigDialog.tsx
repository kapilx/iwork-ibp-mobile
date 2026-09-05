import React, { useState, useEffect } from "react";
import {
    FormControl,
    MenuItem,
    SelectChangeEvent
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
    StyledDialog,
    StyledDialogTitle,
    DialogHeaderContent,
    TitleText,
    SubTitleText,
    StyledDialogContent,
    SectionTitle,
    InfoBox,
    StyledSelect,
    PreviewContainer,
    PreviewItem,
    PreviewSourceText,
    PreviewTargetText,
    StyledArrowIcon,
    MappingList,
    MappingRow,
    MappingLabel,
    FlexFormControl,
    MappingPreviewContainer,
    MappingPreviewRow,
    MappingPreviewLabel,
    MappingPreviewValue,
    CloseIconButton,
    SourceColumnSection,
    PreviewFormatText,
    ConfigItem,
    PreviewSection,
    HeaderTitleWrapper,
    StyledDialogActions,
    CancelButton,
    ApplyButton,
} from "./ConfigDialog.styles";
import { transformDate, formatNumber, convertExcelDateToString, detectDateFormat } from "../utils";
import { CONFIG_DIALOG_TEXT, CONFIG_OPTIONS, CONFIG_TYPES } from "./constants";

// --- Types ---

export interface DateConfig {
    sourceFormat: string;
    targetFormat: string;
}

export interface NumberConfig {
    decimalSeparator: string;
    thousandSeparator: string;
}

export interface GenderConfig {
    mappings: {
        [key: string]: string;
    };
}

export type ConfigType = typeof CONFIG_TYPES[keyof typeof CONFIG_TYPES];

export interface ConfigDialogProps {
    open: boolean;
    onClose: () => void;
    onApply: (config: DateConfig | NumberConfig | GenderConfig) => void;
    type: ConfigType;
    fieldName: string;
    sourceColumn: string;
    initialConfig?: any;
    sampleData?: string[];
    direction?: string;
}

// --- Constants ---



// --- Component ---

export const ConfigDialog: React.FC<ConfigDialogProps> = ({
    open,
    onClose,
    onApply,
    type,
    fieldName,
    sourceColumn,
    initialConfig,
    sampleData = [],
    direction = 'INBOUND',
}) => {
    // State for Date Config
    const [dateFormat, setDateFormat] = useState<DateConfig>({
        sourceFormat: CONFIG_OPTIONS.DEFAULT_DATE_FORMATS.SOURCE,
        targetFormat: CONFIG_OPTIONS.DEFAULT_DATE_FORMATS.TARGET
    });

    // State for Number Config
    const [numberConfig, setNumberConfig] = useState<NumberConfig>({
        decimalSeparator: CONFIG_OPTIONS.DEFAULT_NUMBER_CONFIG.DECIMAL,
        thousandSeparator: CONFIG_OPTIONS.DEFAULT_NUMBER_CONFIG.THOUSAND
    });

    // State for Gender Config
    const [genderMappings, setGenderMappings] = useState<{ [key: string]: string }>({
        [CONFIG_OPTIONS.GENDER_SOURCES[0]]: CONFIG_OPTIONS.DEFAULT_GENDER_MAPPING.MALE_KEY,
        [CONFIG_OPTIONS.GENDER_SOURCES[1]]: CONFIG_OPTIONS.DEFAULT_GENDER_MAPPING.FEMALE_KEY,
    });

    // Initialize state when dialog opens
    useEffect(() => {
        if (open) {
            if (type === CONFIG_TYPES.DATE) {
                const detected = sampleData[0] ? detectDateFormat(sampleData[0]) : CONFIG_OPTIONS.DEFAULT_DATE_FORMATS.SOURCE;

                // If we have an initial config, use it. 
                // BUT if initialConfig.sourceFormat is empty OR it's the default "DD/MM/YYYY" 
                // and we detected something more specific like "YYYY-MM-DD", favor detected.
                let finalSourceFormat = initialConfig?.sourceFormat || detected;
                if (initialConfig?.sourceFormat === CONFIG_OPTIONS.DEFAULT_DATE_FORMATS.SOURCE && detected !== CONFIG_OPTIONS.DEFAULT_DATE_FORMATS.SOURCE) {
                    finalSourceFormat = detected;
                }

                setDateFormat({
                    sourceFormat: finalSourceFormat,
                    targetFormat: initialConfig?.targetFormat || initialConfig?.sourceFormat || CONFIG_OPTIONS.DEFAULT_DATE_FORMATS.TARGET
                });
            } else if (type === CONFIG_TYPES.NUMBER) {
                setNumberConfig({
                    decimalSeparator: initialConfig?.decimalSeparator || CONFIG_OPTIONS.DEFAULT_NUMBER_CONFIG.DECIMAL,
                    thousandSeparator: initialConfig?.thousandSeparator || CONFIG_OPTIONS.DEFAULT_NUMBER_CONFIG.THOUSAND
                });
            } else if (type === CONFIG_TYPES.GENDER) {
                setGenderMappings(initialConfig?.mappings || {
                    [CONFIG_OPTIONS.GENDER_SOURCES[0]]: CONFIG_OPTIONS.DEFAULT_GENDER_MAPPING.MALE_KEY,
                    [CONFIG_OPTIONS.GENDER_SOURCES[1]]: CONFIG_OPTIONS.DEFAULT_GENDER_MAPPING.FEMALE_KEY,
                });
            }
        }
    }, [open, type, initialConfig, sampleData]);

    const handleApply = () => {
        if (type === CONFIG_TYPES.DATE) {
            onApply(dateFormat);
        } else if (type === CONFIG_TYPES.NUMBER) {
            onApply(numberConfig);
        } else if (type === CONFIG_TYPES.GENDER) {
            // Apply mappings for both explicit values and their shorthand versions (legacy logic)
            const maleKey = CONFIG_OPTIONS.GENDER_SOURCES[0];
            const femaleKey = CONFIG_OPTIONS.GENDER_SOURCES[1];
            const fullMappings = {
                [maleKey]: genderMappings[maleKey] || CONFIG_OPTIONS.DEFAULT_GENDER_MAPPING.MALE_KEY,
                [femaleKey]: genderMappings[femaleKey] || CONFIG_OPTIONS.DEFAULT_GENDER_MAPPING.FEMALE_KEY,
                [CONFIG_OPTIONS.DEFAULT_GENDER_MAPPING.MALE_KEY]: genderMappings[maleKey] || CONFIG_OPTIONS.DEFAULT_GENDER_MAPPING.MALE_KEY,
                [CONFIG_OPTIONS.DEFAULT_GENDER_MAPPING.FEMALE_KEY]: genderMappings[femaleKey] || CONFIG_OPTIONS.DEFAULT_GENDER_MAPPING.FEMALE_KEY,
            };
            onApply({ mappings: fullMappings });
        }
        onClose();
    };

    const renderContent = () => {
        switch (type) {
            case CONFIG_TYPES.DATE:
                const dateSampleData = sampleData.length > 0 ? sampleData.slice(0, 3) : CONFIG_OPTIONS.SAMPLE_DATA_DEFAULTS.DATE;
                return (
                    <>
                        <ConfigItem size="large">
                            <SectionTitle>{CONFIG_DIALOG_TEXT.TARGET_FORMAT_LABEL}</SectionTitle>
                            <FormControl fullWidth size="small">
                                <StyledSelect
                                    disabled={direction === 'INBOUND'}
                                    value={dateFormat.targetFormat}
                                    onChange={(e: SelectChangeEvent) => setDateFormat({ ...dateFormat, targetFormat: e.target.value as string })}
                                >
                                    {CONFIG_OPTIONS.DATE_FORMATS.map((format) => (
                                        <MenuItem key={format} value={format}>{format}</MenuItem>
                                    ))}
                                </StyledSelect>
                            </FormControl>
                        </ConfigItem>
                        <PreviewSection>
                            <SectionTitle>{CONFIG_DIALOG_TEXT.PREVIEW_TRANSFORMATION_LABEL}</SectionTitle>
                            <PreviewFormatText>
                                Format: {dateFormat.targetFormat}
                            </PreviewFormatText>
                            <PreviewContainer>
                                {dateSampleData.map((sample, idx) => {
                                    return (
                                        <PreviewItem key={idx}>
                                            <PreviewTargetText>
                                                {transformDate(sample, dateFormat.sourceFormat, dateFormat.targetFormat)}
                                            </PreviewTargetText>
                                        </PreviewItem>
                                    );
                                })}
                            </PreviewContainer>
                        </PreviewSection>
                    </>
                );

            case CONFIG_TYPES.NUMBER:
                const numSamples = sampleData.slice(0, 3).filter(Boolean);
                return (
                    <>
                        <ConfigItem size="small">
                            <SectionTitle>{CONFIG_DIALOG_TEXT.DECIMAL_SEPARATOR_LABEL}</SectionTitle>
                            <FormControl fullWidth size="small">
                                <StyledSelect
                                    value={numberConfig.decimalSeparator}
                                    onChange={(e: SelectChangeEvent) => setNumberConfig({ ...numberConfig, decimalSeparator: e.target.value as string })}
                                >
                                    {CONFIG_OPTIONS.NUMBER_SEPARATORS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                    ))}
                                </StyledSelect>
                            </FormControl>
                        </ConfigItem>
                        <ConfigItem size="large">
                            <SectionTitle>{CONFIG_DIALOG_TEXT.THOUSAND_SEPARATOR_LABEL}</SectionTitle>
                            <FormControl fullWidth size="small">
                                <StyledSelect
                                    value={numberConfig.thousandSeparator}
                                    onChange={(e: SelectChangeEvent) => setNumberConfig({ ...numberConfig, thousandSeparator: e.target.value as string })}
                                >
                                    {CONFIG_OPTIONS.NUMBER_SEPARATORS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                    ))}
                                </StyledSelect>
                            </FormControl>
                        </ConfigItem>
                        {numSamples.length > 0 && (
                            <PreviewSection>
                                <SectionTitle>{CONFIG_DIALOG_TEXT.PREVIEW_TRANSFORMATION_LABEL}</SectionTitle>
                                <PreviewContainer>
                                    {numSamples.map((sample, idx) => (
                                        <PreviewItem key={idx}>
                                            <PreviewSourceText>{sample}</PreviewSourceText>
                                            <StyledArrowIcon>
                                                <ArrowForwardIcon />
                                            </StyledArrowIcon>
                                            <PreviewTargetText>
                                                {formatNumber(sample, numberConfig)}
                                            </PreviewTargetText>
                                        </PreviewItem>
                                    ))}
                                </PreviewContainer>
                            </PreviewSection>
                        )}
                    </>
                );

            case CONFIG_TYPES.GENDER:
                return (
                    <>
                        <ConfigItem size="large">
                            <SectionTitle>{CONFIG_DIALOG_TEXT.VALUE_MAPPING_LABEL}</SectionTitle>
                            <MappingList>
                                {CONFIG_OPTIONS.GENDER_SOURCES.map((source) => {
                                    const options = source === CONFIG_OPTIONS.GENDER_SOURCES[0]
                                        ? CONFIG_OPTIONS.GENDER_MAPPING_OPTIONS.Male
                                        : CONFIG_OPTIONS.GENDER_MAPPING_OPTIONS.Female;
                                    return (
                                        <MappingRow key={source}>
                                            <MappingLabel>
                                                {source}
                                            </MappingLabel>
                                            <StyledArrowIcon large>
                                                <ArrowForwardIcon />
                                            </StyledArrowIcon>
                                            <FlexFormControl size="small">
                                                <StyledSelect
                                                    value={genderMappings[source] || (source === 'Male' ? CONFIG_OPTIONS.DEFAULT_GENDER_MAPPING.MALE_KEY : CONFIG_OPTIONS.DEFAULT_GENDER_MAPPING.FEMALE_KEY)}
                                                    onChange={(e: SelectChangeEvent) => setGenderMappings({ ...genderMappings, [source]: e.target.value as string })}
                                                >
                                                    {options.map((option) => (
                                                        <MenuItem key={option} value={option}>
                                                            {option}
                                                        </MenuItem>
                                                    ))}
                                                </StyledSelect>
                                            </FlexFormControl>
                                        </MappingRow>
                                    );
                                })}
                            </MappingList>
                        </ConfigItem>
                        <PreviewSection>
                            <SectionTitle>{CONFIG_DIALOG_TEXT.PREVIEW_TRANSFORMATION_LABEL}</SectionTitle>
                            <MappingPreviewContainer>
                                {[
                                    { label: 'Male', value: genderMappings['Male'] || CONFIG_OPTIONS.DEFAULT_GENDER_MAPPING.MALE_KEY },
                                    { label: 'Female', value: genderMappings['Female'] || CONFIG_OPTIONS.DEFAULT_GENDER_MAPPING.FEMALE_KEY },
                                ].map((item, idx) => (
                                    <MappingPreviewRow key={idx}>
                                        <MappingPreviewLabel>{item.label}</MappingPreviewLabel>
                                        <StyledArrowIcon>
                                            <ArrowForwardIcon />
                                        </StyledArrowIcon>
                                        <MappingPreviewValue>{item.value}</MappingPreviewValue>
                                    </MappingPreviewRow>
                                ))}
                            </MappingPreviewContainer>
                        </PreviewSection>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <StyledDialog
            open={open}
            onClose={onClose}
        >
            <StyledDialogTitle>
                <DialogHeaderContent>
                    <HeaderTitleWrapper>
                        <TitleText>{fieldName}</TitleText>
                        <SubTitleText>{CONFIG_DIALOG_TEXT.SUBTITLE}</SubTitleText>
                    </HeaderTitleWrapper>
                    <CloseIconButton onClick={onClose}>
                        <CloseIcon fontSize="small" />
                    </CloseIconButton>
                </DialogHeaderContent>
            </StyledDialogTitle>

            <StyledDialogContent>
                <SourceColumnSection>
                    <SectionTitle>{CONFIG_DIALOG_TEXT.SOURCE_COLUMN_LABEL}</SectionTitle>
                    <InfoBox>{sourceColumn}</InfoBox>
                </SourceColumnSection>

                {renderContent()}

            </StyledDialogContent>

            <StyledDialogActions>
                <CancelButton onClick={onClose} variant="outlined">
                    {CONFIG_DIALOG_TEXT.CANCEL}
                </CancelButton>
                <ApplyButton onClick={handleApply} variant="contained">
                    {CONFIG_DIALOG_TEXT.APPLY}
                </ApplyButton>
            </StyledDialogActions>
        </StyledDialog>
    );
};
