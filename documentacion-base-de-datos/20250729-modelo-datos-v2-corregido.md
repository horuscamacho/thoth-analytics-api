# MODELO DE DATOS CORREGIDO - THOTH ANALYTICS API
**Fecha:** 29 de Julio 2025  
**Versión:** v2.1 - Sprint 2 Completado + Sistema de Auditoría  
**Base de Datos:** PostgreSQL con Prisma ORM

## 📊 ESTADO DE IMPLEMENTACIÓN SPRINT 2 (30 JUL 2025)

### **✅ MÓDULO 2 - AUTH & MULTI-TENANCY (85% COMPLETADO)**
- ✅ **Sistema de Autenticación**: JWT, login/logout, refresh tokens
- ✅ **RBAC**: Roles DIRECTOR_COMUNICACION, LIDER, DIRECTOR_AREA, ASISTENTE  
- ✅ **Multi-tenancy**: Aislamiento completo de datos por tenant
- ✅ **CRUD Usuarios**: Crear, suspender, reactivar, eliminar con auditoría
- ✅ **CRUD Tenants**: Gestión completa de entidades gubernamentales
- ✅ **Seguridad**: Bcrypt, contraseñas temporales, guards, middlewares
- 🚧 **Sistema de Auditoría**: Logs básicos implementados, faltan endpoints avanzados

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

## 🆕 SISTEMA DE AUDITORÍA AVANZADO (v2.1)

### **NUEVA TABLA `audit_logs` - PRÓXIMA IMPLEMENTACIÓN:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES users(id), -- NULL para acciones del sistema
  
  -- Información de la acción
  action VARCHAR(100) NOT NULL, -- USER_CREATED, USER_SUSPENDED, LOGIN, etc.
  entity_type VARCHAR(50) NOT NULL, -- user, tenant, tweet, news, etc.
  entity_id UUID, -- ID del objeto afectado
  
  -- Detalles de la acción
  old_values JSONB, -- Estado anterior del objeto
  new_values JSONB, -- Estado nuevo del objeto
  metadata JSONB, -- Información adicional (IP, user agent, etc.)
  
  -- Contexto de seguridad
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  client_fingerprint VARCHAR(255),
  
  -- Integridad y firma
  checksum VARCHAR(64) NOT NULL, -- SHA-256 del contenido
  digital_signature TEXT, -- Firma digital para immutabilidad
  
  -- Timestamps
  performed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Clasificación de seguridad
  security_level ENUM('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'SECRET') DEFAULT 'INTERNAL',
  
  -- Índices para búsquedas optimizadas
  CONSTRAINT chk_audit_logs_valid_action CHECK (action ~ '^[A-Z_]+$')
);

-- Índices optimizados para queries de auditoría
CREATE INDEX idx_audit_logs_tenant_performed ON audit_logs(tenant_id, performed_at DESC);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_ip ON audit_logs(ip_address, performed_at) WHERE ip_address IS NOT NULL;
CREATE INDEX idx_audit_logs_checksum ON audit_logs(checksum); -- Para verificar integridad

-- Función para calcular checksum automáticamente
CREATE OR REPLACE FUNCTION calculate_audit_checksum()
RETURNS TRIGGER AS $$
BEGIN
    NEW.checksum = encode(sha256(
        (COALESCE(NEW.tenant_id::text, '') || 
         COALESCE(NEW.user_id::text, '') ||
         NEW.action ||
         NEW.entity_type ||
         COALESCE(NEW.entity_id::text, '') ||
         COALESCE(NEW.old_values::text, '') ||
         COALESCE(NEW.new_values::text, '') ||
         NEW.performed_at::text)::bytea
    ), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular checksum automáticamente
CREATE TRIGGER audit_logs_checksum_trigger
    BEFORE INSERT ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_audit_checksum();
```

### **ENDPOINTS DE AUDITORÍA A IMPLEMENTAR:**
```typescript
// AuditController endpoints
GET    /audit/logs              // Consultar logs con filtros
GET    /audit/logs/:id          // Detalle de log específico
GET    /audit/export/:format    // Exportar logs (CSV, PDF, JSON)
GET    /audit/stats             // Estadísticas de auditoría
GET    /audit/dashboard         // Métricas para dashboard
POST   /audit/verify            // Verificar integridad de logs
GET    /audit/anomalies         // Detectar actividades sospechosas
```

### **QUERIES DE AUDITORÍA AVANZADAS:**

#### **1. Detectar actividades sospechosas:**
```sql
-- Múltiples intentos de login fallidos
SELECT 
  ip_address,
  COUNT(*) as failed_attempts,
  MIN(performed_at) as first_attempt,
  MAX(performed_at) as last_attempt
FROM audit_logs
WHERE 
  action = 'LOGIN_FAILED'
  AND performed_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) >= 5;

-- Accesos fuera del horario laboral
SELECT *
FROM audit_logs
WHERE 
  action IN ('LOGIN', 'USER_CREATED', 'USER_DELETED')
  AND (EXTRACT(hour FROM performed_at) < 6 OR EXTRACT(hour FROM performed_at) > 22)
  AND performed_at > NOW() - INTERVAL '7 days';
```

#### **2. Auditoría por usuario:**
```sql
-- Actividad completa de un usuario
SELECT 
  al.action,
  al.entity_type,
  al.performed_at,
  al.ip_address,
  al.metadata->>'reason' as reason
FROM audit_logs al
WHERE al.user_id = :user_id
ORDER BY al.performed_at DESC
LIMIT 100;
```

#### **3. Verificación de integridad:**
```sql
-- Verificar que todos los logs tienen checksum válido
SELECT 
  id,
  checksum,
  encode(sha256(
    (COALESCE(tenant_id::text, '') || 
     COALESCE(user_id::text, '') ||
     action ||
     entity_type ||
     COALESCE(entity_id::text, '') ||
     COALESCE(old_values::text, '') ||
     COALESCE(new_values::text, '') ||
     performed_at::text)::bytea
  ), 'hex') as calculated_checksum
FROM audit_logs
WHERE checksum != encode(sha256(
  (COALESCE(tenant_id::text, '') || 
   COALESCE(user_id::text, '') ||
   action ||
   entity_type ||
   COALESCE(entity_id::text, '') ||
   COALESCE(old_values::text, '') ||
   COALESCE(new_values::text, '') ||
   performed_at::text)::bytea
), 'hex');
```

### **IMPLEMENTACIÓN DE SERVICIOS:**
```typescript
// AuditService - Métodos principales
class AuditService {
  // Crear log de auditoría
  async createAuditLog(data: CreateAuditLogDto): Promise<AuditLog>
  
  // Consultar logs con filtros
  async getLogs(filters: AuditFilters): Promise<AuditLog[]>
  
  // Exportar logs en diferentes formatos
  async exportLogs(format: 'csv' | 'pdf' | 'json', filters: AuditFilters): Promise<Buffer>
  
  // Obtener estadísticas
  async getAuditStats(tenantId: string): Promise<AuditStats>
  
  // Detectar anomalías
  async detectAnomalies(tenantId: string): Promise<AuditAnomaly[]>
  
  // Verificar integridad
  async verifyIntegrity(tenantId: string): Promise<IntegrityReport>
}
```

---

## MIGRATIONS NECESARIAS

```bash
# Migration Sprint 2 - Fase 1 (Completado)
npx prisma migrate dev --name add_auth_multitenancy_system

# Migration Sprint 2 - Fase 2 (Próximo)
npx prisma migrate dev --name add_audit_system

# Generar migration para v2.1 (tweets + queues + audit)
npx prisma migrate dev --name add_tweet_fields_queues_and_audit

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