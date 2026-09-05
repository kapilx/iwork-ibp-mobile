/**
 * Custom routes for policy-template
 * PUBLIC: No authentication required
 */

export default {
    routes: [
        {
            method: 'GET',
            path: '/policy-templates/company/:companyId/policy/:policyId',
            handler: 'policy-template.findByCompanyAndPolicy',
            config: {
                auth: false, // Public endpoint
                policies: [],
                middlewares: [], // No authentication required
            },
        },
    ],
};
