import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  // Create Super Admin user
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
      tenantId: null, // Super admin doesn't belong to any tenant
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Super Admin created with ID: ${superAdmin.id}`);

  // Create sample tenant (Estado de Hidalgo)
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

  // Create sample Director de Comunicación for the tenant
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
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Director de Comunicación created with ID: ${directorUser.id}`);

  // Create sample Gobernador (LIDER)
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
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Gobernador (LIDER) created with ID: ${gobernadorUser.id}`);

  // Create sample media source
  const mediaSource = await prisma.mediaSource.upsert({
    where: {
      id: 'dummy-media-source-001',
    },
    update: {
      name: 'Test Media Source',
      updatedAt: new Date(),
    },
    create: {
      id: 'dummy-media-source-001',
      name: 'Test Media Source',
      type: 'NEWS_WEBSITE',
      baseUrl: 'https://example.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Media source created: ${mediaSource.name}`);

  // Create sample tweet for testing
  const sampleTweet = await prisma.tweet.upsert({
    where: {
      id: 'dummy-tweet-001',
    },
    update: {
      content: 'Nuevo programa gubernamental para educación digital en México. El gobierno anunció inversión de 5 mil millones de pesos para beneficiar a 2 millones de estudiantes. #EducacionDigital #Mexico',
      updatedAt: new Date(),
    },
    create: {
      id: 'dummy-tweet-001',
      tenantId: sampleTenant.id,
      tweetId: 'tweet-12345',
      mediaSourceId: mediaSource.id,
      authorName: 'Gobierno de México',
      authorHandle: '@GobiernoMX',
      content: 'Nuevo programa gubernamental para educación digital en México. El gobierno anunció inversión de 5 mil millones de pesos para beneficiar a 2 millones de estudiantes. #EducacionDigital #Mexico',
      publishedAt: new Date(),
      hashtags: ['EducacionDigital', 'Mexico', 'Gobierno'],
      mentions: ['@SEP_mx', '@SCT_mx'],
      mediaCount: 0,
      retweetCount: 124,
      likeCount: 456,
      replyCount: 23,
      isRetweet: false,
      language: 'es',
      contentHash: crypto.createHash('sha256').update('dummy-tweet-content').digest('hex'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Sample tweet created with ID: ${sampleTweet.id}`);

  // Create sample news for testing
  const sampleNews = await prisma.news.upsert({
    where: {
      id: '3406fa27-8b3a-468f-b12a-a03413f17cc4',
    },
    update: {
      title: 'Nuevo programa gubernamental para educación digital en México',
      updatedAt: new Date(),
    },
    create: {
      id: '3406fa27-8b3a-468f-b12a-a03413f17cc4',
      tenantId: sampleTenant.id,
      tweetId: sampleTweet.id,
      mediaSourceId: mediaSource.id,
      title: 'Nuevo programa gubernamental para educación digital en México',
      content: 'El gobierno mexicano anunció hoy un ambicioso programa de educación digital que beneficiará a más de 2 millones de estudiantes en todo el país. La iniciativa incluye la distribución de tablets, capacitación docente y mejora de infraestructura tecnológica en escuelas públicas. El presupuesto asignado es de 5 mil millones de pesos y se implementará durante los próximos 3 años. Los estados priorizados son Oaxaca, Chiapas y Guerrero, donde los índices de conectividad son menores. La Secretaría de Educación Pública coordinará el programa junto con la Secretaría de Comunicaciones y Transportes.',
      url: 'https://example.com/news/educacion-digital',
      extractedAt: new Date(),
      contentHash: crypto.createHash('sha256').update('dummy-news-content').digest('hex'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Sample news created with ID: ${sampleNews.id}`);

  console.log('🌱 Database seeding completed successfully!');
  console.log('');
  console.log('🔑 Login credentials:');
  console.log(`Super Admin: ${superAdminEmail} / ${superAdminPassword}`);
  console.log(
    `Director de Comunicación: director.comunicacion@hidalgo.gob.mx / ${directorPassword}`,
  );
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
