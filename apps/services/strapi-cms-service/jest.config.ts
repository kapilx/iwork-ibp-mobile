module.exports = {
    displayName: 'strapi-cms-service',
    preset: '../../../jest.preset.js',
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]s$': ['@swc/jest'],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../../coverage/apps/services/strapi-cms-service',
};
