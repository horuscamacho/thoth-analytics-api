# MODELO DE DATOS CORREGIDO - THOTH ANALYTICS API
**Fecha:** 29 de Julio 2025  
**Versión:** v2.0 - Correcciones y Adiciones  
**Base de Datos:** PostgreSQL con Prisma ORM

## REGISTRO DE CAMBIOS (v1.0 → v2.0)

### **RAZÓN DE LOS CAMBIOS:**
Durante la revisión colaborativa se identificaron omisiones críticas:
1. **Falta de campos multimedia en tweets** - No se capturaban hashtags, menciones, imágenes o videos
2. **Ausencia de queues de procesamiento IA** - No estaba claro cómo se procesaban los análisis
3. **Sin tracking de engagement** - No se guardaban métricas de interacción social

### **CAMBIOS REALIZADOS:**

#### **1. TABLA `tweets` - CAMPOS AGREGADOS:**
```sql
-- NUEVOS CAMPOS AGREGADOS A TWEETS
hashtags TEXT[],                    -- Crítico para detectar tendencias
mentions TEXT[],                    -- Identificar a quién mencionan
media_urls JSONB,                   -- URLs de imágenes/videos del tweet
media_count INTEGER DEFAULT 0,      -- Cantidad de media attachments
retweet_count INTEGER DEFAULT 0,    -- Métricas de viralidad
like_count INTEGER DEFAULT 0,       -- Engagement metrics
reply_count INTEGER DEFAULT 0,      -- Conversación generada
is_retweet BOOLEAN DEFAULT false,   -- Identificar contenido original
original_tweet_id VARCHAR(100),     -- Rastrear fuente original
language VARCHAR(10) DEFAULT 'es',  -- Filtrar por idioma
location_mentioned TEXT             -- Ubicaciones en el texto
```

**JUSTIFICACIÓN:**
- **hashtags**: Esenciales para análisis de tendencias y campañas coordinadas
- **mentions**: Identificar actores políticos mencionados
- **media_urls**: Las imágenes/videos pueden contener información crítica
- **engagement metrics**: Medir viralidad real vs artificial
- **location_mentioned**: Geolocalización para alertas municipales

#### **2. NUEVA TABLA `ai_processing_queue`:**
```sql
CREATE TABLE ai_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Referencia al contenido a procesar
  tweet_id UUID REFERENCES tweets(id),
  news_id UUID REFERENCES news(id),
  
  queue_type ENUM(
    'tweet_analysis',      -- Solo tweet sin noticia
    'news_analysis',       -- Tweet + noticia completa
    'cluster_analysis',    -- Análisis grupal cada 30 min
    'reactivation_check'   -- Verificar campañas artificiales
  ) NOT NULL,
  
  priority INTEGER DEFAULT 5, -- 1-10 (1 = máxima prioridad)
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  
  -- Control de procesamiento
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP,
  
  -- Resultados y errores
  error_message TEXT,
  error_details JSONB,
  
  -- Referencias a resultados
  analysis_id UUID REFERENCES ai_analysis(id),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CHECK (tweet_id IS NOT NULL OR news_id IS NOT NULL)
);

-- Índices para performance
CREATE INDEX idx_ai_queue_status_priority ON ai_processing_queue(status, priority);
CREATE INDEX idx_ai_queue_tenant ON ai_processing_queue(tenant_id);
CREATE INDEX idx_ai_queue_scheduled ON ai_processing_queue(scheduled_for);
```

**JUSTIFICACIÓN:**
- **Control de flujo**: Saber exactamente qué está pendiente de procesar
- **Priorización**: Procesar primero contenido crítico
- **Retry logic**: Reintentar si falla OpenAI API
- **Auditoría**: Track completo de qué se procesó y cuándo

#### **3. NUEVA TABLA `tweet_media`:**
```sql
CREATE TABLE tweet_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tweet_id UUID NOT NULL REFERENCES tweets(id),
  media_type ENUM('image', 'video', 'gif') NOT NULL,
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER, -- Para videos
  alt_text TEXT, -- Texto alternativo para accesibilidad
  width INTEGER,
  height INTEGER,
  file_size_bytes INTEGER,
  
  -- Análisis futuro de media
  contains_text BOOLEAN, -- ¿Tiene texto en la imagen?
  ocr_text TEXT, -- Texto extraído si aplica
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas por tweet
CREATE INDEX idx_tweet_media_tweet_id ON tweet_media(tweet_id);
```

**JUSTIFICACIÓN:**
- **Análisis visual**: Muchas campañas usan imágenes con texto
- **OCR futuro**: Preparado para extraer texto de imágenes
- **Evidencia**: Guardar pruebas visuales de desinformación

---

## DIAGRAMA ER ACTUALIZADO

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│     tenants     │────<│      users       │>────│   user_roles    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         
         │                       │                         
         ▼                       ▼                         
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  media_sources  │────<│  tweets (v2)     │>────│   tweet_media   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                 │                         │
                                 ▼                         ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  news_mentions   │────>│      news       │
                        └──────────────────┘     └─────────────────┘
                                                          │
                                 ┌────────────────────────┘
                                 ▼                         
                        ┌──────────────────┐     ┌─────────────────┐
                        │ ai_processing_   │────>│  ai_analysis    │
                        │     queue        │     └─────────────────┘
                        └──────────────────┘              │
                                                          ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │     alerts       │     │  alert_history  │
                        └──────────────────┘     └─────────────────┘
