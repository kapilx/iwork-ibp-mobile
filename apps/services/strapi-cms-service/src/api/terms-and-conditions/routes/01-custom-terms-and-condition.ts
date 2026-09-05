export default {
    routes: [
        {
            method: 'GET',
            path: '/terms-and-conditions/active',
            handler: 'terms-and-condition.findActive',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
    ],
};
