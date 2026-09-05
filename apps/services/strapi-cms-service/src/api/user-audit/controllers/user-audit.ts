import type { Core } from '@strapi/strapi';

export default {
    async find(ctx) {
        const { data, meta } = await strapi.service('api::user-audit.user-audit').find(ctx.query);
        return { data, meta };
    },

    async findOne(ctx) {
        const { id } = ctx.params;
        const { data, meta } = await strapi.service('api::user-audit.user-audit').findOne(id, ctx.query);
        return { data, meta };
    },

    async create(ctx) {
        const { data, meta } = await strapi.service('api::user-audit.user-audit').create(ctx.request.body);
        return { data, meta };
    },

    async update(ctx) {
        const { id } = ctx.params;
        const { data, meta } = await strapi.service('api::user-audit.user-audit').update(id, ctx.request.body);
        return { data, meta };
    },

    async delete(ctx) {
        const { id } = ctx.params;
        const { data, meta } = await strapi.service('api::user-audit.user-audit').delete(id);
        return { data, meta };
    },

    // Custom method to get audit trail for a specific user
    async getUserAuditTrail(ctx) {
        const { userId } = ctx.params;
        const { limit = 50, page = 1, activity } = ctx.query;
        
        try {
            const whereCondition: any = { userId: String(userId) };
            if (activity) {
                whereCondition.activity = activity;
            }

            const auditRecords = await strapi.db.query('api::user-audit.user-audit').findWithCount({
                where: whereCondition,
                orderBy: { timestamp: 'desc' },
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit)
            });

            return { 
                data: auditRecords[0],
                meta: {
                    pagination: {
                        page: parseInt(page),
                        pageSize: parseInt(limit),
                        total: auditRecords[1],
                        pageCount: Math.ceil(auditRecords[1] / parseInt(limit))
                    }
                }
            };
        } catch (error) {
            strapi.log.error('Error fetching user audit trail:', error);
            return ctx.badRequest('Failed to fetch audit trail');
        }
    },

    // Custom method to get recent login activities
    async getRecentLogins(ctx) {
        const { hours = 24 } = ctx.query;
        
        try {
            const cutoffTime = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);
            
            const recentLogins = await strapi.db.query('api::user-audit.user-audit').findMany({
                where: {
                    activity: 'login',
                    timestamp: { $gte: cutoffTime },
                    success: true
                },
                orderBy: { timestamp: 'desc' },
                limit: 100
            });

            return { data: recentLogins };
        } catch (error) {
            strapi.log.error('Error fetching recent logins:', error);
            return ctx.badRequest('Failed to fetch recent logins');
        }
    },

    // Custom method to get activity summary
    async getActivitySummary(ctx) {
        const { userId, days = 7 } = ctx.query;
        
        try {
            const cutoffTime = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
            const whereCondition: any = { timestamp: { $gte: cutoffTime } };
            
            if (userId) {
                whereCondition.userId = String(userId);
            }

            const activities = await strapi.db.query('api::user-audit.user-audit').findMany({
                where: whereCondition,
                select: ['activity', 'success'],
                orderBy: { timestamp: 'desc' }
            });

            // Group and count activities
            const summary = activities.reduce((acc, record) => {
                const key = `${record.activity}_${record.success ? 'success' : 'failure'}`;
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});

            return { data: summary };
        } catch (error) {
            strapi.log.error('Error fetching activity summary:', error);
            return ctx.badRequest('Failed to fetch activity summary');
        }
    }
};