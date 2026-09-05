import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::terms-and-conditions.terms-and-condition' as any, ({ strapi }) => ({
    async findActive(ctx) {
        const results = await strapi.documents('api::terms-and-conditions.terms-and-condition' as any).findMany({
            filters: { isActive: true },
            sort: 'version:desc',
            populate: ['sections'],
            limit: 1,
        });
        ctx.body = { data: results[0] ?? null };
    },
}));
