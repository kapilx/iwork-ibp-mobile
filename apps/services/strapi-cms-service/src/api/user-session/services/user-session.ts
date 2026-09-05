import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
    async find(query) {
        const results = await strapi.documents('api::user-session.user-session').findMany({
            ...query,
        });
        return { data: results, meta: {} };
    },

    async findOne(documentId, query) {
        const entity = await strapi.documents('api::user-session.user-session').findOne({
            documentId,
            ...query,
        });
        return { data: entity, meta: {} };
    },

    async create(data) {
        const entity = await strapi.documents('api::user-session.user-session').create({
            data,
        });
        return { data: entity, meta: {} };
    },

    async update(documentId, data) {
        const entity = await strapi.documents('api::user-session.user-session').update({
            documentId,
            data,
        });
        return { data: entity, meta: {} };
    },

    async delete(documentId) {
        const entity = await strapi.documents('api::user-session.user-session').delete({
            documentId,
        });
        return { data: entity, meta: {} };
    },
});