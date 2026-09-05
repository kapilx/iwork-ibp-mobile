export default {
    /**
     * Initialize templates for a company and policy
     * Called from policy-service when a policy is activated
     */
    async initialize(ctx) {
        const { companyId, policyId, components: rawComponents } = ctx.request.body;
        const policyComponents: any[] = Array.isArray(rawComponents) ? rawComponents : [];

        // Categorise components the same way the frontend does
        const categorizeComponents = (comps: any[]) => {
            const compulsory: any[] = [];
            const optional: any[] = [];
            const flex: any[] = [];
            for (const c of comps) {
                const isFlex = c.type === 'flex' || (c.type === 'optional' && c.isBenefitComponent === true);
                const isOptional = c.type === 'optional' && c.isBenefitComponent !== true;
                if (isFlex) flex.push(c);
                else if (isOptional) optional.push(c);
                else compulsory.push(c);
            }
            return { compulsory, optional, flex };
        };

        const DEFAULT_INFO_POINTS = [
            { text: 'Hospitalization coverage for employee and dependents' },
            { text: 'Pre and post hospitalization expenses covered' },
            { text: 'Day-care procedures included' },
            { text: 'Cashless facility at network hospitals' },
            { text: 'Maternity and newborn baby coverage' },
        ];

        // Build new Strapi component entries from policy components with default infoPoints
        const buildEntries = (comps: any[]) =>
            comps.map((c) => ({
                componentId: String(c.id),
                label: c.label || '',
                infoPoints: DEFAULT_INFO_POINTS,
            }));

        // Merge existing Strapi entries with incoming policy components:
        //   - discard blank entries (no componentId — created via manual Strapi UI)
        //   - preserve existing infoPoints for matched entries
        //   - update labels
        //   - append entries for new componentIds
        const mergeSection = (existing: any[], incoming: any[]) => {
            const validExisting = existing.filter(
                (e) => e.componentId && String(e.componentId).trim() !== ''
            );
            const incomingMap = new Map(incoming.map((c) => [String(c.id), c]));
            const existingIds = new Set(validExisting.map((e) => String(e.componentId)));

            const updated = validExisting.map((e) => {
                const match = incomingMap.get(String(e.componentId));
                return match ? { ...e, label: match.label || e.label } : e;
            });

            const added = incoming
                .filter((c) => !existingIds.has(String(c.id)))
                .map((c) => ({ componentId: String(c.id), label: c.label || '', infoPoints: DEFAULT_INFO_POINTS }));

            return [...updated, ...added];
        };

        strapi.log.info(`[template-initializer] Received request`, {
            companyId,
            policyId,
            componentsIsArray: Array.isArray(rawComponents),
            componentCount: policyComponents.length,
            components: policyComponents,
        });

        // Validate input
        if (!companyId || !policyId) {
            return ctx.badRequest('companyId and policyId are required');
        }

        // Convert to strings for Strapi
        const companyIdStr = String(companyId);
        const policyIdStr = String(policyId);

        // Prevent creating templates for default IDs
        if (companyId === 0 || policyId === 0) {
            return ctx.badRequest('Cannot initialize templates for default IDs (0)');
        }

        try {
            strapi.log.info(
                `Initializing templates for companyId: ${companyIdStr}, policyId: ${policyIdStr}`
            );

            // ====================
            // 1. Company Template
            // ====================
            let companyTemplate: any = await strapi.entityService.findMany(
                'api::company-template.company-template',
                {
                    filters: { companyId: companyIdStr },
                    limit: 1,
                    populate: {
                        config: {
                            populate: {
                                faqs: true,
                                footer: true,
                                contactMatrix: {
                                    populate: {
                                        hrContacts: { populate: { primaryEscalation: true, secondaryEscalation: true } },
                                        dpoContacts: { populate: { primaryEscalation: true, secondaryEscalation: true } },
                                        grievanceContacts: { populate: { primaryEscalation: true, secondaryEscalation: true } },
                                        tpa: { populate: { primaryEscalation: true, secondaryEscalation: true } },
                                        broker: { populate: { primaryEscalation: true, secondaryEscalation: true } },
                                    }
                                },
                                disclaimerNotes: true
                            }
                        }
                    },
                }
            );

            if (!companyTemplate || companyTemplate.length === 0) {
                strapi.log.info(
                    `Company template not found for companyId: ${companyIdStr}, creating from default...`
                );

                // Get default company template (companyId: "0") with full config
                const defaultCompanies: any = await strapi.entityService.findMany(
                    'api::company-template.company-template',
                    {
                        filters: { companyId: "0" },
                        limit: 1,
                        populate: {
                            config: {
                                populate: {
                                    faqs: true,
                                    footer: true,
                                    contactMatrix: {
                                        populate: {
                                            hrContacts: { populate: { primaryEscalation: true, secondaryEscalation: true } },
                                            dpoContacts: { populate: { primaryEscalation: true, secondaryEscalation: true } },
                                            grievanceContacts: { populate: { primaryEscalation: true, secondaryEscalation: true } },
                                            tpa: { populate: { primaryEscalation: true, secondaryEscalation: true } },
                                            broker: { populate: { primaryEscalation: true, secondaryEscalation: true } },
                                        }
                                    },
                                    disclaimerNotes: true
                                }
                            }
                        },
                    }
                );

                const defaultCompany: any = defaultCompanies && defaultCompanies.length > 0 ? defaultCompanies[0] : null;

                strapi.log.info(`Default company template found:`, {
                    exists: !!defaultCompany,
                    id: defaultCompany?.id,
                    companyId: defaultCompany?.companyId,
                    hasConfig: !!defaultCompany?.config,
                    config: defaultCompany?.config
                });

                if (!defaultCompany) {
                    return ctx.badRequest(
                        'Default company template not found. Please ensure bootstrap has run.'
                    );
                }

                // Deep clone config to avoid reference issues
                const clonedConfig = JSON.parse(JSON.stringify(defaultCompany.config || {}));
                
                strapi.log.info(`Cloning config from default company template:`, clonedConfig);

                // If older default templates include footer links that aren't part of the schema anymore,
                // drop them to avoid Strapi validation errors during create.
                if (clonedConfig?.footer && typeof clonedConfig.footer === "object") {
                    delete clonedConfig.footer.termsAndConditions;
                    delete clonedConfig.footer.privacyPolicy;
                    delete clonedConfig.footer.reportGrievance;
                }

                // Clone default template for this company
                companyTemplate = await strapi.entityService.create(
                    'api::company-template.company-template',
                    {
                        data: {
                            companyId: companyIdStr,
                            config: clonedConfig,
                            publishedAt: new Date(),
                        },
                    }
                );

                strapi.log.info(
                    `✅ Company template created for companyId: ${companyIdStr}`,
                    { id: companyTemplate.id, config: companyTemplate.config }
                );
            } else {
                companyTemplate = companyTemplate[0];
                strapi.log.info(
                    `ℹ️  Company template already exists for companyId: ${companyIdStr}`
                );
            }

            // ==================
            // 2. Policy Template
            // ==================
            let policyTemplate: any = await strapi.entityService.findMany(
                'api::policy-template.policy-template',
                {
                    filters: { companyId: companyIdStr, policyId: policyIdStr },
                    limit: 1,
                    // Every component field must be populated here: the merge below
                    // spreads this config back into an update, and any field missing
                    // from the populate would be dropped from the spread.
                    populate: {
                        config: {
                            populate: {
                                compulsory: { populate: { infoPoints: true } },
                                optional: { populate: { infoPoints: true } },
                                flex: { populate: { infoPoints: true } },
                                disclaimerNotes: true,
                                faqs: true,
                                policyNotes: true
                            }
                        }
                    },
                }
            );

            if (!policyTemplate || policyTemplate.length === 0) {
                strapi.log.info(
                    `Policy template not found for companyId: ${companyIdStr}, policyId: ${policyIdStr}, creating from default...`
                );

                // Get default policy template (companyId: "0", policyId: "0") with full config
                const defaultPolicies: any = await strapi.entityService.findMany(
                    'api::policy-template.policy-template',
                    {
                        filters: { companyId: "0", policyId: "0" },
                        limit: 1,
                        populate: {
                            config: {
                                populate: {
                                    compulsory: { populate: { infoPoints: true } },
                                    optional: { populate: { infoPoints: true } },
                                    flex: { populate: { infoPoints: true } },
                                    disclaimerNotes: true
                                }
                            }
                        },
                    }
                );

                const defaultPolicy: any = defaultPolicies && defaultPolicies.length > 0 ? defaultPolicies[0] : null;

                strapi.log.info(`Default policy template found:`, {
                    exists: !!defaultPolicy,
                    id: defaultPolicy?.id,
                    companyId: defaultPolicy?.companyId,
                    policyId: defaultPolicy?.policyId,
                    hasConfig: !!defaultPolicy?.config,
                    config: defaultPolicy?.config
                });

                if (!defaultPolicy) {
                    return ctx.badRequest(
                        'Default policy template not found. Please ensure bootstrap has run.'
                    );
                }

                // Deep clone scalar config fields (exclude component arrays — built fresh below)
                const baseConfig = JSON.parse(JSON.stringify(defaultPolicy.config || {}));
                const categorized = categorizeComponents(policyComponents);

                strapi.log.info(`Creating policy template with ${policyComponents.length} components`, {
                    compulsory: categorized.compulsory.length,
                    optional: categorized.optional.length,
                    flex: categorized.flex.length,
                });

                policyTemplate = await strapi.entityService.create(
                    'api::policy-template.policy-template',
                    {
                        data: {
                            companyId: companyIdStr,
                            policyId: policyIdStr,
                            config: {
                                policyFeaturesDoc: baseConfig.policyFeaturesDoc ?? null,
                                showCompanyContribution: baseConfig.showCompanyContribution ?? false,
                                autoLockEnrollmentAfterConfirm: baseConfig.autoLockEnrollmentAfterConfirm ?? false,
                                requireConfirmationBeforeSubmit: baseConfig.requireConfirmationBeforeSubmit ?? false,
                                disclaimerNotes: baseConfig.disclaimerNotes ?? [],
                                compulsory: buildEntries(categorized.compulsory),
                                optional: buildEntries(categorized.optional),
                                flex: buildEntries(categorized.flex),
                            },
                            publishedAt: new Date(),
                        },
                    }
                );

                strapi.log.info(
                    `✅ Policy template created for companyId: ${companyIdStr}, policyId: ${policyIdStr}`,
                    { id: policyTemplate.id }
                );
            } else {
                policyTemplate = policyTemplate[0];
                strapi.log.info(
                    `ℹ️  Policy template already exists for companyId: ${companyIdStr}, policyId: ${policyIdStr} — merging components`
                );

                if (policyComponents.length > 0) {
                    const categorized = categorizeComponents(policyComponents);
                    const existingConfig = policyTemplate.config || {};

                    await strapi.entityService.update(
                        'api::policy-template.policy-template',
                        policyTemplate.id,
                        {
                            data: {
                                config: {
                                    ...existingConfig,
                                    compulsory: mergeSection(existingConfig.compulsory || [], categorized.compulsory),
                                    optional: mergeSection(existingConfig.optional || [], categorized.optional),
                                    flex: mergeSection(existingConfig.flex || [], categorized.flex),
                                },
                            },
                        }
                    );

                    strapi.log.info(`✅ Policy template components merged for companyId: ${companyIdStr}, policyId: ${policyIdStr}`);
                }
            }

            // Return success response
            ctx.body = {
                success: true,
                message: 'Templates initialized successfully',
                data: {
                    companyTemplate: {
                        id: companyTemplate.id,
                        companyId: companyTemplate.companyId,
                    },
                    policyTemplate: {
                        id: policyTemplate.id,
                        companyId: policyTemplate.companyId,
                        policyId: policyTemplate.policyId,
                    },
                },
            };
        } catch (error) {
            strapi.log.error('Template initialization failed:', error);
            return ctx.internalServerError('Template initialization failed', {
                error: error.message,
            });
        }
    },
};
