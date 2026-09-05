import type { Core } from '@strapi/strapi';

export default {
    async find(ctx) {
        const { data, meta } = await strapi.service('api::hello-world.hello-world').find(ctx.query);
        return { data, meta };
    },

    async findOne(ctx) {
        const { id } = ctx.params;
        const { data, meta } = await strapi.service('api::hello-world.hello-world').findOne(id, ctx.query);
        return { data, meta };
    },

    async create(ctx) {
        const { data, meta } = await strapi.service('api::hello-world.hello-world').create(ctx.request.body);
        return { data, meta };
    },

    async update(ctx) {
        const { id } = ctx.params;
        const { data, meta } = await strapi.service('api::hello-world.hello-world').update(id, ctx.request.body);
        return { data, meta };
    },

    async delete(ctx) {
        const { id } = ctx.params;
        const { data, meta } = await strapi.service('api::hello-world.hello-world').delete(id);
        return { data, meta };
    },
};
