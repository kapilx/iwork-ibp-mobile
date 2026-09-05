export default {
    async check(ctx) {
        const dbConnection = strapi.db?.connection;
        let dbStatus = 'unknown';
        
        try {
            if (dbConnection) {
                await dbConnection.raw('SELECT 1');
                dbStatus = 'connected';
            }
        } catch (error) {
            dbStatus = 'disconnected';
        }

        // const healthStatus = {
        //     status: dbStatus === 'connected' ? 'ok' : 'unhealthy',
        //     timestamp: new Date().toISOString(),
        //     service: 'strapi-cms-service',
        //     version: '0.0.1',
        //     uptime: process.uptime(),
        //     database: {
        //         status: dbStatus,
        //     },
        //     environment: process.env.NODE_ENV || 'development',
        // };

        ctx.status = dbStatus === 'connected' ? 200 : 503;
        ctx.body = { status: 'ok' };
    },
};