```

---

## FLUJO DE PROCESAMIENTO CON QUEUES

### **1. INGESTA DE TWEETS:**
```sql
-- Cuando llega un tweet del scraper Python
BEGIN;
  -- 1. Insertar tweet con todos los campos nuevos
  INSERT INTO tweets (
    media_source_id, twitter_id, content, author,
    hashtags, mentions, media_urls, media_count,
    retweet_count, like_count, reply_count,
    published_at
  ) VALUES (...) RETURNING id;
  
  -- 2. Insertar media si existe
  INSERT INTO tweet_media (tweet_id, media_type, media_url, ...)
  SELECT ... FROM jsonb_array_elements(media_urls);
  
  -- 3. Crear job de procesamiento IA
  INSERT INTO ai_processing_queue (
    tenant_id, tweet_id, queue_type, priority
  ) VALUES (
    current_tenant_id, 
    new_tweet_id,
    CASE 
      WHEN urls IS NOT NULL THEN 'news_analysis'
      ELSE 'tweet_analysis'
    END,
    5 -- prioridad normal
  );
COMMIT;
```

### **2. WORKER DE PROCESAMIENTO (Bull Queue):**
```typescript
// Worker que procesa la queue cada X segundos
async function processAIQueue() {
  // 1. Obtener siguiente item
  const item = await db.ai_processing_queue.findFirst({
    where: { 
      status: 'pending',
      scheduled_for: { lte: new Date() }
    },
    orderBy: [
      { priority: 'asc' },
      { created_at: 'asc' }
    ]
  });
  
  // 2. Marcar como procesando
  await db.ai_processing_queue.update({
    where: { id: item.id },
    data: { 
      status: 'processing',
      processing_started_at: new Date()
    }
  });
  
  // 3. Procesar con GPT-4 Mini
  const analysis = await analyzeWithAI(item);
  
  // 4. Guardar resultado
  const result = await db.ai_analysis.create({
    data: { ...analysis }
  });
  
  // 5. Actualizar queue
  await db.ai_processing_queue.update({
    where: { id: item.id },
    data: { 
      status: 'completed',
      analysis_id: result.id,
      processing_completed_at: new Date()
    }
  });
}
```

### **3. ANÁLISIS DE CLUSTERING (Cada 30 min):**
```sql
-- Crear jobs de clustering periódicamente
INSERT INTO ai_processing_queue (
  tenant_id, 
  queue_type, 
  priority,
  scheduled_for
)
SELECT DISTINCT 
  tenant_id,
  'cluster_analysis',
  3, -- Alta prioridad
  NOW() + INTERVAL '30 minutes'
FROM ai_analysis
WHERE created_at > NOW() - INTERVAL '2 hours';
```

---

## QUERIES OPTIMIZADAS

### **1. Obtener tweets con hashtags trending:**
```sql
SELECT 
  hashtag,
  COUNT(*) as frequency,
  COUNT(DISTINCT media_source_id) as unique_sources
FROM tweets, unnest(hashtags) as hashtag
WHERE 
  tenant_id = :tenant_id
  AND published_at > NOW() - INTERVAL '2 hours'
GROUP BY hashtag
HAVING COUNT(*) > 3
ORDER BY frequency DESC;
```

### **2. Detectar reactivación artificial:**
```sql
WITH tweet_groups AS (
  SELECT 
    n.content_hash,
    COUNT(DISTINCT t.media_source_id) as sources,
    COUNT(*) as mentions,
    MAX(t.published_at) - MIN(t.published_at) as time_span
  FROM tweets t
  JOIN news_mentions nm ON t.id = nm.tweet_id
  JOIN news n ON nm.news_id = n.id
  WHERE t.published_at > NOW() - INTERVAL '2 hours'
  GROUP BY n.content_hash
)
SELECT * FROM tweet_groups
WHERE mentions >= 3 AND time_span < INTERVAL '2 hours';
```

---

## JUSTIFICACIÓN TÉCNICA DE DECISIONES

### **¿Por qué queues en base de datos vs Redis?**
1. **Persistencia**: No perder jobs si Redis falla
2. **Auditoría**: Track completo de procesamiento
3. **Queries complejas**: Priorización por múltiples factores
4. **Transaccionalidad**: Atomicidad con el resto de datos

### **¿Por qué media_urls como JSONB?**
1. **Flexibilidad**: Twitter puede cambiar estructura
2. **Performance**: PostgreSQL optimiza JSONB
3. **Queries**: Permite búsquedas dentro del JSON

### **¿Por qué tabla separada tweet_media?**
1. **Normalización**: Un tweet puede tener N imágenes
2. **Análisis futuro**: OCR, detección de objetos
3. **Performance**: No cargar media si no es necesario

---

## MIGRATIONS NECESARIAS

```bash
# Generar migration para v2
npx prisma migrate dev --name add_tweet_fields_and_queues

# SQL manual si es necesario
ALTER TABLE tweets 
ADD COLUMN hashtags TEXT[],
ADD COLUMN mentions TEXT[],
ADD COLUMN media_urls JSONB DEFAULT '{}',
ADD COLUMN media_count INTEGER DEFAULT 0,
ADD COLUMN retweet_count INTEGER DEFAULT 0,
ADD COLUMN like_count INTEGER DEFAULT 0,
ADD COLUMN reply_count INTEGER DEFAULT 0,
ADD COLUMN is_retweet BOOLEAN DEFAULT false,
ADD COLUMN original_tweet_id VARCHAR(100),
ADD COLUMN language VARCHAR(10) DEFAULT 'es',
ADD COLUMN location_mentioned TEXT;

-- Crear índices para performance
CREATE INDEX idx_tweets_hashtags ON tweets USING gin(hashtags);
CREATE INDEX idx_tweets_mentions ON tweets USING gin(mentions);
```

---

**RESUMEN:** Esta versión 2.0 corrige las omisiones críticas identificadas durante la revisión, agregando soporte completo para multimedia, hashtags, menciones y un sistema robusto de queues para procesamiento IA. Todos los cambios están justificados por necesidades específicas del sistema de inteligencia gubernamental.