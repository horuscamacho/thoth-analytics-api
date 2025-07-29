# ARQUITECTURA COMPLETA - THOTH ANALYTICS API
**Fecha:** 29 de Julio 2025  
**Versión:** v1.0 - Arquitectura MVP Demo  
**Objetivo:** Sistema funcional con costo mínimo para demo con 7 medios

## RESUMEN EJECUTIVO

Sistema de inteligencia gubernamental para monitoreo y análisis de medios en tiempo real, con detección de amenazas, campañas de desinformación y gestión de crisis comunicacional.

### **Stack Tecnológico Definido:**
- **Backend:** NestJS + TypeScript
- **Base de Datos:** PostgreSQL + **Prisma ORM (ÚNICO)**
- **Cache/Queues:** Redis + Bull Queue
- **Tiempo Real:** WebSockets + Socket.IO
- **IA:** OpenAI GPT-4 Mini
- **Scraping:** Python + FastAPI (microservicio)
- **Frontend:** Expo (iPad) - Ya existente
- **Deployment:** Docker + AWS Free Tier

---

## ARQUITECTURA DE MICROSERVICIOS

### **1. SERVICIOS PRINCIPALES**

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Python Scraper │────▶│   NestJS API     │────▶│   PostgreSQL    │
│   (FastAPI)     │     │   (Main Gateway) │     │   + Prisma      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         │
         │                       ▼                         │
         │              ┌──────────────────┐              │
         └─────────────▶│  Python Extractor│              │
                        │   (FastAPI)       │              │
                        └──────────────────┘              │
                                 │                         │
                                 ▼                         ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │   Redis Cache    │     │   Bull Queues   │
                        │   + Sessions     │     │   (Background)  │
                        └──────────────────┘     └─────────────────┘
```

### **2. FLUJO DE DATOS COMPLETO**

```
1. INGESTA DE TWEETS
   Python Scraper (loop infinito) → Procesa tweets → Agrupa hilos → 
   → POST /api/tweets/bulk → NestJS

2. PROCESAMIENTO INICIAL
   NestJS recibe tweets → Verifica URL noticia →
   ├── SI tiene URL: → ExtractNewsQueue
   └── NO tiene URL: → DirectAnalysisQueue

3. EXTRACCIÓN DE NOTICIAS
   ExtractNewsQueue → Python Extractor API → 
   → Extrae contenido con selectores del medio →
   → Retorna a NestJS → Actualiza estado

4. ANÁLISIS IA
   Contenido completo → GPT-4 Mini →
   → Análisis unificado (riesgo + resumen + sentiment) →
   → Guarda en DB → WebSocket notify

5. DETECCIÓN DE PATRONES
   Cada 30 min → Clustering por embeddings →
   → Si cluster > 3 noticias en 2 horas →
   → Análisis grupal → Alerta activación artificial
