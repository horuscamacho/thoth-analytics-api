"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@thoth.mx';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin2025!@#';
    console.log(`📧 Creating Super Admin with email: ${superAdminEmail}`);
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
    const superAdmin = await prisma.user.upsert({
        where: {
            email: superAdminEmail,
        },
        update: {
            password: hashedPassword,
            status: 'ACTIVE',
            updatedAt: new Date(),
        },
        create: {
            id: crypto.randomUUID(),
            email: superAdminEmail,
            username: 'superadmin',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            tenantId: null,
            isTemporaryPassword: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });
    console.log(`✅ Super Admin created with ID: ${superAdmin.id}`);
    const sampleTenant = await prisma.tenant.upsert({
        where: {
            id: 'hidalgo-gobierno-estatal',
        },
        update: {
            name: 'Gobierno del Estado de Hidalgo',
            status: 'ACTIVE',
            updatedAt: new Date(),
        },
        create: {
            id: 'hidalgo-gobierno-estatal',
            name: 'Gobierno del Estado de Hidalgo',
            type: 'GOVERNMENT_STATE',
            status: 'ACTIVE',
            settings: {
                timezone: 'America/Mexico_City',
                language: 'es-MX',
                features: {
                    aiAnalysis: true,
                    alertSystem: true,
                    newsMonitoring: true,
                    tweetAnalysis: true,
                },
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });
    console.log(`✅ Sample tenant created: ${sampleTenant.name}`);
    const directorPassword = process.env.DIRECTOR_PASSWORD || 'DirectorComm2025!@#';
    const directorHashedPassword = await bcrypt.hash(directorPassword, 12);
    const directorUser = await prisma.user.upsert({
        where: {
            email: 'director.comunicacion@hidalgo.gob.mx',
        },
        update: {
            password: directorHashedPassword,
            status: 'ACTIVE',
            updatedAt: new Date(),
        },
        create: {
            id: crypto.randomUUID(),
            email: 'director.comunicacion@hidalgo.gob.mx',
            username: 'director_comunicacion',
            password: directorHashedPassword,
            role: 'DIRECTOR_COMUNICACION',
            status: 'ACTIVE',
            tenantId: sampleTenant.id,
            isTemporaryPassword: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });
    console.log(`✅ Director de Comunicación created with ID: ${directorUser.id}`);
    const gobernadorPassword = process.env.GOBERNADOR_PASSWORD || 'Gobernador2025!@#';
    const gobernadorHashedPassword = await bcrypt.hash(gobernadorPassword, 12);
    const gobernadorUser = await prisma.user.upsert({
        where: {
            email: 'gobernador@hidalgo.gob.mx',
        },
        update: {
            password: gobernadorHashedPassword,
            status: 'ACTIVE',
            updatedAt: new Date(),
        },
        create: {
            id: crypto.randomUUID(),
            email: 'gobernador@hidalgo.gob.mx',
            username: 'gobernador_hidalgo',
            password: gobernadorHashedPassword,
            role: 'LIDER',
            status: 'ACTIVE',
            tenantId: sampleTenant.id,
            isTemporaryPassword: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });
    console.log(`✅ Gobernador (LIDER) created with ID: ${gobernadorUser.id}`);
    console.log('🌱 Database seeding completed successfully!');
    console.log('');
    console.log('🔑 Login credentials:');
    console.log(`Super Admin: ${superAdminEmail} / ${superAdminPassword}`);
    console.log(`Director de Comunicación: director.comunicacion@hidalgo.gob.mx / ${directorPassword}`);
    console.log(`Gobernador: gobernador@hidalgo.gob.mx / ${gobernadorPassword}`);
    console.log('');
    console.log('🏢 Sample tenant created:');
    console.log(`ID: ${sampleTenant.id}`);
    console.log(`Name: ${sampleTenant.name}`);
    console.log(`Type: ${sampleTenant.type}`);
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map