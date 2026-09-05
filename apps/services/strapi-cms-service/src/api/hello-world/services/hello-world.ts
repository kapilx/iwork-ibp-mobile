import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
    async find(query) {
        const results = await strapi.documents('api::hello-world.hello-world').findMany({
            ...query,
        });
        return { data: results, meta: {} };
    },

    async findOne(documentId, query) {
        const entity = await strapi.documents('api::hello-world.hello-world').findOne({
            documentId,
            ...query,
        });
        return { data: entity, meta: {} };
    },

    async create(data) {
        const entity = await strapi.documents('api::hello-world.hello-world').create({
            data,
        });
        return { data: entity, meta: {} };
    },

    async update(documentId, data) {
        const entity = await strapi.documents('api::hello-world.hello-world').update({
            documentId,
            data,
        });
        return { data: entity, meta: {} };
    },

    async delete(documentId) {
        const entity = await strapi.documents('api::hello-world.hello-world').delete({
            documentId,
        });
        return { data: entity, meta: {} };
    },
});
