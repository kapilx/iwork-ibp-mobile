import React, { useState } from 'react';
import { Autocomplete, Box, CircularProgress, IconButton, TextField, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, endPoints, useApiQuery, useDebounce } from '@ui/ui-lib';
import { TEMPLATE_MANAGEMENT_BASE_PATH } from '../../../routes/template-management.route';
import { EmptyStateBox, HeaderRow, PickerStep, SectionHeading, SectionSubheading, TabContainer } from './styles';
import { CompanyPortalConfigListItem, CompanySearchResult, TemplateOverrideSummary } from './types';

// theme.palette.text.secondary is white (see ui-lib/styles/Theme/colors.ts)
// — that's what MUI's Autocomplete/InputLabel fall back to by default for
// "resting" (unfocused/empty) label and muted helper text, which reads as
// blank on this screen's light background. Force a real, always-visible
// gray instead of depending on that token here.
const VISIBLE_MUTED_TEXT_COLOR = 'grey.700';
const INPUT_LABEL_SX = {
  color: VISIBLE_MUTED_TEXT_COLOR,
  '&.Mui-focused': { color: 'primary.main' },
};

/**
 * "Customise for a different company/domain" — a full page (not a modal),
 * per explicit product direction: pick a company, then one of its domains
 * that doesn't already have a customization of this template, then land
 * back on the detail page with that selection pre-opened for editing. No
 * template-editing UI lives on this page itself — just the two-step
 * picker, same company-search + portal-config-list endpoints already used
 * elsewhere in this app (no new backend surface, see TRD §3.4).
 */
const NewCustomisation: React.FC = () => {
  const navigate = useNavigate();
  const { defaultTemplateId: defaultTemplateIdParam } = useParams<{ defaultTemplateId: string }>();
  const defaultTemplateId = defaultTemplateIdParam ? parseInt(defaultTemplateIdParam, 10) : undefined;

  const [companySearch, setCompanySearch] = useState('');
  const debouncedSearch = useDebounce(companySearch, 400);
  const [selectedCompany, setSelectedCompany] = useState<CompanySearchResult | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<CompanyPortalConfigListItem | null>(null);

  // Already-customized configIds for this template, so a domain that has
  // one isn't offered again here — it's reachable from the detail page's
  // existing-overrides list instead.
  const { data: overridesResponse } = useApiQuery({
    url: defaultTemplateId ? endPoints.templateOverridesSummary(defaultTemplateId) : '',
    queryKey: ['template-overrides-summary', defaultTemplateId],
    enabled: Boolean(defaultTemplateId),
  });
  const existingConfigIds: number[] = ((overridesResponse as any)?.data ?? []).map(
    (o: TemplateOverrideSummary) => o.configId
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
  const companyOptions: CompanySearchResult[] = (companyResponse as any)?.data?.data ?? [];

  const {
    data: domainResponse,
    isFetching: isLoadingDomains,
  } = useApiQuery({
    url: selectedCompany ? endPoints.companyPortalConfigList(selectedCompany.id) : '',
    queryKey: ['company-portal-config-list-for-customisation', selectedCompany?.id],
    enabled: Boolean(selectedCompany),
  });
  const allDomains: CompanyPortalConfigListItem[] = (domainResponse as any)?.data ?? [];
  const availableDomains = allDomains.filter((domain) => !existingConfigIds.includes(domain.configId));

  const handleBack = () => navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}/customise/${defaultTemplateId}`);

  const handleContinue = () => {
    if (!defaultTemplateId || !selectedCompany || !selectedDomain) return;
    const params = new URLSearchParams({
      configId: String(selectedDomain.configId),
      companyId: String(selectedCompany.id),
      companyName: selectedCompany.companyName,
      ...(selectedDomain.subDomain ? { subDomain: selectedDomain.subDomain } : {}),
    });
    // Straight to the focused editor — not back to the detail page — per
    // explicit product direction: no need to see the other-companies list
    // or actions row again right after picking where to customise.
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
            <SectionHeading>Customise for a different company/domain</SectionHeading>
            <SectionSubheading>
              Pick the company and domain to create a new customization for. This never
              touches the shared default or any other company/domain.
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
          // theme.palette.text.secondary is white (see colors.ts) — MUI's
          // default "no options" listbox text uses that color, which reads
          // as blank on this light background. Render it ourselves with a
          // color that's actually visible instead of relying on the
          // (broken, for this use) theme default.
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
          onChange={(_event, company) => {
            setSelectedCompany(company);
            setSelectedDomain(null);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Company"
              placeholder="Select Company"
              // Same white-text.secondary issue applies to the resting
              // (unfocused, empty) label position — force a color that
              // stays visible in every state.
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

        {selectedCompany && (
          // Kept mounted (label/placeholder always visible) even while
          // domains are loading or none are available — swapping it out
          // for a bare spinner/message previously made the Domain field
          // disappear entirely instead of just showing it as loading/empty,
          // same inline-spinner treatment the Company field above already
          // gets while searching.
          <Autocomplete
            size="small"
            options={isLoadingDomains ? [] : availableDomains}
            value={selectedDomain}
            loading={isLoadingDomains}
            getOptionLabel={(option) => option.subDomain || `Config #${option.configId}`}
            isOptionEqualToValue={(option, value) => option.configId === value.configId}
            noOptionsText={
              <Typography sx={{ fontSize: 13, color: VISIBLE_MUTED_TEXT_COLOR }}>
                {isLoadingDomains
                  ? 'Loading domains…'
                  : allDomains.length === 0
                  ? "This company has no domains configured yet — there's nothing to scope a customization to."
                  : "All of this company's domains already have a customization of this template — go back and edit one from the list instead of adding a new one."}
              </Typography>
            }
            onChange={(_event, domain) => setSelectedDomain(domain)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Domain"
                placeholder="Select Domain"
                InputLabelProps={{ ...params.InputLabelProps, sx: INPUT_LABEL_SX }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isLoadingDomains ? <CircularProgress size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
          )
        }

        <Box display="flex" gap={1.5} justifyContent="flex-end">
          <Button variantType="secondary" sizeType="small" onClick={handleBack}>
            Cancel
          </Button>
          <Button
            variantType="primary"
            sizeType="small"
            onClick={handleContinue}
            disabled={!selectedCompany || !selectedDomain}
          >
            Continue
          </Button>
        </Box>
      </PickerStep>
    </TabContainer>
  );
};

export default NewCustomisation;