```

---

## SISTEMA MULTI-TENANT

### **Estrategia: Tenant ID en todas las tablas**

```typescript
// Cada registro incluye tenant_id
interface MultiTenantEntity {
  id: string;
  tenant_id: string; // 'estatal_aguascalientes', 'municipal_guadalajara'
  entity_type: 'estatal' | 'municipal' | 'individual';
  // ... resto de campos
}
```

### **Aislamiento de datos:**
- Filtrado automático por tenant_id en todas las queries
- WebSocket rooms separados por tenant
- Cache keys con prefijo de tenant
- Configuración independiente por entidad

---

## PIPELINE DE INTELIGENCIA ARTIFICIAL

### **1. ANÁLISIS INDIVIDUAL (Inmediato)**

```typescript
// Prompt unificado para análisis completo
const UNIFIED_ANALYSIS_PROMPT = `
[Contexto del analista experto en inteligencia gubernamental]
[Datos de la noticia y tweet]
[Instrucciones específicas de análisis]
[Formato JSON de respuesta requerido]
`;
```

### **2. ANÁLISIS GRUPAL (Cada 30 minutos)**

```typescript
// Clustering por embeddings
const clusteringPipeline = {
  1: 'Generar embeddings con text-embedding-3-small',
  2: 'Agrupar noticias similares (threshold 0.85)',
  3: 'Si cluster > 3 en 2 horas → Análisis de campaña',
  4: 'Detectar activación artificial → Alerta CRITICAL'
};
```

### **3. DEDUPLICACIÓN INTELIGENTE**

```typescript
// Hash de contenido para evitar duplicados
const contentHash = sha256(newsContent);
// Si ya existe → Crear "mención hijo"
// Análisis de reactivación cada 30 min
```

---

## SISTEMA DE ALERTAS Y NOTIFICACIONES

### **Canales de Entrega:**
1. **WebSocket** - Tiempo real en dashboard
2. **Push Notifications** - Expo para iPad
3. **Email** - Solo alertas críticas
4. **SMS** - Emergencias (opcional)

### **Niveles de Alerta:**
- 🟢 **INFO** - Monitoreo rutinario
- 🟡 **WARNING** - Requiere atención
- 🟠 **HIGH** - Acción recomendada  
- 🔴 **CRITICAL** - Acción inmediata

### **Reglas de Activación Artificial:**
- 3+ menciones en 2 horas = Análisis de reactivación
- Copys idénticos + timing sospechoso = CRITICAL
- Alertas agrupadas para evitar saturación

---

## DEPLOYMENT MVP (COSTO MÍNIMO)

### **Infraestructura AWS Free Tier:**

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    
  nestjs-api:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
      
  python-scraper:
    build: ./scraper
    environment:
      SCRAPE_INTERVAL: continuous
      
  python-extractor:
    build: ./extractor
    ports:
      - "8000:8000"
```

### **Costos Estimados (Demo):**
- AWS EC2 t2.micro: $0 (free tier 12 meses)
- OpenAI GPT-4 Mini: ~$40 MXN/mes (7 medios)
- **Total: ~$40-50 MXN/mes**

### **Optimizaciones para Demo:**
1. Cache agresivo de análisis IA (24h)
2. Solo procesar headlines < 24h
3. Scraping cada 30 min vs continuo
4. Batch processing de 20 noticias

---

## SEGURIDAD Y COMPLIANCE

### **Autenticación y Autorización:**
- JWT con refresh tokens
- MFA obligatorio para todos los roles
- Sesiones con timeout por rol
- Logs inmutables de auditoría

### **Encriptación:**
- TLS 1.3 para datos en tránsito
- AES-256 para datos en reposo
- E2E para chat jerárquico
- Backup encriptado automático

### **Compliance Gubernamental:**
- Retención de logs 7 años
- Auditoría completa de accesos
- Aislamiento total entre tenants
- Protección de datos clasificados

---

## MÉTRICAS DE ÉXITO

### **Performance:**
- API response < 200ms p95
- Scraper cycle < 30 min (7 medios)
- AI processing < 5s per news
- Alert delivery < 10s critical

### **Disponibilidad:**
- 99.9% uptime objetivo
- RPO: 1 hora
- RTO: 4 horas
- Backup cada 6 horas

### **Capacidad Demo:**
- 7 medios simultáneos
- 150 noticias/día
- 10 usuarios concurrentes
- 3 tenants de prueba

---

## PRÓXIMOS PASOS POST-DEMO

### **Fase 1 → 2 (Escalamiento):**
1. Migrar a Kubernetes
2. PostgreSQL managed (RDS)
3. Redis Cluster
4. Multi-region deployment

### **Mejoras Planeadas:**
1. Análisis predictivo con ML
2. Detección de deepfakes
3. Integración con más fuentes
4. API pública para terceros

---

**Nota:** Esta arquitectura está optimizada para demostrar valor con inversión mínima, manteniendo la capacidad de escalar sin cambios estructurales mayores.