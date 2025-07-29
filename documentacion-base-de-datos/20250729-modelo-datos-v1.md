# MODELO DE DATOS - THOTH ANALYTICS API
**Fecha:** 29 de Julio 2025  
**Versión:** v1.0 - Estructura de Base de Datos  
**Base de Datos:** PostgreSQL con Prisma ORM

## DIAGRAMA ER PRINCIPAL

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│     tenants     │────<│      users       │>────│   user_roles    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         
         │                       │                         
         ▼                       ▼                         
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  media_sources  │────<│     tweets       │>────│      news       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                 │                         │
                                 │                         ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  news_mentions   │────>│  ai_analysis    │
                        └──────────────────┘     └─────────────────┘
                                                          │
                                 ┌────────────────────────┘
                                 ▼                         
                        ┌──────────────────┐     ┌─────────────────┐
                        │     alerts       │     │  alert_history  │
                        └──────────────────┘     └─────────────────┘
```

---

## TABLAS PRINCIPALES

### **1. TENANTS** (Multi-tenancy)
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL, -- 'estatal_aguascalientes'
  name VARCHAR(255) NOT NULL, -- 'Gobierno de Aguascalientes'
  entity_type ENUM('estatal', 'municipal', 'individual') NOT NULL,
  config JSONB NOT NULL DEFAULT '{}', -- Configuración específica
  status ENUM('active', 'suspended', 'trial') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_tenants_code ON tenants(code);
CREATE INDEX idx_tenants_entity_type ON tenants(entity_type);
```

### **2. USERS** (Usuarios del sistema)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('director_comunicacion', 'lider', 'director_area', 'asistente') NOT NULL,
  hierarchy_level INTEGER NOT NULL, -- 1=máximo, 4=mínimo
  status ENUM('active', 'suspended', 'inactive') DEFAULT 'active',
  last_login TIMESTAMP,
  mfa_enabled BOOLEAN DEFAULT true,
  mfa_secret VARCHAR(255),
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraint único por tenant
  UNIQUE(tenant_id, email)
);

-- Índices
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### **3. MEDIA_SOURCES** (Medios de comunicación)
```sql
CREATE TABLE media_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  twitter_handle VARCHAR(100),
  source_type ENUM('local', 'national') NOT NULL,
  credibility_score DECIMAL(3,2) DEFAULT 0.50, -- 0.00 a 1.00
  geographic_scope VARCHAR(100)[], -- ['aguascalientes', 'nacional']
  extraction_config JSONB NOT NULL DEFAULT '{}', -- Selectores CSS
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_media_sources_domain ON media_sources(domain);
CREATE INDEX idx_media_sources_source_type ON media_sources(source_type);
```

### **4. TWEETS** (Tweets scrapeados)
```sql
CREATE TABLE tweets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_source_id UUID NOT NULL REFERENCES media_sources(id),
  twitter_id VARCHAR(100) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(100) NOT NULL,
  urls TEXT[], -- URLs encontradas en el tweet
  thread_id VARCHAR(100), -- Para agrupar hilos
  thread_position INTEGER, -- Posición en el hilo
  published_at TIMESTAMP NOT NULL,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_tweets_media_source ON tweets(media_source_id);
CREATE INDEX idx_tweets_published_at ON tweets(published_at);
CREATE INDEX idx_tweets_thread_id ON tweets(thread_id);
```

### **5. NEWS** (Noticias extraídas)
```sql
CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA256 del contenido
  original_url TEXT NOT NULL,
  final_url TEXT, -- Después de resolver redirects
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(255),
  published_at TIMESTAMP,
  extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  extraction_status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
  word_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_news_content_hash ON news(content_hash);
CREATE INDEX idx_news_published_at ON news(published_at);
CREATE INDEX idx_news_extraction_status ON news(extraction_status);
```

