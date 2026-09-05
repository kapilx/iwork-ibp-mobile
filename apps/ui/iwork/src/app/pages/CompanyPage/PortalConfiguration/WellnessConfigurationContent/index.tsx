import { forwardRef, useEffect, useState } from 'react';
import { Box, FormControlLabel, Switch, Typography } from '@mui/material';
import { apiRequest, endPoints } from '@ui/ui-lib';
import { SectionCardList } from './SectionCardList';
import { SectionTileList } from './SectionTileList';
import { ExternalApiConfigOption, WellnessCardDataSource, WellnessConfigState } from './types';
import { prefillCardsFromMagicUrl } from './dynamicPrefill';
import { ContentContainer } from './styles';

export interface WellnessConfigurationContentProps {
    config: WellnessConfigState;
    companyId?: string | number;
    disabled?: boolean;
    onChange: (config: WellnessConfigState) => void;
}

export const WellnessConfigurationContent = forwardRef<
    HTMLDivElement,
    WellnessConfigurationContentProps
>(({ config, companyId, disabled, onChange }, ref) => {
    // Section A auto-prefill state: while a dynamic prefill (magic-url) runs.
    const [healthAssessmentPrefilling, setHealthAssessmentPrefilling] = useState(false);

    // Saved External API Configs offered in the dynamic-section picker. Fetched
    // once; a section stores only the picked appRef id and uses its label as the
    // magic-url appKey.
    const [apiConfigs, setApiConfigs] = useState<ExternalApiConfigOption[]>([]);
    useEffect(() => {
        let active = true;
        apiRequest(endPoints.tpaFeatureAppRefs, { method: 'GET' })
            .then((res: any) => {
                if (!active) return;
                const rows = (res?.data ?? []) as {
                    id: number;
                    label?: string;
                    configType?: string;
                }[];
                setApiConfigs(
                    rows
                        .filter((r) => r.configType !== 'SSO')
                        .map((r) => ({ id: r.id, label: r.label ?? `Config ${r.id}` }))
                );
            })
            .catch(() => {
                if (active) setApiConfigs([]);
            });
        return () => {
            active = false;
        };
    }, []);

    // Prefill Section A's tiles from the picked appRef (its label is the
    // magic-url appKey). If nothing comes back (no external data yet), keep the
    // static placeholder cards.
    const prefillHealthAssessment = async (apiRefId: number) => {
        const cfg = apiConfigs.find((c) => c.id === apiRefId);
        if (!cfg) return;
        setHealthAssessmentPrefilling(true);
        try {
            const cards = await prefillCardsFromMagicUrl(cfg.label, config.healthAssessment.cards);
            if (cards && cards.length) {
                onChange({
                    ...config,
                    healthAssessment: { ...config.healthAssessment, cards, apiRefId, dataSource: 'DYNAMIC' },
                });
            }
        } catch {
            // No external API data / call failed → keep the static placeholder cards.
        } finally {
            setHealthAssessmentPrefilling(false);
        }
    };

    // Flip Section A between Static/Dynamic. Re-flipping to Dynamic re-prefills
    // if an API was already picked; otherwise the picker is shown to choose one.
    const handleHealthAssessmentSource = (dataSource: WellnessCardDataSource) => {
        onChange({ ...config, healthAssessment: { ...config.healthAssessment, dataSource } });
        if (dataSource === 'DYNAMIC' && config.healthAssessment.apiRefId) {
            prefillHealthAssessment(config.healthAssessment.apiRefId);
        }
    };

    // Admin picked an External API for Section A → remember it and prefill.
    const handleHealthAssessmentApiRef = (apiRefId: number) => {
        onChange({
            ...config,
            healthAssessment: { ...config.healthAssessment, apiRefId, dataSource: 'DYNAMIC' },
        });
        prefillHealthAssessment(apiRefId);
    };

    return (
        <ContentContainer ref={ref}>
            {/* Master switch — when OFF, IBP hides the entire wellness section. */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 3,
                    p: 2.5,
                    mb: 2,
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    bgcolor: '#F9FAFB',
                }}
            >
                <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                        Wellness section
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                        When enabled, employees see the Wellness area on their dashboard. Turn this
                        off to hide the entire wellness section (all sub-sections) for this company.
                    </Typography>
                </Box>
                <FormControlLabel
                    sx={{ m: 0 }}
                    control={
                        <Switch
                            checked={config.enabled}
                            disabled={disabled}
                            onChange={(_, checked) => onChange({ ...config, enabled: checked })}
                        />
                    }
                    label={config.enabled ? 'Enabled' : 'Disabled'}
                    labelPlacement="start"
                />
            </Box>

            <SectionTileList
                title="Section A — Health Assessment"
                description="Pick a colour template, then set the heading/subheading/link for each stat tile. Scores, report counts, and activity shown to employees are live per-employee data."
                intensity="soft"
                cards={config.healthAssessment.cards}
                disabled={disabled}
                addButtonLabel="Add tile"
                dataSource={config.healthAssessment.dataSource}
                onDataSourceChange={handleHealthAssessmentSource}
                dynamicLoading={healthAssessmentPrefilling}
                apiConfigs={apiConfigs}
                apiRefId={config.healthAssessment.apiRefId}
                onApiRefChange={handleHealthAssessmentApiRef}
                onChange={(cards) =>
                    onChange({ ...config, healthAssessment: { ...config.healthAssessment, cards } })
                }
            />

            <SectionCardList
                title="Section B — Benefits from our Organisation"
                description="Add, remove, and reorder the benefit cards employees see on their dashboard."
                cards={config.organisationBenefits.cards}
                companyId={companyId}
                disabled={disabled}
                addButtonLabel="Add benefit card"
                onChange={(cards) => onChange({ ...config, organisationBenefits: { cards } })}
            />

            <SectionTileList
                title="Section C — Explore by Need"
                description="Pick a colour template, then set the heading/subheading/link for each tile."
                intensity="vivid"
                cards={config.exploreByNeed.cards}
                disabled={disabled}
                addButtonLabel="Add tile"
                onChange={(cards) => onChange({ ...config, exploreByNeed: { cards } })}
            />

            <SectionCardList
                title="Section D — Explore More Programmes"
                description="Add, remove, and reorder the wellness programme cards employees see on their dashboard."
                cards={config.explorePrograms.cards}
                companyId={companyId}
                disabled={disabled}
                addButtonLabel="Add programme card"
                onChange={(cards) => onChange({ ...config, explorePrograms: { cards } })}
            />

            <SectionCardList
                title="Section E — Wellness Library"
                description="Add articles, videos, webinars and quick reads. Each card takes a thumbnail, title, description, a media type, a duration label, and a link."
                cards={config.wellnessLibrary.cards}
                companyId={companyId}
                disabled={disabled}
                addButtonLabel="Add library card"
                showMedia
                ctaLabel="View"
                onChange={(cards) => onChange({ ...config, wellnessLibrary: { cards } })}
            />

            <SectionCardList
                title="Section F — Profile Wellness"
                description="Cards shown in the employee's Profile page (not the dashboard). Same fields as Section B."
                cards={config.profileWellnessSection.cards}
                companyId={companyId}
                disabled={disabled}
                addButtonLabel="Add profile card"
                onChange={(cards) => onChange({ ...config, profileWellnessSection: { cards } })}
            />
        </ContentContainer>
    );
});

WellnessConfigurationContent.displayName = 'WellnessConfigurationContent';

export { type WellnessConfigState } from './types';
export { buildDefaultWellnessConfig, mapWellnessConfigFromApi } from './types';
