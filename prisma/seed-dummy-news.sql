-- Insert dummy MediaSource if not exists
INSERT INTO "public"."media_sources" (id, name, type, "baseUrl", "isActive", "createdAt", "updatedAt")
VALUES (
  'dummy-media-source-001',
  'Test Media Source',
  'NEWS_WEBSITE',
  'https://example.com',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert dummy Tweet if not exists  
INSERT INTO "public"."tweets" (
  id, 
  "tenantId", 
  "tweetId", 
  "mediaSourceId",
  "authorName",
  "authorHandle", 
  content, 
  "publishedAt",
  hashtags,
  mentions,
  "mediaCount",
  "retweetCount",
  "likeCount",
  "replyCount",
  "isRetweet",
  language,
  "contentHash",
  "createdAt", 
  "updatedAt"
)
VALUES (
  'dummy-tweet-001',
  'hidalgo-gobierno-estatal',
  'tweet-12345',
  'dummy-media-source-001',
  'Test User',
  '@test_user',
  'Test tweet content',
  NOW(),
  ARRAY['test', 'dummy']::text[],
  ARRAY['@user1', '@user2']::text[],
  0,
  0,
  0,
  0,
  false,
  'es',
  md5('test-tweet-content'),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert dummy News with the specific ID from the curl request
INSERT INTO "public"."news" (
  id, 
  "tenantId", 
  "tweetId", 
  "mediaSourceId", 
  title, 
  content, 
  url, 
  "extractedAt", 
  "contentHash", 
  "createdAt", 
  "updatedAt"
)
VALUES (
  '3406fa27-8b3a-468f-b12a-a03413f17cc4', -- The ID from your curl request
  'hidalgo-gobierno-estatal',
  'dummy-tweet-001',
  'dummy-media-source-001',
  'Nuevo programa gubernamental para educación digital en México',
  'El gobierno mexicano anunció hoy un ambicioso programa de educación digital que beneficiará a más de 2 millones de estudiantes en todo el país. La iniciativa incluye la distribución de tablets, capacitación docente y mejora de infraestructura tecnológica en escuelas públicas. El presupuesto asignado es de 5 mil millones de pesos y se implementará durante los próximos 3 años. Los estados priorizados son Oaxaca, Chiapas y Guerrero, donde los índices de conectividad son menores. La Secretaría de Educación Pública coordinará el programa junto con la Secretaría de Comunicaciones y Transportes.',
  'https://example.com/news/educacion-digital',
  NOW(),
  md5('dummy-news-content-hash'),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;