# REGISTRO DE DECISIONES TÉCNICAS - THOTH ANALYTICS API
**Fecha de inicio:** 29 de Julio 2025  
**Propósito:** Documentar todas las decisiones técnicas tomadas y su justificación

## DECISIÓN #1: Stack Tecnológico Principal
**Fecha:** 29/07/2025  
**Participantes:** Horus, Claude

### **Decisión tomada:**
- Backend: **NestJS + TypeScript**
- Base de datos: **PostgreSQL + Prisma ORM**
- Cache/Queues: **Redis + Bull Queue**
- Scraping: **Python + FastAPI** (microservicio separado)

### **Alternativas consideradas:**
1. Express.js + TypeScript
2. FastAPI + Python para todo
3. MongoDB como base de datos

### **Justificación:**
- **NestJS**: Estructura empresarial, decorators, WebSocket nativo
- **PostgreSQL**: ACID compliance crítico para datos gubernamentales
- **Python para scraping**: Ecosistema superior para web scraping
- **Microservicios**: Escalamiento independiente de componentes

---

## DECISIÓN #2: Estrategia Multi-Tenant
**Fecha:** 29/07/2025  
**Participantes:** Horus, Claude

### **Decisión tomada:**
- **Tenant ID en todas las tablas** (vs schemas separados)
- Configuración manual de qué tenants reciben qué noticias
- Medios nacionales van a TODOS los tenants

### **Justificación:**
- Más fácil de mantener con muchos tenants
- Backup y migrations unificadas
- Queries optimizadas con índices por tenant_id
- Configuración manual da control fino sobre distribución

---

## DECISIÓN #3: Procesamiento de IA
**Fecha:** 29/07/2025  
**Participantes:** Horus, Claude

### **Decisión tomada:**
- Procesamiento **síncrono** (no en background jobs separados)
- **GPT-4 Mini** para economía (~$40 MXN/mes)
- **Batch processing** de 10-20 noticias
- Análisis unificado: riesgo + resumen + sentiment en un prompt

### **Justificación:**
- GPT-4 Mini es tan barato que la simplicidad gana
- Un prompt unificado reduce llamadas a API
- Batch processing optimiza costos aún más
- Sincrónico simplifica arquitectura sin impacto real

---

## DECISIÓN #4: Sistema de Alertas
**Fecha:** 29/07/2025  
**Participantes:** Horus, Claude

### **Decisión tomada:**
- Sistema **multi-canal**: WebSocket + Push + Email
- **Push inmediato** para activación artificial
- **Alertas agrupadas** (no individuales)
- Threshold: **3+ menciones en 2 horas**

### **Justificación:**
- Push garantiza notificación inmediata en iPads
- Agrupación evita saturación de alertas
- 2 horas es ventana óptima para detectar campañas

---

## DECISIÓN #5: Deduplicación de Noticias
**Fecha:** 29/07/2025  
**Participantes:** Horus, Claude

### **Decisión tomada:**
- **Hash SHA256 del contenido** para detectar duplicados
- Crear "menciones hijo" en lugar de duplicar
- Análisis de reactivación cada 30 minutos

### **Justificación:**
- Community managers republican misma nota con diferente copy
- Detectar campañas artificiales de reactivación
- Hash garantiza detección precisa de duplicados

---

## DECISIÓN #6: Deployment MVP
**Fecha:** 29/07/2025  
**Participantes:** Horus, Claude

### **Decisión tomada:**
- **AWS Free Tier** para demo (no Oracle Cloud)
- **Docker Compose** para orquestación inicial
- Sin dominio (app Expo en iPad no lo necesita)
- Optimizaciones agresivas para reducir costos

### **Justificación:**
- AWS más familiar y documentado
- Docker facilita migración futura a Kubernetes
- Demo debe costar ~$40-50 MXN/mes máximo
- iPad app conecta directo a IP/puerto

---

## DECISIÓN #7: Correcciones al Modelo de Datos
**Fecha:** 29/07/2025  
**Participantes:** Horus, Claude

### **Problema identificado:**
"No estás extrayendo hashtags, imágenes, videos de tweets. No hay queues de procesamiento IA documentadas."

### **Decisión tomada:**
Agregar a tabla `tweets`:
- hashtags, mentions, media_urls, engagement metrics
- location_mentioned para geolocalización

Crear nueva tabla:
- `ai_processing_queue` para control de procesamiento
- `tweet_media` para almacenar multimedia

### **Justificación:**
- **Hashtags**: Críticos para detectar tendencias y campañas
- **Media**: Muchas campañas usan imágenes con texto
- **Queue en DB**: Persistencia y auditoría completa
- **Engagement**: Detectar viralidad artificial vs orgánica

---

## DECISIÓN #8: Análisis Híbrido Individual + Grupal
**Fecha:** 29/07/2025  
**Participantes:** Horus, Claude

### **Decisión tomada:**
- Análisis **individual** inmediato de cada noticia
- Análisis **grupal** cada 30 minutos
- **Clustering por embeddings** (no keywords)
- Threshold: 3+ noticias similares en 2 horas

### **Justificación:**
- Individual: alertas inmediatas de riesgos
- Grupal: detectar patrones y escalamiento
- Embeddings: más preciso que keywords
- 30 min: balance entre detección y costo

---

## DECISIONES PENDIENTES

### **Por definir:**
1. ¿Qué 7 medios específicos para la demo?
2. ¿Estructura exacta de selectores CSS por medio?
3. ¿Límites de rate limiting para APIs?
4. ¿Estrategia de respaldo si falla OpenAI?

### **Para fase 2:**
1. ¿Migración a Kubernetes cuándo?
2. ¿Multi-región necesaria?
3. ¿API pública para terceros?
4. ¿Análisis de imágenes con OCR?

---

## LECCIONES APRENDIDAS

### **Lo que funcionó bien:**
1. Definir el flujo completo antes de modelar datos
2. Pensar en costos desde el día 1
3. Documentar decisiones inmediatamente
4. Revisar y corregir colaborativamente

### **Lo que podríamos mejorar:**
1. Definir campos de BD más exhaustivamente desde inicio
2. Documentar flujos de queues más claramente
3. Considerar multimedia desde el diseño inicial

---

**Nota:** Este documento es la memoria técnica del proyecto. Cada decisión mayor debe agregarse aquí con su contexto y justificación.