### **6. NEWS_MENTIONS** (Relación tweets-noticias)
```sql
CREATE TABLE news_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES news(id),
  tweet_id UUID NOT NULL REFERENCES tweets(id),
  mention_type ENUM('original', 'reactivation', 'organic_share') NOT NULL,
  tweet_copy TEXT NOT NULL, -- El texto específico del tweet
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Una noticia puede ser mencionada múltiples veces
  UNIQUE(news_id, tweet_id)
);

-- Índices
CREATE INDEX idx_news_mentions_news_id ON news_mentions(news_id);
CREATE INDEX idx_news_mentions_tweet_id ON news_mentions(tweet_id);
CREATE INDEX idx_news_mentions_type ON news_mentions(mention_type);
```

### **7. AI_ANALYSIS** (Análisis de IA)
```sql
CREATE TABLE ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID REFERENCES news(id),
  tweet_id UUID REFERENCES tweets(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  analysis_type ENUM('individual', 'cluster', 'reactivation') NOT NULL,
  
  -- Resultados del análisis
  risk_level ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  risk_factors TEXT[],
  risk_confidence DECIMAL(3,2), -- 0.00 a 1.00
  
  sentiment_score ENUM('positive', 'neutral', 'negative') NOT NULL,
  sentiment_confidence DECIMAL(3,2),
  sentiment_reasoning TEXT,
  
  summary TEXT NOT NULL,
  entities_mentioned TEXT[],
  geographic_impact TEXT[],
  urgency_score INTEGER CHECK (urgency_score >= 0 AND urgency_score <= 10),
  
  threat_indicators JSONB DEFAULT '{}', -- Bot activity, campaigns, etc
  recommended_actions TEXT[],
  requires_immediate_attention BOOLEAN DEFAULT false,
  
  -- Metadata
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  model_used VARCHAR(50) DEFAULT 'gpt-4-mini',
  processing_time_ms INTEGER,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraint: debe tener news_id O tweet_id
  CHECK (news_id IS NOT NULL OR tweet_id IS NOT NULL)
);

-- Índices
CREATE INDEX idx_ai_analysis_news_id ON ai_analysis(news_id);
CREATE INDEX idx_ai_analysis_tweet_id ON ai_analysis(tweet_id);
CREATE INDEX idx_ai_analysis_tenant_id ON ai_analysis(tenant_id);
CREATE INDEX idx_ai_analysis_risk_level ON ai_analysis(risk_level);
CREATE INDEX idx_ai_analysis_created_at ON ai_analysis(created_at);
```

### **8. NEWS_CLUSTERS** (Agrupación de noticias)
```sql
CREATE TABLE news_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  cluster_type ENUM('topic', 'reactivation', 'campaign') NOT NULL,
  centroid_embedding VECTOR(1536), -- Para búsquedas similares
  news_count INTEGER NOT NULL,
  time_span_hours DECIMAL(5,2),
  sources_involved INTEGER,
  
  -- Análisis del cluster
  campaign_probability DECIMAL(3,2),
  viral_potential INTEGER CHECK (viral_potential >= 1 AND viral_potential <= 10),
  escalation_velocity ENUM('natural', 'accelerated', 'suspicious'),
  
  analysis_result JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación
CREATE TABLE cluster_news (
  cluster_id UUID NOT NULL REFERENCES news_clusters(id),
  news_id UUID NOT NULL REFERENCES news(id),
  similarity_score DECIMAL(3,2),
  PRIMARY KEY (cluster_id, news_id)
);

-- Índices
CREATE INDEX idx_news_clusters_tenant_id ON news_clusters(tenant_id);
CREATE INDEX idx_news_clusters_created_at ON news_clusters(created_at);
```

