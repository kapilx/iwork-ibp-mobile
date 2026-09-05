/**
 * company-template controller
 */

import { factories } from '@strapi/strapi';
import axios from 'axios';

export default factories.createCoreController('api::company-template.company-template', ({ strapi }) => ({
    getSafePopulate() {
        return {
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
                        },
                    },
                    disclaimerNotes: true,
                    enrollmentYearRange: true,
                },
            },
        };
    },
    
    /**
     * Custom method to get company template by companyId
     * Used by IBP users to fetch their company-specific template
     * 
     * @route GET /api/company-templates/company/:companyId
     * @param {string} companyId - The company ID to filter by
     * @returns {object} Company template data or empty array
     * 
     * @example
     * GET /api/company-templates/company/123?populate=*
     */
    async findByCompanyId(ctx) {
        const { companyId } = ctx.params;
        
        // Log incoming params
        strapi.log.info('🌐 Company Template Request:', {
            companyId,
            query: ctx.query
        });
        
        if (!companyId) {
            return ctx.badRequest('Company ID is required');
        }
        
        try {
            // Use the ctx.query for populate - Strapi's query parser handles complex populate
            const entity = await strapi.entityService.findMany('api::company-template.company-template', {
                filters: { companyId: companyId },
                populate: this.getSafePopulate(),
            });
            
            strapi.log.info('✅ Company Template Found:', { count: Array.isArray(entity) ? entity.length : 1 });
            
            return this.sanitizeOutput(entity, ctx);
        } catch (error) {
            strapi.log.error('Error fetching company template by companyId:', error);
            return ctx.internalServerError('Failed to fetch company template');
        }
    },

    /**
     * Custom method to get company template by subdomain
     * Internal flow: subdomain -> config-service -> companyId -> company template
     *
     * @route GET /api/company-templates/subdomain/:subdomain
     */
    async findBySubdomain(ctx) {
        const { subdomain } = ctx.params;

        strapi.log.info('🌐 Company Template By Subdomain Request:', {
            subdomain,
            query: ctx.query,
        });

        if (!subdomain) {
            return ctx.badRequest('Subdomain is required');
        }

        try {
            const gatewayBase = process.env.URL_API_GATEWAY || 'http://localhost:3000';
            const configServiceBase =
                process.env.CONFIG_SERVICE_URL ||
                process.env.URL_CONFIG_SERVICE ||
                `${gatewayBase}/iirm/config-service`;

            const configResponse = await axios.get(
                `${configServiceBase}/auth-config/company`,
                {
                    params: { subdomain },
                    timeout: 8000,
                },
            );

            const payload = configResponse?.data?.data ?? {};
            const companyConfig = payload?.companyConfig ?? configResponse?.data?.companyConfig ?? {};
            const companyId =
                companyConfig?.companyId ??
                payload?.companyId ??
                configResponse?.data?.companyId ??
                null;

            if (!companyId) {
                return ctx.notFound('Company not found for the provided subdomain');
            }

            const entity = await strapi.entityService.findMany('api::company-template.company-template', {
                filters: { companyId: String(companyId) },
                populate: this.getSafePopulate(),
            });

            strapi.log.info('✅ Company Template Found By Subdomain:', {
                subdomain,
                companyId,
                count: Array.isArray(entity) ? entity.length : 1,
            });

            return this.sanitizeOutput(entity, ctx);
        } catch (error) {
            strapi.log.error('Error fetching company template by subdomain:', error);
            return ctx.internalServerError('Failed to fetch company template by subdomain');
        }
    },
}));
