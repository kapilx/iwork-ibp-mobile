#!/usr/bin/env node

/**
 * Script to enable public permissions for hello-world API
 * Run this after creating an admin user
 */

import axios from 'axios';
import * as readline from 'readline';

interface LoginResponse {
    data: {
        token: string;
        user: {
            id: number;
            email: string;
        };
    };
}

interface Role {
    id: number;
    name: string;
    type: string;
    permissions: Record<string, any>;
}

interface RolesResponse {
    roles: Role[];
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function enablePublicAccess(): Promise<void> {
    console.log('\n🔓 Strapi Public Permissions Setup\n');
    
    // Get admin credentials
    const identifier = await question('Admin email/username: ');
    const password = await question('Admin password: ');
    
    rl.close();
    
    const baseUrl = 'http://localhost:3024';
    
    try {
        // 1. Login as admin
        console.log('\n🔐 Logging in...');
        const loginResponse = await axios.post<LoginResponse>(
            `${baseUrl}/admin/login`,
            {
                email: identifier,
                password: password
            }
        );
        
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful');
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        // 2. Get public role
        console.log('📋 Fetching public role...');
        const rolesResponse = await axios.get<RolesResponse>(
            `${baseUrl}/admin/users-permissions/roles`,
            { headers }
        );
        const publicRole = rolesResponse.data.roles.find((role) => role.type === 'public');
        
        if (!publicRole) {
            console.error('❌ Public role not found');
            process.exit(1);
        }
        
        console.log(`✅ Found public role (ID: ${publicRole.id})`);
        
        // 3. Update public role permissions
        console.log('🔧 Enabling hello-world permissions...');
        
        const permissions = {
            ...publicRole.permissions,
            'api::hello-world': {
                'controllers': {
                    'hello-world': {
                        'find': {
                            'enabled': true,
                            'policy': ''
                        },
                        'findOne': {
                            'enabled': true,
                            'policy': ''
                        }
                    }
                }
            }
        };
        
        await axios.put(
            `${baseUrl}/admin/users-permissions/roles/${publicRole.id}`,
            {
                ...publicRole,
                permissions: permissions
            },
            { headers }
        );
        
        console.log('✅ Public permissions enabled for hello-world API\n');
        console.log('🧪 Test with:');
        console.log('   curl http://localhost:3024/api/hello-worlds');
        console.log('   curl http://localhost:3000/cms/api/hello-worlds\n');
        
    } catch (error: any) {
        console.error('\n❌ Error:', error.response?.data?.error?.message || error.message);
        if (error.response?.status === 400) {
            console.log('\n💡 Tip: Make sure you have created an admin user first');
            console.log('   Go to: http://localhost:3024/admin\n');
        }
        process.exit(1);
    }
}

enablePublicAccess();
