import React, { useState } from 'react';
import { Autocomplete, Box, CircularProgress, IconButton, TextField, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, endPoints, useApiQuery, useDebounce } from '@ui/ui-lib';
import { TEMPLATE_MANAGEMENT_BASE_PATH } from '../../../routes/template-management.route';
import { EmptyStateBox, HeaderRow, PickerStep, SectionHeading, SectionSubheading, TabContainer } from './styles';
import { CompanySearchResult, TemplateCompanyOverrideSummary } from './types';

// theme.palette.text.secondary is white (see ui-lib/styles/Theme/colors.ts)
// — see the identical comment in NewCustomisation.tsx.
const VISIBLE_MUTED_TEXT_COLOR = 'grey.700';
const INPUT_LABEL_SX = {
  color: VISIBLE_MUTED_TEXT_COLOR,
  '&.Mui-focused': { color: 'primary.main' },
};

/**
 * "Customise for a Company" — company-wide equivalent of NewCustomisation.tsx,
 * for iwork/internal-CRM event types (Opportunity Creation, MIR reports,
 * etc.) with no domain concept at all — just one picker step (company),
 * not two (company then domain).
 */
const NewCompanyCustomisation: React.FC = () => {
  const navigate = useNavigate();
  const { defaultTemplateId: defaultTemplateIdParam } = useParams<{ defaultTemplateId: string }>();
  const defaultTemplateId = defaultTemplateIdParam ? parseInt(defaultTemplateIdParam, 10) : undefined;

  const [companySearch, setCompanySearch] = useState('');
  const debouncedSearch = useDebounce(companySearch, 400);
  const [selectedCompany, setSelectedCompany] = useState<CompanySearchResult | null>(null);

  // Already-customized companies for this template, so one isn't offered
  // again here — it's reachable from the detail page's existing-overrides
  // list instead.
  const { data: overridesResponse } = useApiQuery({
    url: defaultTemplateId ? endPoints.templateCompanyOverridesSummary(defaultTemplateId) : '',
    queryKey: ['template-company-overrides-summary', defaultTemplateId],
    enabled: Boolean(defaultTemplateId),
  });
  const existingCompanyIds: number[] = ((overridesResponse as any)?.data ?? []).map(
    (o: TemplateCompanyOverrideSummary) => o.companyId
  );

  // Always fetches — a default page of companies shows immediately on
  // load (no need to type first), and typing narrows it down via `search`.
  const {
    data: companyResponse,
    isFetching: isSearchingCompanies,
  } = useApiQuery({
    url: `${endPoints.companiesListInSelectField}?page=1&limit=50${
      debouncedSearch.trim() ? `&search=${encodeURIComponent(debouncedSearch.trim())}` : ''
    }`,
    queryKey: ['company-search-for-customisation', debouncedSearch],
  });
  const allCompanyOptions: CompanySearchResult[] = (companyResponse as any)?.data?.data ?? [];
  const companyOptions = allCompanyOptions.filter((c) => !existingCompanyIds.includes(c.id));

  const handleBack = () => navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}/customise/${defaultTemplateId}`);

  const handleContinue = () => {
    if (!defaultTemplateId || !selectedCompany) return;
    const params = new URLSearchParams({
      companyId: String(selectedCompany.id),
      companyName: selectedCompany.companyName,
    });
    // Straight to the focused editor — not back to the detail page — per
    // the same product direction NewCustomisation.tsx follows.
    navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}/customise/${defaultTemplateId}/edit?${params.toString()}`);
  };

  if (!defaultTemplateId) {
    return (
      <TabContainer>
        <EmptyStateBox>
          <Typography sx={{ fontSize: 14 }}>No template selected.</Typography>
        </EmptyStateBox>
      </TabContainer>
    );
  }

  return (
    <TabContainer>
      <HeaderRow>
        <Box display="flex" alignItems="center" gap={1.5}>
          <IconButton size="small" onClick={handleBack} aria-label="Back">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <SectionHeading>Customise for a Company</SectionHeading>
            <SectionSubheading>
              Pick the company to create a new company-wide customization for. This never
              touches the shared default or any other company.
            </SectionSubheading>
          </Box>
        </Box>
      </HeaderRow>

      <PickerStep>
        <Autocomplete
          size="small"
          options={companyOptions}
          value={selectedCompany}
          getOptionLabel={(option) => option.companyName}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          loading={isSearchingCompanies}
          filterOptions={(options) => options}
          noOptionsText={
            <Typography sx={{ fontSize: 13, color: VISIBLE_MUTED_TEXT_COLOR }}>
              {isSearchingCompanies
                ? 'Searching…'
                : debouncedSearch.trim()
                ? `No companies found matching "${debouncedSearch.trim()}"`
                : 'No companies found'}
            </Typography>
          }
          onInputChange={(_event, value) => setCompanySearch(value)}
          onChange={(_event, company) => setSelectedCompany(company)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Company"
              placeholder="Select Company"
              InputLabelProps={{ ...params.InputLabelProps, sx: INPUT_LABEL_SX }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isSearchingCompanies ? <CircularProgress size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <Box display="flex" gap={1.5} justifyContent="flex-end">
          <Button variantType="secondary" sizeType="small" onClick={handleBack}>
            Cancel
          </Button>
          <Button
            variantType="primary"
            sizeType="small"
            onClick={handleContinue}
            disabled={!selectedCompany}
          >
            Continue
          </Button>
        </Box>
      </PickerStep>
    </TabContainer>
  );
};

export default NewCompanyCustomisation;
