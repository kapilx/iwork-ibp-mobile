import type { Core } from '@strapi/strapi';

export default {
    async find(ctx) {
        const { data, meta } = await strapi.service('api::user-session.user-session').find(ctx.query);
        return { data, meta };
    },

    async findOne(ctx) {
        const { id } = ctx.params;
        const { data, meta } = await strapi.service('api::user-session.user-session').findOne(id, ctx.query);
        return { data, meta };
    },

    async create(ctx) {
        const { data, meta } = await strapi.service('api::user-session.user-session').create(ctx.request.body);
        return { data, meta };
    },

    async update(ctx) {
        const { id } = ctx.params;
        const { data, meta } = await strapi.service('api::user-session.user-session').update(id, ctx.request.body);
        return { data, meta };
    },

    async delete(ctx) {
        const { id } = ctx.params;
        const { data, meta } = await strapi.service('api::user-session.user-session').delete(id);
        return { data, meta };
    },

    // Custom method to get active sessions for a user
    async getActiveSessions(ctx) {
        const { userId } = ctx.params;
        try {
            const sessions = await strapi.db.query('api::user-session.user-session').findMany({
                where: { 
                    userId: String(userId),
                    isActive: true 
                },
                orderBy: { lastActivity: 'desc' }
            });
            return { data: sessions };
        } catch (error) {
            strapi.log.error('Error fetching active sessions:', error);
            return ctx.badRequest('Failed to fetch active sessions');
        }
    },

    // Custom method to terminate all sessions for a user
    async terminateUserSessions(ctx) {
        const { userId } = ctx.params;
        try {
            const updatedSessions = await strapi.db.query('api::user-session.user-session').updateMany({
                where: { 
                    userId: String(userId),
                    isActive: true 
                },
                data: { 
                    isActive: false,
                    endTime: new Date(),
                    updatedAt: new Date()
                }
            });
            return { data: { terminatedSessions: updatedSessions.count } };
        } catch (error) {
            strapi.log.error('Error terminating user sessions:', error);
            return ctx.badRequest('Failed to terminate sessions');
        }
    }
};