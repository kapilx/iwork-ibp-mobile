import axios from 'axios';

interface ServiceInfo {
    name: string;
    url: string;
    port: string;
    healthCheck: string;
    status: string;
}

async function registerWithServiceRegistry(): Promise<void> {
    const serviceInfo: ServiceInfo = {
        name: 'strapi-cms-service',
        url: process.env.URL_STRAPI_CMS_SERVICE || 'http://localhost:4321',
        port: process.env.PORT_STRAPI_CMS_SERVICE || '4321',
        healthCheck: '/api/health',
        status: 'active',
    };

    const registryUrl = process.env.URL_SERVICE_REGISTRY || 'http://localhost:3002';
    const registerEndpoint = `${registryUrl}/service-registry/registry/register`;

    let retries = 0;
    const maxRetries = 10;
    
    while (retries < maxRetries) {
        try {
            console.log(`📡 Registering ${serviceInfo.name} (attempt ${retries + 1}/${maxRetries})...`);
            
            await axios.post(registerEndpoint, serviceInfo, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000,
            });

            console.log(`✅ ${serviceInfo.name} registered successfully!`);
            console.log(`   Service URL: ${serviceInfo.url}`);
            console.log(`   Registry: ${registryUrl}`);
            return;
        } catch (error: any) {
            retries++;
            console.error(`❌ Registration failed (${retries}/${maxRetries}): ${error.message}`);
            
            if (retries >= maxRetries) {
                console.error(`⚠️  Could not register. Service will run but won't be accessible via Gateway.`);
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

export default {
    bootstrap: async ({ strapi }) => {
        const port = process.env.PORT_STRAPI_CMS_SERVICE || '4321';
        const serviceUrl = process.env.URL_STRAPI_CMS_SERVICE || `http://localhost:${port}`;
        const gatewayUrl = process.env.URL_API_GATEWAY || 'http://localhost:3000';
        const adminPath = process.env.ADMIN_PATH || '/admin';
        const proxyEnabled = process.env.STRAPI_PROXY_ENABLED === 'true';
        
        console.log('\n🚀 ========================================');
        console.log('   Strapi CMS Service Bootstrap');
        console.log('========================================\n');
        
        await registerWithServiceRegistry();

        console.log('\n📋 Service Information:');
        console.log(`   Port: ${port}`);
        console.log(`   Service URL: ${serviceUrl}`);
        console.log(`   Proxy Enabled: ${proxyEnabled}`);
        console.log('\n🔗 Access Points:');
        console.log(`   Admin Panel: ${serviceUrl}${adminPath}`);
        console.log(`   Direct API: ${serviceUrl}/api/hello-worlds`);
        if (proxyEnabled) {
            console.log(`   Gateway API: ${gatewayUrl}/iirm/strapi-cms-service/api/hello-worlds`);
            console.log(`   Gateway Admin: ${gatewayUrl}/iirm/strapi-cms-service${adminPath}`);
        }
        console.log('\n⚠️  Note: Enable public permissions in admin panel for API access\n');
    },
};
