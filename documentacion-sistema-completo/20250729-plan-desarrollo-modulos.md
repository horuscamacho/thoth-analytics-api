# PLAN DE DESARROLLO POR MÓDULOS - THOTH ANALYTICS API
**Fecha:** 29 de Julio 2025  
**Objetivo:** Demo funcional en 12-16 semanas  
**Metodología:** Desarrollo modular con entregas incrementales

## RESUMEN EJECUTIVO

El desarrollo se divide en **8 módulos principales** que se construyen de forma incremental, permitiendo tener funcionalidad básica desde la semana 4 y un MVP completo en la semana 12.

---

## MÓDULOS DE DESARROLLO

### **MÓDULO 1: INFRAESTRUCTURA BASE**
**Duración:** 1 semana  
**Dependencias:** Ninguna

**Entregables:**
- Setup inicial de proyecto NestJS
- Configuración PostgreSQL + Prisma
- Docker Compose para desarrollo
- Estructura de carpetas y convenios
- CI/CD básico con GitHub Actions

**Definición de "Hecho":**
- Proyecto corre localmente con `docker-compose up`
- Base de datos conectada y migraciones funcionando
- Estructura base de módulos NestJS

---

### **MÓDULO 2: AUTENTICACIÓN Y MULTI-TENANCY**
**Duración:** 2 semanas  
**Dependencias:** Módulo 1

**Entregables:**
- Sistema de login con JWT
- Refresh tokens
- Multi-factor authentication (MFA)
- Middleware de tenant isolation
- CRUD de usuarios básico
- Guards y decorators de autorización

**Definición de "Hecho":**
- Login funcional con MFA
- Tokens con expiración correcta
- Queries automáticamente filtradas por tenant_id
- Tests unitarios > 80% cobertura

---

### **MÓDULO 3: INTEGRACIÓN SCRAPER PYTHON**
**Duración:** 1.5 semanas  
**Dependencias:** Módulo 2

**Entregables:**
- API endpoints para recibir tweets
- Validación y sanitización de datos
- Deduplicación por content hash
- Creación automática de jobs en queue
- Healthcheck del scraper

**Definición de "Hecho":**
- Endpoint POST /api/tweets/bulk funcional
- Tweets guardados con todos los campos
- Jobs creados en ai_processing_queue
- Integración probada con scraper real

---

### **MÓDULO 4: PROCESAMIENTO IA (GPT-4 Mini)**
**Duración:** 2 semanas  
**Dependencias:** Módulo 3

**Entregables:**
- Integración con OpenAI API
- Worker para procesar queue
- Prompts optimizados para análisis
- Manejo de errores y retry logic
- Cache de resultados similares

**Definición de "Hecho":**
- Análisis automático de tweets/noticias
- Resultados guardados en ai_analysis
- Costos < $0.50 USD por 1000 análisis
- Retry automático si falla

---

### **MÓDULO 5: DASHBOARD Y VISUALIZACIÓN**
**Duración:** 3 semanas  
**Dependencias:** Módulos 2, 4

**Entregables:**
- API endpoints para dashboard
- Métricas en tiempo real
- Filtros por fecha/fuente/sentiment
- Paginación y búsqueda
- WebSocket para actualizaciones
- Optimización de queries

**Definición de "Hecho":**
- Dashboard muestra datos en tiempo real
- Filtros funcionando correctamente
- Performance < 200ms por query
- WebSocket conectado y estable

---

### **MÓDULO 6: SISTEMA DE ALERTAS**
**Duración:** 2 semanas  
**Dependencias:** Módulos 4, 5

**Entregables:**
- Motor de reglas para alertas
- Detección de activación artificial
- Sistema de notificaciones multi-canal
- Agrupación inteligente de alertas
- Configuración por usuario/rol

**Definición de "Hecho":**
- Alertas se generan automáticamente
- Push notifications llegando a Expo
- Alertas agrupadas correctamente
- UI para gestionar alertas

---

### **MÓDULO 7: EXTRACTOR DE NOTICIAS**
**Duración:** 1.5 semanas  
**Dependencias:** Módulo 3

**Entregables:**
- Microservicio Python para extracción
- Configuración de selectores por medio
- Manejo de diferentes layouts
- Queue de extracción funcional
- Resolución de URLs cortas

**Definición de "Hecho":**
- Extrae contenido de 7 medios demo
- Precisión > 95% en extracción
- Maneja errores gracefully
- Performance < 5s por noticia

