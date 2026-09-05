/**
 * policy-template controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::policy-template.policy-template', ({ strapi }) => ({
    
    /**
     * Custom method to get policy template by companyId and policyId
     * Used by IBP users to fetch their policy-specific template
     * 
     * @route GET /api/policy-templates/company/:companyId/policy/:policyId
     * @param {string} companyId - The company ID to filter by
     * @param {string} policyId - The policy ID to filter by
     * @returns {object} Policy template data or empty array
     * 
     * @example
     * GET /api/policy-templates/company/123/policy/456?populate=*
     */
    async findByCompanyAndPolicy(ctx) {
        const { companyId, policyId } = ctx.params;
        
        // Log incoming params
        strapi.log.info('🌐 Policy Template Request:', {
            companyId,
            policyId,
            query: ctx.query
        });
        
        if (!companyId || !policyId) {
            return ctx.badRequest('Company ID and Policy ID are required');
        }
        
        try {
            // Use the ctx.query for populate - Strapi's query parser handles complex populate
            const entity = await strapi.entityService.findMany('api::policy-template.policy-template', {
                filters: { 
                    companyId: companyId,
                    policyId: policyId
                },
                ...ctx.query,
            });
            
            strapi.log.info('✅ Policy Template Found:', { count: Array.isArray(entity) ? entity.length : 1 });
            
            return this.sanitizeOutput(entity, ctx);
        } catch (error) {
            strapi.log.error('Error fetching policy template by companyId and policyId:', error);
            return ctx.internalServerError('Failed to fetch policy template');
        }
    },
}));
