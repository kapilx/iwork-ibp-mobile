/**
 * Custom routes for company-template
 * PUBLIC: No authentication required
 */

export default {
    routes: [
        {
            method: 'GET',
            path: '/company-templates/company/:companyId',
            handler: 'company-template.findByCompanyId',
            config: {
                auth: false, // Public endpoint
                policies: [],
                middlewares: [], // No authentication required
            },
        },
    ],
};