---

### **MÓDULO 8: ANÁLISIS AVANZADO Y CLUSTERING**
**Duración:** 2 semanas  
**Dependencias:** Módulos 4, 6

**Entregables:**
- Generación de embeddings
- Clustering por similitud
- Análisis de reactivación
- Detección de campañas
- Dashboard de patrones

**Definición de "Hecho":**
- Clustering cada 30 minutos
- Detección de campañas artificiales
- Alertas de escalamiento viral
- Métricas de precisión > 85%

---

## FASES DE DESARROLLO

### **FASE 1: FUNDACIÓN (Semanas 1-3)**
- Módulo 1: Infraestructura Base
- Módulo 2: Autenticación (inicio)

**Milestone:** Sistema base con auth funcionando

### **FASE 2: INTEGRACIÓN (Semanas 4-6)**
- Módulo 2: Autenticación (fin)
- Módulo 3: Integración Scraper
- Módulo 7: Extractor (paralelo)

**Milestone:** Datos fluyendo al sistema

### **FASE 3: INTELIGENCIA (Semanas 7-9)**
- Módulo 4: Procesamiento IA
- Módulo 5: Dashboard (inicio)

**Milestone:** Análisis automático funcionando

### **FASE 4: VISUALIZACIÓN (Semanas 10-12)**
- Módulo 5: Dashboard (fin)
- Módulo 6: Sistema de Alertas

**Milestone:** MVP completo y funcional

### **FASE 5: OPTIMIZACIÓN (Semanas 13-16)**
- Módulo 8: Análisis Avanzado
- Testing integral
- Optimización de performance
- Documentación

**Milestone:** Sistema listo para demo

---

## RECURSOS NECESARIOS

### **Equipo de Desarrollo:**
- 1 Full Stack Developer (NestJS/TypeScript)
- 1 Python Developer (Scraper/Extractor)
- 1 DevOps (part-time para infraestructura)

### **Infraestructura:**
- AWS Free Tier (EC2 t2.micro)
- PostgreSQL local
- Redis local
- OpenAI API credits (~$50 USD)

### **Herramientas:**
- GitHub para código
- Docker para contenedores
- Postman para testing APIs
- Grafana para monitoreo (opcional)

---

## RIESGOS Y MITIGACIONES

### **RIESGO 1: Cambios en APIs de Twitter/Medios**
- **Probabilidad:** Alta
- **Impacto:** Medio
- **Mitigación:** Arquitectura flexible de selectores

### **RIESGO 2: Costos de OpenAI mayores a esperado**
- **Probabilidad:** Media
- **Impacto:** Alto
- **Mitigación:** Cache agresivo, batch processing

### **RIESGO 3: Performance con volumen de datos**
- **Probabilidad:** Media
- **Impacto:** Alto
- **Mitigación:** Índices optimizados, paginación

### **RIESGO 4: Complejidad de clustering**
- **Probabilidad:** Alta
- **Impacto:** Medio
- **Mitigación:** Empezar simple, iterar

---

## CRITERIOS DE ÉXITO

### **MVP (Semana 12):**
- ✅ 7 medios scrapeados continuamente
- ✅ Análisis IA < 5 segundos
- ✅ Dashboard funcional en iPad
- ✅ Alertas básicas funcionando
- ✅ 3 tenants de prueba

### **DEMO (Semana 16):**
- ✅ 99% uptime durante demo
- ✅ Detección de campaña artificial
- ✅ Clustering mostrando patrones
- ✅ Costo total < $50 USD/mes
- ✅ Performance fluida en iPad

---

## ENTREGABLES POR SEMANA

**Semana 1:** Infraestructura base  
**Semana 2:** Auth básico  
**Semana 3:** Multi-tenancy + MFA  
**Semana 4:** Integración scraper  
**Semana 5:** Extractor funcionando  
**Semana 6:** Queue procesamiento  
**Semana 7:** IA análisis básico  
**Semana 8:** IA optimizada  
**Semana 9:** Dashboard API  
**Semana 10:** Dashboard UI  
**Semana 11:** WebSockets  
**Semana 12:** Alertas básicas  
**Semana 13:** Clustering  
**Semana 14:** Campañas detección  
**Semana 15:** Testing + bugs  
**Semana 16:** Demo preparada  

---

**Nota:** Este plan es flexible y puede ajustarse según el progreso real y feedback durante el desarrollo.