/**
 * Hello World Routes
 * Defines the API endpoints for the Hello World content type
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::hello-world.hello-world', {
    config: {
        find: {
            auth: false,
            policies: [],
            middlewares: [],
        },
        findOne: {
            auth: false,
            policies: [],
            middlewares: [],
        },
        create: {
            auth: false,
            policies: [],
            middlewares: [],
        },
        update: {
            auth: false,
            policies: [],
            middlewares: [],
        },
        delete: {
            auth: false,
            policies: [],
            middlewares: [],
        },
    },
});