### **9. ALERTS** (Sistema de alertas)
```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES users(id), -- NULL = para todos los usuarios del tenant
  
  alert_type VARCHAR(50) NOT NULL, -- 'artificial_activation', 'viral_escalation', etc
  severity ENUM('info', 'warning', 'high', 'critical') NOT NULL,
  
  -- Contexto de la alerta
  related_news_ids UUID[],
  related_cluster_id UUID REFERENCES news_clusters(id),
  
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}', -- Datos adicionales
  
  -- Estado
  status ENUM('active', 'acknowledged', 'resolved', 'dismissed') DEFAULT 'active',
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  
  -- Entrega
  channels VARCHAR(20)[] DEFAULT ARRAY['websocket', 'push'], -- Canales de entrega
  delivered_at JSONB DEFAULT '{}', -- {"websocket": "2025-07-29T10:00:00Z"}
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP -- Para auto-dismiss
);

-- Índices
CREATE INDEX idx_alerts_tenant_id ON alerts(tenant_id);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
```

### **10. CHAT_MESSAGES** (Sistema de chat E2E)
```sql
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  room_type ENUM('direct', 'crisis', 'alert_based') NOT NULL,
  
  -- Contexto opcional
  related_news_id UUID REFERENCES news(id),
  related_alert_id UUID REFERENCES alerts(id),
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_participants (
  room_id UUID NOT NULL REFERENCES chat_rooms(id),
  user_id UUID NOT NULL REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read TIMESTAMP,
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  message_encrypted TEXT NOT NULL, -- Mensaje cifrado E2E
  message_type ENUM('text', 'file', 'system') DEFAULT 'text',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_chat_rooms_tenant_id ON chat_rooms(tenant_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
```

### **11. EXTRACTION_QUEUE** (Cola de extracción)
```sql
CREATE TABLE extraction_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tweet_id UUID NOT NULL REFERENCES tweets(id),
  news_url TEXT NOT NULL,
  media_source_id UUID NOT NULL REFERENCES media_sources(id),
  
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  error_message TEXT,
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_extraction_queue_status ON extraction_queue(status);
CREATE INDEX idx_extraction_queue_created_at ON extraction_queue(created_at);
```

### **12. AUDIT_LOGS** (Logs de auditoría)
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  
  action VARCHAR(100) NOT NULL, -- 'user.login', 'alert.acknowledged', etc
  entity_type VARCHAR(50), -- 'user', 'news', 'alert'
  entity_id UUID,
  
  ip_address INET,
  user_agent TEXT,
  
  changes JSONB, -- Cambios realizados
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices (optimizados para búsquedas de auditoría)
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

---

## RELACIONES CLAVE

### **Multi-tenancy:**
- Todas las tablas principales incluyen `tenant_id`
- Los usuarios pertenecen a un solo tenant
- Los análisis y alertas son específicos por tenant

### **Flujo de datos:**
1. `tweets` → `news_mentions` → `news`
2. `news` → `ai_analysis` → `alerts`
3. `news` → `news_clusters` → análisis grupal

### **Jerarquía de usuarios:**
- `users.role` + `users.hierarchy_level` definen permisos
- Chat restringido por jerarquía
- Alertas configurables por rol

---

## ÍNDICES Y OPTIMIZACIONES

### **Índices compuestos sugeridos:**
```sql
-- Para queries multi-tenant frecuentes
CREATE INDEX idx_news_tenant_date ON ai_analysis(tenant_id, created_at DESC);
CREATE INDEX idx_alerts_tenant_status ON alerts(tenant_id, status, severity);

-- Para búsquedas de texto
CREATE INDEX idx_news_fulltext ON news USING gin(to_tsvector('spanish', title || ' ' || content));
```

### **Particionamiento (futuro):**
```sql
-- Particionar audit_logs por mes
-- Particionar ai_analysis por tenant_id (cuando escale)
```

---

## MIGRATIONS PENDIENTES

```bash
# Generar migraciones con Prisma
npx prisma migrate dev --name init

# Aplicar en producción
npx prisma migrate deploy
```

---

**Nota:** Este modelo está optimizado para el MVP con capacidad de escalar. Incluye todas las relaciones necesarias para el sistema completo.