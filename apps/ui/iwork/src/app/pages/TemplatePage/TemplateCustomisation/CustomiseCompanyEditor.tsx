import React, { useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TEMPLATE_MANAGEMENT_BASE_PATH } from '../../../routes/template-management.route';
import { PENDING_DRAFT_STORAGE_KEY } from './DefaultTemplateEditor';
import { OverrideScope, TemplateOverrideEditor } from './TemplateOverrideEditor';
import { EmptyStateBox, HeaderRow, SectionHeading, SectionSubheading, TabContainer } from './styles';

/**
 * Focused, standalone screen for editing ONE company/domain's copy of a
 * template — just the header, the editor, and Save. No actions row, no
 * "customised for N companies" list, no other clutter from the detail page
 * (TemplateCustomisation/index.tsx) — reached both by clicking an existing
 * customization there and by completing NewCustomisation.tsx's company +
 * domain picker for a brand-new one.
 *
 * If a draft was carried over (the admin was viewing/editing the shared
 * default and chose "Customise for a Company/Domain" instead of saving it
 * as the default), it's picked up from sessionStorage here and pre-fills
 * the editor instead of this config's currently-effective content — see
 * DefaultTemplateEditor's PENDING_DRAFT_STORAGE_KEY.
 */
const CustomiseCompanyEditor: React.FC = () => {
  const navigate = useNavigate();
  const { defaultTemplateId: defaultTemplateIdParam } = useParams<{ defaultTemplateId: string }>();
  const defaultTemplateId = defaultTemplateIdParam ? parseInt(defaultTemplateIdParam, 10) : undefined;
  const [searchParams] = useSearchParams();

  // Exactly one of these two query-param sets is present, depending on
  // whether the default template is domain-scoped (isCompanyCustomizable —
  // IBP employee-facing) or company-wide (isCompanyLevelCustomizable —
  // iwork/internal-CRM, no domain concept) — see TemplateCustomisation's own
  // routing logic, which is the only place that decides which one to link
  // to. configId takes precedence if somehow both were present.
  const configIdParam = searchParams.get('configId');
  const companyIdParam = searchParams.get('companyId');
  const configId = configIdParam ? parseInt(configIdParam, 10) : NaN;
  const companyId = companyIdParam ? parseInt(companyIdParam, 10) : NaN;
  const scope: OverrideScope | null = !isNaN(configId)
    ? { type: 'config', configId }
    : !isNaN(companyId)
    ? { type: 'company', companyId }
    : null;
  const companyName = searchParams.get('companyName') || 'Unknown company';
  const subDomain = searchParams.get('subDomain');

  // Read (and clear) any carried-over draft synchronously via a lazy
  // useState initializer — NOT a useEffect. TemplateOverrideEditor seeds its
  // own dirty state from `initialDraft` in ITS OWN useState initializers,
  // which only ever run once, on ITS first mount. An effect here would only
  // set this state AFTER this component's first render/commit — by then
  // TemplateOverrideEditor has already mounted with initialDraft=null and
  // locked in empty state, and since its `key` below doesn't change, React
  // never remounts it to pick up the corrected prop. The draft would be
  // silently dropped and the editor would fall back to whatever's
  // currently-effective for this company/domain (the plain default, for a
  // brand-new one) — exactly the bug this was seeded to prevent. Reading
  // synchronously here guarantees the correct value is already in place
  // before TemplateOverrideEditor ever mounts.
  const [initialDraft] = useState<{ subject: string; body: string } | null>(() => {
    const rawDraft = sessionStorage.getItem(PENDING_DRAFT_STORAGE_KEY);
    if (!rawDraft) return null;
    sessionStorage.removeItem(PENDING_DRAFT_STORAGE_KEY);
    try {
      const parsed = JSON.parse(rawDraft);
      if (parsed?.defaultTemplateId === defaultTemplateId) {
        return { subject: parsed.subject, body: parsed.body };
      }
    } catch {
      // Malformed/stale sessionStorage entry — ignore, editor falls back to
      // this config's currently-effective content instead.
    }
    return null;
  });

  // Lands view-only by default, same as the shared default's own screen —
  // Edit must be clicked to enable the Subject field + body editor. A
  // carried-over draft is the one exception: the admin was already
  // mid-edit on the previous screen, so start straight in edit mode instead
  // of making them click Edit again to see the draft they just wrote.
  const [isEditing, setIsEditing] = useState(Boolean(initialDraft));

  // Clicking an override row directly on the dashboard table lands here via
  // TemplateCustomisation's own redirect-on-mount (navigate(..., {replace:
  // true})) — that replaces the hub page's history entry instead of
  // pushing a new one, so it was never really "visited" in this session.
  // A hardcoded navigate() to the hub page ignored that and always added an
  // extra hub-page stop, making the header back arrow take two clicks to
  // reach the table. navigate(-1) respects whatever's actually in history:
  // one click back to the table from that flow, or back to the hub page
  // when reached from ITS OWN "Customised for N companies" list instead
  // (that link pushes a real hub-page entry, so -1 correctly lands there).
  const handleBackNav = () => navigate(-1);
  // Post-save/reset still lands on the hub page explicitly, regardless of
  // how this screen was reached — the updated "Customised for N companies"
  // list there is the useful confirmation to see right after a mutation,
  // not wherever "back" happens to point.
  const handleBackToHub = () => navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}/customise/${defaultTemplateId}`);

  if (!defaultTemplateId || !scope) {
    return (
      <TabContainer>
        <EmptyStateBox>
          <Typography sx={{ fontSize: 14 }}>Nothing to edit — missing template or company/domain.</Typography>
        </EmptyStateBox>
      </TabContainer>
    );
  }

  return (
    <TabContainer>
      <HeaderRow>
        <Box display="flex" alignItems="center" gap={1.5}>
          <IconButton size="small" onClick={handleBackNav} aria-label="Back">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <SectionHeading>
              Editing for {companyName}
              {scope.type === 'config' && subDomain ? ` — ${subDomain}` : ''}
            </SectionHeading>
            <SectionSubheading>
              Saving here only affects this {scope.type === 'config' ? 'company/domain' : 'company'} —
              the shared default and every other {scope.type === 'config' ? 'company/domain' : 'company'}{' '}
              are unaffected.
            </SectionSubheading>
          </Box>
        </Box>
      </HeaderRow>

      <TemplateOverrideEditor
        key={`${defaultTemplateId}-${scope.type}-${scope.type === 'config' ? scope.configId : scope.companyId}`}
        defaultTemplateId={defaultTemplateId}
        scope={scope}
        canEdit={isEditing}
        eventTypeLabel={companyName}
        initialDraft={initialDraft}
        onSaved={handleBackToHub}
        onReset={handleBackToHub}
        onRequestEdit={() => setIsEditing(true)}
        onCancelEdit={() => setIsEditing(false)}
      />
    </TabContainer>
  );
};

export default CustomiseCompanyEditor;
